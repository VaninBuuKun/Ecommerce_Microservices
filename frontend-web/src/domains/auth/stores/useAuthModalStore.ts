import { create } from "zustand";

interface AuthModalState {
	isOpen: boolean;
	title: string;
	description: string;
	redirectUrl?: string;
	openAuthModal: (options?: {
		title?: string;
		description?: string;
		redirectUrl?: string;
	}) => void;
	closeAuthModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
	isOpen: false,
	title: "Yêu cầu đăng nhập",
	description:
		"Vui lòng đăng nhập tài khoản để tiếp tục trải nghiệm đầy đủ tính năng mua sắm và kết nối cùng chúng tôi.",
	redirectUrl: undefined,

	openAuthModal: (options) => {
		set({
			isOpen: true,
			title: options?.title || "Yêu cầu đăng nhập",
			description:
				options?.description ||
				"Vui lòng đăng nhập tài khoản để tiếp tục trải nghiệm đầy đủ tính năng mua sắm và kết nối cùng chúng tôi.",
			redirectUrl: options?.redirectUrl || window.location.pathname + window.location.search,
		});
	},

	closeAuthModal: () => {
		set({ isOpen: false });
	},
}));
