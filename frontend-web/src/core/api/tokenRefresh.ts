import axios from "axios";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
    ? "/api"
    : "http://localhost:5111/api";

/**
 * Client Axios độc lập dành riêng cho các tác vụ Auth (refresh, login, logout).
 * - withCredentials: true để trình duyệt gửi kèm HttpOnly Cookie refresh_token.
 * - Không gắn Bearer Token Interceptor để tránh gửi kèm Access Token đã hết hạn lên server.
 */
export const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, //kèm cookie http only
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

/**
 * Singleton Refresh Token Handler.
 * Đảm bảo tại một thời điểm chỉ có DUY NHẤT 1 request refresh được gửi lên server,
 * tránh vi phạm cơ chế xoay vòng Refresh Token (Token Rotation - TokenUsage.OneTimeOnly) của IdentityServer.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await authClient.post("/app-auth/refresh");
      const data = response.data?.value || response.data;
      const newAccessToken = data?.accessToken || data;

      if (newAccessToken && typeof newAccessToken === "string") {
        useAuthStore.getState().setAccessToken(newAccessToken);
        return newAccessToken;
      }

      return null;
    } catch (error: any) {
      const status = error?.response?.status;
      // ⚠️ CHỈ xóa phiên khi server thực sự từ chối Refresh Token (401 Unauthorized hoặc 400 Bad Request)
      // Tuyệt đối KHÔNG xóa phiên khi là lỗi kết nối mạng (Network Error) hoặc server 5xx đang khởi động lại.
      if (status === 401 || status === 400) {
        console.warn("Phiên đăng nhập đã hết hạn hoặc Refresh Token không hợp lệ. Đang đăng xuất an toàn.");
        useAuthStore.getState().clearState();
      } else {
        console.warn("Không thể làm mới token do lỗi mạng hoặc server tạm thời không phản hồi:", error?.message);
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
