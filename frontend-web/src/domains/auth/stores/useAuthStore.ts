import { create } from "zustand";

export interface UserDto {
	id: string | number;
	email: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	phoneNumber?: string;
	avatarUrl?: string;
	nickname?: string;
	gender?: string;
	birthDate?: string;
	roles?: string[];
}

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	user: UserDto | null;
	isInitializing: boolean;
	setAccessToken: (token: string | null) => void;
	setAuth: (accessToken: string | null, refreshToken?: string | null, user?: UserDto | null) => void;
	setUser: (user: UserDto | null) => void;
	clearState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: localStorage.getItem("accessToken"),
	refreshToken: localStorage.getItem("refreshToken"),
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

	setAuth: (accessToken, refreshToken = null, user = null) => {
		if (accessToken) {
			localStorage.setItem("accessToken", accessToken);
		} else {
			localStorage.removeItem("accessToken");
		}
		if (refreshToken) {
			localStorage.setItem("refreshToken", refreshToken);
		} else {
			localStorage.removeItem("refreshToken");
		}
		set({ accessToken, refreshToken, user });
	},

	setUser: (user) => {
		set({ user });
	},

	clearState: () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		set({ accessToken: null, refreshToken: null, user: null, isInitializing: false });
	},
}));
