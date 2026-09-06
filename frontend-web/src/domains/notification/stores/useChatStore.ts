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
	setConversations: (convs: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
	setActiveRoom: (room: Conversation | null) => void;
	appendMessage: (msg: ChatMessageDto) => void;
	updateMessage: (msgId: string, updates: Partial<ChatMessageDto>) => void;
	revokeMessage: (msgId: string) => void;
	reactToMessage: (msgId: string, emoji: string, senderId?: number) => void;
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
			const safeConvs = Array.isArray(state.conversations) ? state.conversations : [];
			const existing = safeConvs.find((c) => Number(c.shopId) === Number(shopId));
			if (existing) {
				const updatedRoom: Conversation = {
					...existing,
					displayName: shopName || existing.displayName,
					displayAvatar: shopAvatar || existing.displayAvatar || "",
				};
				return {
					isOpen: true,
					activeRoom: updatedRoom,
					conversations: safeConvs.map((c) =>
						c.roomId === existing.roomId ? updatedRoom : c
					),
				};
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
				conversations: [newRoom, ...safeConvs],
				activeRoom: newRoom,
			};
		});
	},
	setConversations: (convs) =>
		set((s) => ({
			conversations:
				typeof convs === "function"
					? convs(Array.isArray(s.conversations) ? s.conversations : [])
					: Array.isArray(convs)
					? convs
					: [],
		})),
	setActiveRoom: (room) =>
		set((s) => {
			if (s.activeRoom?.roomId === room?.roomId && s.messages.length > 0) {
				return { activeRoom: room };
			}
			return { activeRoom: room, messages: [] };
		}),
	appendMessage: (msg) =>
		set((s) => {
			// 1. Bỏ qua nếu tin nhắn với ID này đã tồn tại (chống lặp do nhận broadcast từ nhiều group/channel)
			if (s.messages.some((m) => m.id === msg.id)) {
				return s;
			}

			// 2. Nếu tin nhắn từ server là bản xác nhận của tin nhắn optimistic vừa gửi
			// (cùng roomId, cùng senderId, cùng content, thời gian chênh lệch < 15s)
			const optimisticIndex = s.messages.findIndex(
				(m) =>
					m.roomId === msg.roomId &&
					Number(m.senderId) === Number(msg.senderId) &&
					m.content === msg.content &&
					m.id !== msg.id &&
					Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 15000
			);

			if (optimisticIndex !== -1) {
				const updated = [...s.messages];
				updated[optimisticIndex] = msg;
				return { messages: updated };
			}

			return { messages: [...s.messages, msg] };
		}),
	updateMessage: (msgId, updates) =>
		set((s) => ({
			messages: s.messages.map((m) => (m.id === msgId ? { ...m, ...updates } : m)),
		})),
	revokeMessage: (msgId) =>
		set((s) => {
			const updatedMessages = s.messages.map((m) =>
				m.id === msgId
					? { ...m, content: "Tin nhắn đã được thu hồi", isRevoked: true, reactions: undefined }
					: m
			);
			const safeConvs = Array.isArray(s.conversations) ? s.conversations : [];
			const updatedConvs = safeConvs.map((c) =>
				c.roomId === s.activeRoom?.roomId
					? { ...c, lastMessage: "Tin nhắn đã được thu hồi", lastActiveAt: new Date().toISOString() }
					: c
			);
			return {
				messages: updatedMessages,
				conversations: updatedConvs,
			};
		}),
	reactToMessage: (msgId, emoji, _senderId) =>
		set((s) => ({
			messages: s.messages.map((m) => {
				if (m.id !== msgId) return m;
				const curReactions = { ...(m.reactions || {}) };
				const isCurrentlyReacted = m.userReaction === emoji;

				if (isCurrentlyReacted) {
					// Toggle off
					if (curReactions[emoji] > 1) {
						curReactions[emoji] -= 1;
					} else {
						delete curReactions[emoji];
					}
					return { ...m, reactions: curReactions, userReaction: undefined };
				} else {
					// If previously reacted with another emoji, decrease it
					if (m.userReaction && curReactions[m.userReaction]) {
						if (curReactions[m.userReaction] > 1) {
							curReactions[m.userReaction] -= 1;
						} else {
							delete curReactions[m.userReaction];
						}
					}
					curReactions[emoji] = (curReactions[emoji] || 0) + 1;
					return { ...m, reactions: curReactions, userReaction: emoji };
				}
			}),
		})),
	setMessages: (msgs) => set({ messages: msgs }),
	setUnreadCount: (n) => set({ unreadCount: n }),
	incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
	clearUnread: () => set({ unreadCount: 0 }),
	setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
}));

