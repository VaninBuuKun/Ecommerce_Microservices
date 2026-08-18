import axios from "axios";
import { useAuthStore, authService } from "@/domains/auth";

const API_BASE_URL = "http://localhost:5111/api";
export const STORAGE_BASE_URL =
	import.meta.env.VITE_STORAGE_BASE_URL || "http://localhost:9000";

const api = axios.create({
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
			!originalRequest.url.includes("/app-auth/refresh")
		) {
			originalRequest._retry = true;
			try {
				const newAccessToken = await authService.refresh();
				useAuthStore.getState().setAccessToken(newAccessToken);
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				useAuthStore.getState().clearState();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	},
);

export default api;
