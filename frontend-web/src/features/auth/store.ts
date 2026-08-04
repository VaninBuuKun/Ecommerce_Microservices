import { create } from "zustand";
import api from "../../shared/lib/axios";
import type { UserProfile, AuthState } from "./types";

export const useAuthStore = create<AuthState>((set, get) => ({
	accessToken: localStorage.getItem("accessToken"),
	user: null,
	isInitializing: !!localStorage.getItem("accessToken"), // Nếu có token trong máy thì set true để đợi fetch

	setAccessToken: (token) => {
		if (token) {
			localStorage.setItem("accessToken", token);
		} else {
			localStorage.removeItem("accessToken");
		}
		set({ accessToken: token });
	},

	setUser: (user) => {
		set({ user });
	},

	fetchUserProfile: async () => {
		const token = get().accessToken;
		if (!token) {
			set({ isInitializing: false });
			return null;
		}

		try {
			set({ isInitializing: true });
			const response = (await api.get("/users/me")).data;
			const profile: UserProfile = {
				id: response.id,
				email: response.email || "vanpro@example.com",
				firstName: response.firstName || "Nguyễn",
				lastName: response.lastName || "Vân",
				avatarUrl:
					response.avatarUrl ||
					"https://img-c.udemycdn.com/user/75x75/274127471_84ee_8.jpg",
			};

			set({ user: profile, isInitializing: false });
			return profile;
		} catch (error) {
			console.error(
				"Không thể fetch user profile, tiến hành đăng xuất:",
				error,
			);
			get().clearState(); // Xóa sạch token hỏng
			set({ isInitializing: false });
			return null;
		}
	},

	loginSuccess: async (token) => {
		localStorage.setItem("accessToken", token);
		set({ accessToken: token, isInitializing: true });
		await get().fetchUserProfile();
	},

	clearState: () => {
		localStorage.removeItem("accessToken");
		set({ accessToken: null, user: null, isInitializing: false });
	},
}));
