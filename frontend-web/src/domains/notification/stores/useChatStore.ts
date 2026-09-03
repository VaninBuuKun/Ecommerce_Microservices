import { create } from "zustand";
import type { Conversation, ChatMessageDto } from "../types/chat.types";

interface ChatState {
	/** Mini modal visible */
	isOpen: boolean;
	/** Conversations list */
	conversations: Conversation[];
	/** Currently selected conversation */
	activeRoom: Conversation | null;
	/** Messages of the active room */
	messages: ChatMessageDto[];
	/** Unread count badge */
	unreadCount: number;
	/** Loading flag */
	isLoadingConversations: boolean;

	// Actions
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;
	openChatWithShop: (shopId: number, shopName: string, shopAvatar?: string) => void;
	setConversations: (convs: Conversation[]) => void;
	setActiveRoom: (room: Conversation | null) => void;
	appendMessage: (msg: ChatMessageDto) => void;
	setMessages: (msgs: ChatMessageDto[]) => void;
	setUnreadCount: (n: number) => void;
	incrementUnread: () => void;
	clearUnread: () => void;
	setLoadingConversations: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
	isOpen: false,
	conversations: [],
	activeRoom: null,
	messages: [],
	unreadCount: 0,
	isLoadingConversations: false,

	openChat: () => set({ isOpen: true }),
	closeChat: () => set({ isOpen: false }),
	toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
	openChatWithShop: (shopId: number, shopName: string, shopAvatar?: string) => {
		set((state) => {
			const existing = state.conversations.find((c) => Number(c.shopId) === Number(shopId));
			if (existing) {
				return { isOpen: true, activeRoom: existing };
			}
			const newRoom: Conversation = {
				roomId: `room-shop-${shopId}`,
				shopId,
				buyerUserId: 0,
				lastMessage: "",
				lastActiveAt: new Date().toISOString(),
				displayName: shopName,
				displayAvatar: shopAvatar || "",
			};
			return {
				isOpen: true,
				conversations: [newRoom, ...state.conversations],
				activeRoom: newRoom,
			};
		});
	},
	setConversations: (convs) => set({ conversations: convs }),
	setActiveRoom: (room) => set({ activeRoom: room, messages: [] }),
	appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
	setMessages: (msgs) => set({ messages: msgs }),
	setUnreadCount: (n) => set({ unreadCount: n }),
	incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
	clearUnread: () => set({ unreadCount: 0 }),
	setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
}));

