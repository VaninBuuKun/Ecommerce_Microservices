import { create } from "zustand";
import type { AuthState } from "./types";

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: localStorage.getItem("accessToken"),
	user: null,
	isInitializing: false,

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

	clearState: () => {
		localStorage.removeItem("accessToken");
		set({ accessToken: null, user: null, isInitializing: false });
	},
}));
