import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSignalR } from "../../../shared/hooks/useSignalR";
import { storageService } from "../../../shared/services/storageService";
import api from "../../../shared/lib/axios";
import { toast } from "react-toastify";

// ─── Types ───────────────────────────────────────────────────
export interface ChatConversation {
	roomId: string;
	shopId: number;
	buyerUserId: number;
	lastMessage: string;
	lastActiveAt: string;
	displayName: string;
	displayAvatar: string;
}

export interface ChatMessage {
	id: string;
	roomId: string;
	senderId: number;
	content: string;
	sentAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function parseJwt(token: string) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join(""),
		);
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
}

// ─── Hook ────────────────────────────────────────────────────
export function useChatConnection() {
	const location = useLocation();
	const { connection, isConnected } = useSignalR();

	// Derive role from URL
	const isSeller =
		location.pathname.startsWith("/seller") &&
		!location.pathname.endsWith("/seller");

	// User identity
	const token = localStorage.getItem("accessToken") || "";
	const decoded = token ? parseJwt(token) : null;
	const userId: string =
		decoded?.sub ||
		decoded?.nameid ||
		decoded?.[
			"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
		] ||
		"0";

	// ─── State ─────────────────────────────────────────
	const [conversations, setConversations] = useState<ChatConversation[]>([]);
	const [isConversationsLoading, setIsConversationsLoading] = useState(false);
	const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
	const [currentShopId, setCurrentShopId] = useState<number | null>(null);
	const [currentShopName, setCurrentShopName] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [isUploading, setIsUploading] = useState(false);

	// Refs for latest values inside SignalR callbacks
	const currentRoomIdRef = useRef(currentRoomId);
	currentRoomIdRef.current = currentRoomId;

	// ─── Fetch conversations ───────────────────────────
	const fetchConversations = useCallback(
		async (autoSelectShopId?: number, autoSelectShopName?: string) => {
			setIsConversationsLoading(true);
			try {
				const res = await api.get(
					`/chat/conversations?isSeller=${isSeller}`,
				);
				const list: ChatConversation[] = res.data || [];
				setConversations(list);

				if (autoSelectShopId) {
					const existing = list.find(
						(c) => c.shopId === autoSelectShopId,
					);
					if (existing) {
						setCurrentRoomId(existing.roomId);
						setCurrentShopId(existing.shopId);
						setCurrentShopName(
							existing.displayName ||
								autoSelectShopName ||
								`Shop #${autoSelectShopId}`,
						);
					} else {
						setCurrentRoomId(null);
						setCurrentShopId(autoSelectShopId);
						setCurrentShopName(
							autoSelectShopName || `Shop #${autoSelectShopId}`,
						);
					}
					setMessages([]);
				}
			} catch (err) {
				console.error("Failed to load conversations", err);
			} finally {
				setIsConversationsLoading(false);
			}
		},
		[isSeller],
	);

	// ─── Select conversation ───────────────────────────
	const selectConversation = useCallback((room: ChatConversation) => {
		setCurrentRoomId((prev) => {
			if (prev === room.roomId) return prev;
			return room.roomId;
		});
		setCurrentShopId(room.shopId);
		setCurrentShopName(room.displayName);
		setMessages([]);
		setHasMore(true);
	}, []);

	// ─── Load chat history ─────────────────────────────
	const loadChatHistory = useCallback(
		async (roomId: string, isInitial = false) => {
			if (!connection) return;
			try {
				const limit = 20;
				const lastMessageId = isInitial ? null : undefined;
				const history: ChatMessage[] = await connection.invoke(
					"GetChatHistory",
					roomId,
					isInitial ? null : (messages[0]?.id || null),
					limit,
				);

				if (isInitial) {
					setMessages(history);
					setHasMore(history.length >= limit);
				} else {
					if (history.length > 0) {
						setMessages((prev) => [...history, ...prev]);
						setHasMore(history.length >= limit);
					} else {
						setHasMore(false);
					}
				}
			} catch (err) {
				console.error("Failed to get chat history", err);
			}
		},
		[connection, messages],
	);

	// ─── Join room when room changes ───────────────────
	useEffect(() => {
		if (connection && currentRoomId) {
			connection
				.invoke("JoinChatRoom", currentRoomId)
				.catch((err) =>
					console.error("Failed to join room group", err),
				);
			loadChatHistory(currentRoomId, true);
		}
	}, [connection, currentRoomId]);

	// ─── Join shop channel for seller ──────────────────
	useEffect(() => {
		if (connection && isConnected && isSeller && currentShopId) {
			connection
				.invoke("JoinShopChannel", Number(currentShopId))
				.catch((err) =>
					console.error("Failed to join shop channel", err),
				);
		}
	}, [connection, isConnected, isSeller, currentShopId]);

	// ─── Listen for realtime messages ──────────────────
	useEffect(() => {
		if (!connection) return;

		const handleMessage = (message: ChatMessage) => {
			if (message.roomId === currentRoomIdRef.current) {
				setMessages((prev) => {
					if (prev.some((m) => m.id === message.id)) return prev;
					return [...prev, message];
				});
			}
		};

		const handleNotification = () => {
			fetchConversations();
		};

		connection.on("ReceiveChatMessage", handleMessage);
		connection.on("NewChatNotification", handleNotification);

		return () => {
			connection.off("ReceiveChatMessage", handleMessage);
			connection.off("NewChatNotification", handleNotification);
		};
	}, [connection, fetchConversations]);

	// ─── Send text message ─────────────────────────────
	const sendMessage = useCallback(
		async (text: string) => {
			if (!text.trim() || !connection) return;

			const activeRoomGuid =
				currentRoomId || "00000000-0000-0000-0000-000000000000";
			const recipientId = isSeller
				? conversations.find((c) => c.roomId === currentRoomId)
						?.buyerUserId || 0
				: currentShopId;

			try {
				await connection.invoke(
					"SendChatMessage",
					activeRoomGuid,
					text.trim(),
					Number(recipientId),
					isSeller ? "ShopStaff" : "Buyer",
				);

				// Resolve room if first message
				if (!currentRoomId) {
					const res = await api.get(
						`/chat/conversations?isSeller=${isSeller}`,
					);
					const list = res.data || [];
					setConversations(list);
					const resolved = list.find(
						(c: ChatConversation) => c.shopId === currentShopId,
					);
					if (resolved) {
						setCurrentRoomId(resolved.roomId);
					}
				} else {
					fetchConversations();
				}
			} catch (err) {
				console.error("Failed to send message", err);
			}
		},
		[
			connection,
			currentRoomId,
			currentShopId,
			isSeller,
			conversations,
			fetchConversations,
		],
	);

	// ─── Upload file attachment ────────────────────────
	const sendAttachment = useCallback(
		async (file: File) => {
			if (!file || !connection) return;

			const activeRoomGuid =
				currentRoomId || "00000000-0000-0000-0000-000000000000";
			const recipientId = isSeller
				? conversations.find((c) => c.roomId === currentRoomId)
						?.buyerUserId || 0
				: currentShopId;

			setIsUploading(true);
			try {
				toast.info(`Đang upload ${file.name}...`);
				const uploadUrl = await storageService.getUploadUrl(
					file.name,
					file.type,
				);
				await storageService.uploadS3(uploadUrl, file);
				const cleanUrl = uploadUrl.split("?")[0];

				await connection.invoke(
					"SendChatMessage",
					activeRoomGuid,
					cleanUrl,
					Number(recipientId),
					isSeller ? "ShopStaff" : "Buyer",
				);

				toast.success("Gửi tệp thành công!");

				if (!currentRoomId) {
					const res = await api.get(
						`/chat/conversations?isSeller=${isSeller}`,
					);
					const list = res.data || [];
					setConversations(list);
					const resolved = list.find(
						(c: ChatConversation) => c.shopId === currentShopId,
					);
					if (resolved) {
						setCurrentRoomId(resolved.roomId);
					}
				} else {
					fetchConversations();
				}
			} catch (err) {
				console.error("Failed to upload attachment", err);
				toast.error("Không thể upload tệp. Vui lòng thử lại!");
			} finally {
				setIsUploading(false);
			}
		},
		[
			connection,
			currentRoomId,
			currentShopId,
			isSeller,
			conversations,
			fetchConversations,
		],
	);

	// ─── Scroll load older messages ────────────────────
	const loadOlderMessages = useCallback(() => {
		if (hasMore && currentRoomId) {
			loadChatHistory(currentRoomId, false);
		}
	}, [hasMore, currentRoomId, loadChatHistory]);

	return {
		// Identity
		userId,
		isSeller,
		// Conversations
		conversations,
		isConversationsLoading,
		fetchConversations,
		selectConversation,
		// Current room
		currentRoomId,
		currentShopId,
		currentShopName,
		setCurrentShopId,
		setCurrentShopName,
		// Messages
		messages,
		hasMore,
		sendMessage,
		sendAttachment,
		isUploading,
		loadOlderMessages,
		// Connection
		isConnected,
	};
}
