import axios from "axios";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";
import { authService } from "@/domains/auth/api/authApi";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
    ? "/api"
    : "http://localhost:5111/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/app-auth/refresh") &&
      !originalRequest.url?.includes("/app-auth/login")
    ) {
      originalRequest._retry = true;

      // Nếu đã có 1 request refresh đang chạy -> Dùng chung Promise để tránh nã song song nhiều request 500
      if (!refreshPromise) {
        refreshPromise = authService
          .refresh()
          .catch((refreshErr: any) => {
            const status = refreshErr?.response?.status;
            // Chỉ xóa session khi refresh token thực sự bị server từ chối (401 hoặc 400)
            // Không xóa session khi server đang restart / mất kết nối mạng
            if (status === 401 || status === 400) {
              useAuthStore.getState().clearState();
            }
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      if (!newAccessToken) {
        return Promise.reject(error);
      }

      useAuthStore.getState().setAccessToken(newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
