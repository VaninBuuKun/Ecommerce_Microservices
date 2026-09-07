import { create } from "zustand";
import type { Conversation, ChatMessageDto } from "../types/chat.types";
const isValidGuid = (id?: string) =>
	Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && id !== "00000000-0000-0000-0000-000000000000");

const getPersistedIsSeller = (): boolean => {
	try {
		return localStorage.getItem("buu_chat_is_seller") === "true";
	} catch {
		return false;
	}
};

const getPersistedSelectedShop = (): { id: number; name: string; logoUrl?: string } | null => {
	try {
		const raw = localStorage.getItem("buu_chat_selected_shop");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const getPersistedActiveRoomId = (): string | null => {
	try {
		return localStorage.getItem("buu_chat_active_room_id") || null;
	} catch {
		return null;
	}
};

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

	/** Persistent user role: Buyer (false) vs Seller (true) */
	isSeller: boolean;
	/** Persistent selected shop if in Seller mode */
	selectedShop: { id: number; name: string; logoUrl?: string } | null;
	/** Remembered active room ID to restore */
	lastActiveRoomId: string | null;

	// Actions
	openChat: () => void;
	closeChat: () => void;
	toggleChat: () => void;
	setIsSeller: (val: boolean) => void;
	setSelectedShop: (shop: { id: number; name: string; logoUrl?: string } | null) => void;
	openChatWithShop: (shopId: number, shopName: string, shopAvatar?: string) => void;
	setConversations: (convs: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
	setActiveRoom: (room: Conversation | null) => void;
	updateConversationPreview: (roomId: string, preview: string, sentAt?: string, shopId?: number, buyerUserId?: number) => void;
	appendMessage: (msg: ChatMessageDto) => void;
	updateMessage: (msgId: string, updates: Partial<ChatMessageDto>) => void;
	revokeMessage: (msgId: string) => void;
	reactToMessage: (msgId: string, emoji: string, senderId?: number) => void;
	applyServerReaction: (payload: {
		messageId: string;
		reactions?: Record<string, number>;
		lastReaction?: string;
		userReaction?: string;
		senderId: number;
		currentUserId?: number;
		emoji?: string;
	}) => void;
	setMessages: (msgs: ChatMessageDto[] | ((prev: ChatMessageDto[]) => ChatMessageDto[])) => void;
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
	isSeller: getPersistedIsSeller(),
	selectedShop: getPersistedSelectedShop(),
	lastActiveRoomId: getPersistedActiveRoomId(),

	openChat: () => set({ isOpen: true }),
	closeChat: () => set({ isOpen: false }),
	toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),

	setIsSeller: (val: boolean) => {
		try {
			localStorage.setItem("buu_chat_is_seller", String(val));
		} catch {}
		set({ isSeller: val });
	},

	setSelectedShop: (shop) => {
		try {
			if (shop) localStorage.setItem("buu_chat_selected_shop", JSON.stringify(shop));
			else localStorage.removeItem("buu_chat_selected_shop");
		} catch {}
		set({ selectedShop: shop });
	},

	openChatWithShop: (shopId: number, shopName: string, shopAvatar?: string) => {
		try {
			localStorage.setItem("buu_chat_is_seller", "false");
		} catch {}
		set((state) => {
			const safeConvs = Array.isArray(state.conversations) ? state.conversations : [];
			const existing = safeConvs.find((c) => Number(c.shopId) === Number(shopId));
			if (existing) {
				const updatedRoom: Conversation = {
					...existing,
					displayName: shopName || existing.displayName,
					displayAvatar: shopAvatar || existing.displayAvatar || "",
				};
				try {
					localStorage.setItem("buu_chat_active_room_id", updatedRoom.roomId);
				} catch {}
				return {
					isOpen: true,
					isSeller: false,
					selectedShop: null,
					activeRoom: updatedRoom,
					lastActiveRoomId: updatedRoom.roomId,
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
			try {
				localStorage.setItem("buu_chat_active_room_id", newRoom.roomId);
			} catch {}
			return {
				isOpen: true,
				isSeller: false,
				selectedShop: null,
				conversations: [newRoom, ...safeConvs],
				activeRoom: newRoom,
				lastActiveRoomId: newRoom.roomId,
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
	setActiveRoom: (room) => {
		try {
			if (room?.roomId) localStorage.setItem("buu_chat_active_room_id", room.roomId);
			else localStorage.removeItem("buu_chat_active_room_id");
		} catch {}
		set((s) => {
			const lastActiveRoomId = room?.roomId || null;
			if (!room) return { activeRoom: null, lastActiveRoomId: null, messages: [] };

			const isSameOrUpdatedRoom =
				s.activeRoom?.roomId === room.roomId ||
				(s.activeRoom &&
					s.activeRoom.shopId === room.shopId &&
					(!isValidGuid(s.activeRoom.roomId) || !isValidGuid(room.roomId)));

			if (isSameOrUpdatedRoom && s.messages.length > 0) {
				return {
					activeRoom: room,
					lastActiveRoomId,
					messages: s.messages.map((m) =>
						m.roomId === s.activeRoom?.roomId ? { ...m, roomId: room.roomId } : m
					),
				};
			}
			return { activeRoom: room, lastActiveRoomId, messages: [] };
		});
	},
	updateConversationPreview: (roomId, preview, sentAt, shopId, buyerUserId) =>
		set((s) => {
			const safeConvs = Array.isArray(s.conversations) ? [...s.conversations] : [];
			const time = sentAt || new Date().toISOString();

			// 1. So khớp cuộc hội thoại
			const idx = safeConvs.findIndex((c) => {
				// A. Khớp RoomId không phân biệt hoa thường
				if (roomId && c.roomId && c.roomId.toLowerCase() === roomId.toLowerCase()) {
					return true;
				}
				// B. Vai trò Người mua (Buyer): Mỗi shop chỉ có duy nhất 1 phòng chat 1v1
				if (!s.isSeller && shopId && c.shopId && Number(c.shopId) === Number(shopId)) {
					return true;
				}
				// C. Vai trò Người bán (Seller): Mỗi buyerUserId chỉ có 1 phòng chat với shop
				if (s.isSeller && buyerUserId && c.buyerUserId && Number(c.buyerUserId) === Number(buyerUserId)) {
					return true;
				}
				// D. Khớp ID tạm thời room-shop-
				if (shopId && Number(c.shopId) === Number(shopId) && (c.roomId?.startsWith("room-shop-") || roomId?.startsWith("room-shop-"))) {
					return true;
				}
				return false;
			});

			let updatedConvs: Conversation[];
			let updatedActiveRoom = s.activeRoom;

			if (idx !== -1) {
				const target = safeConvs[idx];
				const updated: Conversation = {
					...target,
					roomId: isValidGuid(roomId) ? roomId : target.roomId,
					lastMessage: preview,
					lastActiveAt: time,
				};
				safeConvs.splice(idx, 1);
				safeConvs.unshift(updated);
				updatedConvs = safeConvs;
			} else {
				// Nếu cuộc hội thoại chưa tồn tại trong danh sách (tin nhắn mới từ người lạ), tự động thêm vào đầu
				const newRoom: Conversation = {
					roomId: roomId || `room-shop-${shopId || Date.now()}`,
					shopId: shopId || 0,
					buyerUserId: buyerUserId || 0,
					displayName: s.isSeller ? `Khách hàng #${buyerUserId || ""}`.trim() : `Cửa hàng #${shopId || ""}`.trim(),
					displayAvatar: "",
					lastMessage: preview,
					lastActiveAt: time,
				};
				updatedConvs = [newRoom, ...safeConvs];
			}

			// Cập nhật activeRoom nếu activeRoom đang là cuộc hội thoại này
			if (
				updatedActiveRoom &&
				((roomId && updatedActiveRoom.roomId && updatedActiveRoom.roomId.toLowerCase() === roomId.toLowerCase()) ||
				 (!s.isSeller && shopId && Number(updatedActiveRoom.shopId) === Number(shopId)) ||
				 (s.isSeller && buyerUserId && Number(updatedActiveRoom.buyerUserId) === Number(buyerUserId)) ||
				 (shopId && Number(updatedActiveRoom.shopId) === Number(shopId) && updatedActiveRoom.roomId?.startsWith("room-shop-")))
			) {
				updatedActiveRoom = {
					...updatedActiveRoom,
					roomId: isValidGuid(roomId) ? roomId : updatedActiveRoom.roomId,
					lastMessage: preview,
					lastActiveAt: time,
				};
			}

			return {
				conversations: updatedConvs,
				activeRoom: updatedActiveRoom,
			};
		}),
	appendMessage: (msg) =>
		set((s) => {
			// 1. Bỏ qua nếu tin nhắn với ID này đã tồn tại (chống lặp do nhận broadcast từ nhiều group/channel)
			if (s.messages.some((m) => m.id === msg.id)) {
				return s;
			}

			// 2. Nếu tin nhắn từ server là bản xác nhận của tin nhắn optimistic vừa gửi
			// (cùng senderId, cùng content, thời gian chênh lệch < 20s, bất kể roomId là temp hay guid)
			const optimisticIndex = s.messages.findIndex(
				(m) =>
					(m.roomId?.toLowerCase() === msg.roomId?.toLowerCase() || !isValidGuid(m.roomId)) &&
					Number(m.senderId) === Number(msg.senderId) &&
					m.content === msg.content &&
					m.id !== msg.id &&
					Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 20000
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
			const targetRoom = (s.activeRoom?.roomId || "").toLowerCase();
			const updatedConvs = safeConvs.map((c) =>
				(c.roomId || "").toLowerCase() === targetRoom
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
					return { ...m, reactions: curReactions, userReaction: emoji, lastReaction: emoji };
				}
			}),
		})),
	applyServerReaction: (payload) =>
		set((s) => ({
			messages: s.messages.map((m) => {
				if (m.id !== payload.messageId) return m;
				const isMe = payload.currentUserId && Number(payload.senderId) === Number(payload.currentUserId);
				return {
					...m,
					reactions: payload.reactions ?? m.reactions,
					lastReaction: payload.lastReaction !== undefined ? payload.lastReaction : m.lastReaction,
					userReaction: isMe ? payload.userReaction : m.userReaction,
				};
			}),
		})),
	setMessages: (msgs) =>
		set((s) => ({
			messages: typeof msgs === "function" ? msgs(s.messages) : msgs,
		})),
	setUnreadCount: (n) => set({ unreadCount: n }),
	incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
	clearUnread: () => set({ unreadCount: 0 }),
	setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
}));

