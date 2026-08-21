import { create } from "zustand";

interface ChatState {
	isOpen: boolean;
	activeRoomId: string | null;
	activeShopId: number | null;
	activeShopName: string;
	openChatWithShop: (shopId: number, shopName: string, roomId?: string | null) => void;
	closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
	isOpen: false,
	activeRoomId: null,
	activeShopId: null,
	activeShopName: "",
	openChatWithShop: (shopId, shopName, roomId = null) =>
		set({
			isOpen: true,
			activeShopId: shopId,
			activeShopName: shopName,
			activeRoomId: roomId || null,
		}),
	closeChat: () =>
		set({
			isOpen: false,
			activeRoomId: null,
			activeShopId: null,
			activeShopName: "",
		}),
}));
