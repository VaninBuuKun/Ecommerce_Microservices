import api from "../../shared/lib/axios";
import { queryClient } from "../../shared/lib/react-query";
import { authQueryKeys } from "./api/queryKeys";
import { useAuthStore } from "./store";

export const authService = {
	async login(username: string, password: string): Promise<string> {
		const response = await api.post("/app-auth/login", {
			username,
			password,
		});
		const { accessToken } = response.data;

		useAuthStore.getState().setAccessToken(accessToken);
		await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });

		return accessToken;
	},

	async register(
		email: string,
		password: string,
		fullName: string,
	): Promise<any> {
		const nameParts = fullName.trim().split(" ");
		const firstName = nameParts.pop() || "";
		const lastName = nameParts.join(" ") || "Customer";

		const response = await api.post("/auth/register", {
			email,
			password,
			firstName,
			lastName,
			otp: "123456",
		});
		return response.data;
	},

	async refresh(): Promise<string> {
		const response = await api.post("/app-auth/refresh");
		const { accessToken } = response.data;
		return accessToken;
	},

	async logout(): Promise<void> {
		queryClient.removeQueries({ queryKey: authQueryKeys.me });
		useAuthStore.getState().clearState();
	},
};
