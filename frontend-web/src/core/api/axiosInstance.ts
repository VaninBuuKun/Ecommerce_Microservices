import axios from "axios";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";
import { API_BASE_URL, refreshAccessToken } from "./tokenRefresh";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      if (config.headers?.set) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      } else if (config.headers) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Khi nhận lỗi 401 Unauthorized từ server (token hết hạn):
    // Tạm giữ request này lại, thử gọi refresh token để lấy accessToken mới rồi retry
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/app-auth/refresh") &&
      !originalRequest.url?.includes("/app-auth/login")
    ) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      // Nếu refresh token thất bại (cookie 7 ngày đã hết hạn hoặc server từ chối)
      // refreshAccessToken() đã tự gọi clearState() để đăng xuất an toàn
      if (!newAccessToken) {
        return Promise.reject(error);
      }

      // Gán accessToken mới vào request bị lỗi lúc nãy và gửi lại, ví dụ query products của shop nếu mất token, thì nó xin token, xin được, gửi lại rq nx vs token đó.
      if (originalRequest.headers?.set) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      } else if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
