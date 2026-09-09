import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/core";
import * as signalR from "@microsoft/signalr";

import { useAuthStore } from "@/domains/auth";
import type { Conversation, ChatMessageItem, ChatThemePreset, ChatReplyQuote } from "@/domains/notification";
import {
	CHAT_THEME_PRESETS,
	DEFAULT_CHAT_THEME,
	getChatTheme,
	useChatMediaUpload,
	parseMediaUrls,
	formatReplyMessage,
	ChatConversationList,
	ChatMessageArea,
	ChatRightSidebar,
	parseReplyMessage,
} from "@/domains/notification";
import { ChatImageViewer, type ChatImageViewerSlide } from "@/shared/components";
import { ensureSignalRConnected } from "@/shared/hooks/useSignalR";

export function ChatPage() {
	const [searchParams] = useSearchParams();
	const targetShopIdParam = searchParams.get("shopId");
	const sellerQuery = searchParams.get("seller");
	const isSeller = sellerQuery !== null
		? sellerQuery === "true"
		: (typeof window !== "undefined" && localStorage.getItem("buu_chat_is_seller") === "true");

	useEffect(() => {
		try {
			localStorage.setItem("buu_chat_is_seller", String(isSeller));
		} catch {}
	}, [isSeller]);

	const { user } = useAuthStore();
	const currentUserId = user?.id || 0;

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeRoom, setActiveRoom] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<ChatMessageItem[]>([]);
	const messagesRef = useRef<ChatMessageItem[]>(messages);
	messagesRef.current = messages;

	const isSellerRef = useRef(isSeller);
	isSellerRef.current = isSeller;

	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const isSendingRef = useRef(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [replyingToMessage, setReplyingToMessage] = useState<ChatMessageItem | null>(null);

	// Lightbox viewer
	const [lightboxIndex, setLightboxIndex] = useState(-1);

	// Right Sidebar Details & Views
	const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
	const [rightSidebarView, setRightSidebarView] = useState<"main" | "resources" | "theme">("main");
	const [resourceActiveTab, setResourceActiveTab] = useState<"media" | "files">("media");

	// Accordion states in Main View
	const [isThemeAccordionOpen, setIsThemeAccordionOpen] = useState(true);
	const [isResourceAccordionOpen, setIsResourceAccordionOpen] = useState(true);

	// Theme preset state (Confirmed vs Preview for live preview & cancel & DB persistence)
	const [confirmedPreset, setConfirmedPreset] = useState<ChatThemePreset>(() =>
		getChatTheme(activeRoom?.themeColor, activeRoom?.backgroundColor)
	);
	const [previewPreset, setPreviewPreset] = useState<ChatThemePreset>(() =>
		getChatTheme(activeRoom?.themeColor, activeRoom?.backgroundColor)
	);
	const [isApplyingTheme, setIsApplyingTheme] = useState(false);

	const [isMuted, setIsMuted] = useState(false);
	const [showMessageSearch, setShowMessageSearch] = useState(false);
	const [messageSearchQuery, setMessageSearchQuery] = useState("");

	const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
	const activeRoomRef = useRef(activeRoom);
	activeRoomRef.current = activeRoom;

	// Background S3 Media Uploader: Tải ngầm lên S3, hỗ trợ nhiều file, gom nhóm gửi tối đa 3 tin nhắn
	const {
		pendingMediaList,
		handleSelectFiles,
		removePendingMedia,
		removePendingMediaList,
		clearAllPendingMedia,
		waitForPendingUploads,
	} = useChatMediaUpload();

	// Active preset: Khi đang ở view "theme", dùng previewPreset để live preview trực tiếp
	const activePreset = rightSidebarView === "theme" ? previewPreset : confirmedPreset;

	// Kiểm tra xem preset có thay đổi so với đã lưu không
	const hasThemeChanged = previewPreset.id !== confirmedPreset.id;

	// Đồng bộ chủ đề đã lưu khi activeRoom thay đổi
	useEffect(() => {
		if (!activeRoom) return;
		const preset = getChatTheme(activeRoom.themeColor, activeRoom.backgroundColor);
		setConfirmedPreset(preset);
		setPreviewPreset(preset);
	}, [activeRoom?.roomId, activeRoom?.themeColor, activeRoom?.backgroundColor]);

	// Mở subview đổi màu
	const handleOpenThemeCustomizer = () => {
		setPreviewPreset(confirmedPreset);
		setRightSidebarView("theme");
	};

	// Lưu chủ đề màu vào Backend DB
	const handleApplyTheme = async () => {
		if (!activeRoom) return;

		setIsApplyingTheme(true);
		try {
			await api.put(`/chat/rooms/${activeRoom.roomId}/theme`, {
				themeColor: previewPreset.id,
				backgroundColor: previewPreset.isDark ? "dark" : previewPreset.id,
			});

			setConfirmedPreset(previewPreset);

			// Cập nhật room trong state hiện tại
			const updatedRoom: Conversation = {
				...activeRoom,
				themeColor: previewPreset.id,
				backgroundColor: previewPreset.isDark ? "dark" : previewPreset.id,
			};
			setActiveRoom(updatedRoom);
			setConversations((prev) =>
				prev.map((c) => (c.roomId === updatedRoom.roomId ? updatedRoom : c))
			);

			toast.success("Đã áp dụng và lưu chủ đề mới cho phòng chat!");
			setRightSidebarView("main");
		} catch (err) {
			console.error("Lỗi khi lưu theme:", err);
			// Vẫn cho phép preview áp dụng ở client
			setConfirmedPreset(previewPreset);
			toast.info("Đã áp dụng chủ đề màu cho phiên hiện tại.");
			setRightSidebarView("main");
		} finally {
			setIsApplyingTheme(false);
		}
	};

	// Hủy bỏ và hoàn tác màu cũ
	const handleCancelTheme = () => {
		setPreviewPreset(confirmedPreset);
		setRightSidebarView("main");
	};

	// Helper kiểm tra Guid hợp lệ
	const isValidGuid = (id?: string) =>
		Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && id !== "00000000-0000-0000-0000-000000000000");

	// Helper cập nhật tin nhắn cuối cùng và đưa cuộc hội thoại lên đầu danh sách
	const updateConversationItem = useCallback(
		(roomId: string, previewText: string, sentAt?: string, shopId?: number, buyerUserId?: number) => {
			const time = sentAt || new Date().toISOString();
			const currentIsSeller = isSellerRef.current;

			setConversations((prev) => {
				const safe = Array.isArray(prev) ? [...prev] : [];
				const idx = safe.findIndex((c) => {
					// 1. Khớp theo roomId không phân biệt hoa thường
					if (roomId && c.roomId && c.roomId.toLowerCase() === roomId.toLowerCase()) {
						return true;
					}
					// 2. Vai trò Người mua (Buyer): Mỗi shop chỉ có đúng 1 phòng chat 1v1
					if (!currentIsSeller && shopId && c.shopId && Number(c.shopId) === Number(shopId)) {
						return true;
					}
					// 3. Vai trò Người bán (Seller): Mỗi khách hàng (buyerUserId) có 1 phòng chat
					if (currentIsSeller && buyerUserId && c.buyerUserId && Number(c.buyerUserId) === Number(buyerUserId)) {
						return true;
					}
					// 4. Khớp phụ theo shopId nếu roomId là dạng tạm thời room-shop-
					if (shopId && Number(c.shopId) === Number(shopId) && (c.roomId?.startsWith("room-shop-") || roomId?.startsWith("room-shop-"))) {
						return true;
					}
					return false;
				});

				if (idx !== -1) {
					const target = safe[idx];
					const updated: Conversation = {
						...target,
						roomId: isValidGuid(roomId) ? roomId : target.roomId,
						lastMessage: previewText,
						lastActiveAt: time,
					};
					safe.splice(idx, 1);
					safe.unshift(updated);
					return safe;
				} else {
					// Cuộc hội thoại mới chưa có trong danh sách -> tạo mới và đưa lên đầu
					const newConv: Conversation = {
						roomId: roomId || `room-shop-${shopId || Date.now()}`,
						shopId: shopId || 0,
						buyerUserId: buyerUserId || 0,
						displayName: currentIsSeller ? `Khách hàng #${buyerUserId || ""}`.trim() : `Cửa hàng #${shopId || ""}`.trim(),
						displayAvatar: "",
						lastMessage: previewText,
						lastActiveAt: time,
					};
					return [newConv, ...safe];
				}
			});

			// Đồng thời cập nhật activeRoom nếu đang ở trong phòng này
			setActiveRoom((prev) => {
				if (!prev) return prev;
				const isCurrent =
					(roomId && prev.roomId && prev.roomId.toLowerCase() === roomId.toLowerCase()) ||
					(!currentIsSeller && shopId && Number(prev.shopId) === Number(shopId)) ||
					(currentIsSeller && buyerUserId && Number(prev.buyerUserId) === Number(buyerUserId)) ||
					(shopId && Number(prev.shopId) === Number(shopId) && prev.roomId?.startsWith("room-shop-"));

				if (isCurrent) {
					return {
						...prev,
						roomId: isValidGuid(roomId) ? roomId : prev.roomId,
						lastMessage: previewText,
						lastActiveAt: time,
					};
				}
				return prev;
			});
		},
		[]
	);

	const updateConversationItemRef = useRef(updateConversationItem);
	updateConversationItemRef.current = updateConversationItem;

	// Đồng bộ phòng chat active vào localStorage để ghi nhớ khi refresh/quay lại
	useEffect(() => {
		if (activeRoom?.roomId && isValidGuid(activeRoom.roomId)) {
			try {
				localStorage.setItem("buu_chat_active_room_id", activeRoom.roomId);
			} catch {}
		}
	}, [activeRoom?.roomId]);

	// Fetch Conversations
	const fetchConversations = async () => {
		try {
			setIsLoading(true);
			const res = await api.get("/chat/conversations", { params: { isSeller } });
			const list: Conversation[] = res.data?.value || res.data || [];

			if (targetShopIdParam && !isSeller) {
				const existing = list.find((c) => String(c.shopId) === targetShopIdParam);
				if (!existing) {
					const targetShopIdNum = Number(targetShopIdParam);
					const newRoom: Conversation = {
						roomId: `room-shop-${targetShopIdParam}`,
						shopId: targetShopIdNum,
						buyerUserId: currentUserId,
						lastMessage: "",
						lastActiveAt: new Date().toISOString(),
						displayName: `Cửa hàng #${targetShopIdParam}`,
						displayAvatar: "",
					};
					const fullList = [newRoom, ...list];
					setConversations(fullList);
					setActiveRoom(newRoom);
					return;
				}
			}

			setConversations(list);

			if (list.length > 0) {
				const rememberedRoomId = localStorage.getItem("buu_chat_active_room_id");
				if (targetShopIdParam) {
					const found = list.find((c) => String(c.shopId) === targetShopIdParam);
					setActiveRoom(found || list[0]);
				} else if (rememberedRoomId) {
					const remembered = list.find((c) => c.roomId?.toLowerCase() === rememberedRoomId.toLowerCase());
					setActiveRoom(remembered || list[0]);
				} else {
					setActiveRoom(list[0]);
				}
			}
		} catch (err: any) {
			console.error("Lỗi khi tải danh sách hội thoại:", err);
			setConversations([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchConversations();
	}, [targetShopIdParam, isSeller]);

	// Initialize SignalR Hub Connection using singleton
	useEffect(() => {
		let isMounted = true;

		const setupConnection = async () => {
			const connection = await ensureSignalRConnected();
			if (!connection || !isMounted) return;
			hubConnectionRef.current = connection;
			console.log("[SignalR ChatPage] Connected to notification hub successfully");

			// Nếu đã có activeRoom, join room ngay khi kết nối thành công
			const currentRoom = activeRoomRef.current;
			if (currentRoom && isValidGuid(currentRoom.roomId)) {
				connection.invoke("JoinChatRoom", currentRoom.roomId).catch(() => {});
			}

			const handleReceiveChatMessage = (msg: any) => {
				setMessages((prev) => {
					// 1. Tránh lặp nếu tin nhắn với ID này đã tồn tại
					if (prev.some((m) => m.id === msg.id)) return prev;

					// 2. Thay thế tin nhắn optimistic tạm thời nếu vừa gửi
					const optimisticIndex = prev.findIndex(
						(m) =>
							(m.roomId?.toLowerCase() === msg.roomId?.toLowerCase() || !isValidGuid(m.roomId)) &&
							Number(m.senderId) === Number(msg.senderId) &&
							m.content === msg.content &&
							m.id !== msg.id &&
							Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 20000
					);

					const newMsg: ChatMessageItem = {
						id: msg.id || String(Date.now()),
						roomId: msg.roomId,
						senderId: msg.senderId,
						content: msg.content,
						messageType: msg.messageType || "Text",
						sentAt: msg.sentAt || new Date().toISOString(),
						replyToMessageId: msg.replyToMessageId || undefined,
						replyToContent: msg.replyToContent || undefined,
						replyToSenderName: msg.replyToSenderName || undefined,
					};

					if (optimisticIndex !== -1) {
						const updated = [...prev];
						updated[optimisticIndex] = newMsg;
						return updated;
					}

					return [...prev, newMsg];
				});

				// Cập nhật roomId cho activeRoom nếu trước đó là id tạm thời
				const cur = activeRoomRef.current;
				if (cur && (!isValidGuid(cur.roomId) || cur.roomId?.toLowerCase() === msg.roomId?.toLowerCase()) && (cur.shopId === msg.shopId || cur.roomId?.toLowerCase() === msg.roomId?.toLowerCase())) {
					if (!isValidGuid(cur.roomId)) {
						setActiveRoom({ ...cur, roomId: msg.roomId });
					}
				}

				// Đồng bộ danh sách cuộc hội thoại và đẩy lên đầu danh sách
				let preview = msg.content;
				const type = (msg.messageType || "").toLowerCase();
				if (type === "sticker") preview = "[Sticker 3D]";
				else if (type === "gif") preview = "[Ảnh GIF]";
				else if (type === "image") {
					const count = parseMediaUrls(msg.content).length;
					preview = count > 1 ? `Đã gửi ${count} ảnh` : "Đã gửi 1 ảnh";
				} else if (type === "video") {
					const count = parseMediaUrls(msg.content).length;
					preview = count > 1 ? `Đã gửi ${count} video` : "Đã gửi 1 video";
				} else {
					const { text } = parseReplyMessage(msg.content);
					preview = text || msg.content;
				}

				updateConversationItemRef.current(msg.roomId, preview, msg.sentAt, msg.shopId, msg.buyerUserId);
			};

			const handleReceiveMessageRevoked = (data: { id: string; roomId: string; content: string }) => {
				if (data?.id) {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === data.id ? { ...m, content: "Tin nhắn đã được thu hồi", isRevoked: true } : m
						)
					);
					const targetRoom = (data.roomId || "").toLowerCase();
					setConversations((prev) =>
						prev.map((c) =>
							(c.roomId || "").toLowerCase() === targetRoom
								? { ...c, lastMessage: "Tin nhắn đã được thu hồi", lastActiveAt: new Date().toISOString() }
								: c
						)
					);
				}
			};

			const handleReceiveMessageReaction = (data: {
				messageId: string;
				roomId: string;
				emoji: string;
				senderId: number;
				reactions?: Record<string, number>;
				lastReaction?: string;
				userReaction?: string;
			}) => {
				if (data?.messageId) {
					setMessages((prev) =>
						prev.map((m) => {
							if (m.id !== data.messageId) return m;
							const isMine = Number(data.senderId) === currentUserId;
							return {
								...m,
								reactions: data.reactions ?? m.reactions,
								lastReaction: data.lastReaction !== undefined ? data.lastReaction : m.lastReaction,
								userReaction: isMine ? data.userReaction : m.userReaction,
							};
						})
					);
				}
			};

			connection.on("ReceiveChatMessage", handleReceiveChatMessage);
			connection.on("ReceiveMessageRevoked", handleReceiveMessageRevoked);
			connection.on("ReceiveMessageReaction", handleReceiveMessageReaction);

			return () => {
				connection.off("ReceiveChatMessage", handleReceiveChatMessage);
				connection.off("ReceiveMessageRevoked", handleReceiveMessageRevoked);
				connection.off("ReceiveMessageReaction", handleReceiveMessageReaction);
			};
		};

		let cleanup: (() => void) | undefined;
		setupConnection().then((fn) => {
			cleanup = fn;
		});

		return () => {
			isMounted = false;
			cleanup?.();
		};
	}, [currentUserId]);

	// Join Active Room & Load Chat History
	useEffect(() => {
		if (!activeRoom) return;

		if (!isValidGuid(activeRoom.roomId)) {
			setMessages([]);
			return;
		}

		const roomId = activeRoom.roomId;

		// 1. Tải lịch sử qua REST API (ngay lập tức, độc lập với SignalR)
		api.get(`/chat/rooms/${roomId}/messages`)
			.then((res) => {
				const list: ChatMessageItem[] = res.data?.value || res.data || [];
				setMessages((prev) => {
					if (prev.length > 0 && list.length === 0) {
						return prev;
					}
					const tempMsgs = prev.filter(
						(m) => m.id.startsWith("temp-") && !list.some((lm) => lm.content === m.content)
					);
					return [...list, ...tempMsgs];
				});
			})
			.catch(async (err) => {
				console.warn("REST load messages failed in ChatPage, trying SignalR fallback:", err);
				if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
					try {
						const history: ChatMessageItem[] = await hubConnectionRef.current.invoke(
							"GetChatHistory",
							roomId,
							null,
							50
						);
						setMessages(history || []);
					} catch (e) {
						console.error("Lỗi khi tải lịch sử SignalR:", e);
						setMessages([]);
					}
				}
			});

		// 2. Song song: Join chat room trên SignalR nếu đã connected
		if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
			hubConnectionRef.current.invoke("JoinChatRoom", roomId).catch(() => {});
		}
	}, [activeRoom?.roomId, isSeller]);

	// Media Slides for Lightbox (Hỗ trợ toàn bộ hình ảnh và video trong cuộc hội thoại)
	const allMedias: ChatImageViewerSlide[] = useMemo(() => {
		const list: ChatImageViewerSlide[] = [];
		const seen = new Set<string>();
		messages.forEach((m) => {
			const type = (m.messageType || "").toLowerCase();
			if ((type === "image" || type === "sticker" || type === "gif") && m.content) {
				const parsed = parseMediaUrls(m.content);
				parsed.forEach((url) => {
					if (!seen.has(url)) {
						list.push({ type: "image", src: url });
						seen.add(url);
					}
				});
			} else if (type === "video" && m.content) {
				const parsed = parseMediaUrls(m.content);
				parsed.forEach((url) => {
					if (!seen.has(url)) {
						list.push({ type: "video", src: url });
						seen.add(url);
					}
				});
			}
		});
		return list;
	}, [messages]);

	const allMediaImages = useMemo(() => allMedias.map((m) => m.src), [allMedias]);

	const [lightboxSlides, setLightboxSlides] = useState<ChatImageViewerSlide[]>([]);

	const openMediaInLightbox = useCallback((mediaUrl: string, type: "image" | "video" = "image") => {
		if (!mediaUrl) return;
		let list = [...allMedias];
		let foundIndex = list.findIndex((m) => m.src === mediaUrl);
		if (foundIndex === -1) {
			list.unshift({ type, src: mediaUrl });
			foundIndex = 0;
		}
		setLightboxSlides(list);
		setLightboxIndex(foundIndex);
	}, [allMedias]);

	// Xử lý gửi tin nhắn (Tối đa 3 tin nhắn: Text, Nhóm Ảnh, Nhóm Video)
	const handleSendMessage = async () => {
		if (isSendingRef.current) return;
		if ((!inputText.trim() && pendingMediaList.length === 0) || !activeRoom) return;

		isSendingRef.current = true;
		setIsSending(true);

		const textContent = inputText.trim();
		setInputText("");
		setShowEmojiPicker(false);

		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

		try {
			// 1. Chờ các tệp đang tải ngầm lên S3 hoàn tất (nếu có)
			const allPending = await waitForPendingUploads();
			const readyImages = allPending.filter((m) => m.status === "done" && m.uploadedUrl && m.type === "Image");
			const readyVideos = allPending.filter((m) => m.status === "done" && m.uploadedUrl && m.type === "Video");

			const sentMediaIds = [...readyImages.map((m) => m.id), ...readyVideos.map((m) => m.id)];
			if (sentMediaIds.length > 0) {
				removePendingMediaList(sentMediaIds);
			}

			const imageUrls = readyImages.map((m) => m.uploadedUrl!);
			const videoUrls = readyVideos.map((m) => m.uploadedUrl!);

			const conn = await ensureSignalRConnected();

			// A. Gửi tin nhắn văn bản (Msg 1)
			if (textContent) {
				let outgoingContent = textContent;
				let replyToMessageId: string | null = null;
				let replyToContent: string | null = null;
				let replyToSenderName: string | null = null;

				if (replyingToMessage) {
					replyToMessageId = isValidGuid(replyingToMessage.id) ? replyingToMessage.id : null;
					replyToSenderName = (replyingToMessage.senderId === currentUserId ? "Bạn" : (activeRoom.displayName || "Đối phương")).slice(0, 80);
					let quotePreview = replyingToMessage.content;
					let quoteMediaUrl: string | undefined = undefined;

					if (replyingToMessage.messageType === "Image") {
						quotePreview = "[Hình ảnh]";
						const urls = parseMediaUrls(replyingToMessage.content);
						quoteMediaUrl = urls[0] || replyingToMessage.content;
					} else if (replyingToMessage.messageType === "Video") {
						quotePreview = "[Video]";
						const urls = parseMediaUrls(replyingToMessage.content);
						quoteMediaUrl = urls[0] || replyingToMessage.content;
					} else if (replyingToMessage.messageType === "Sticker") {
						quotePreview = "[Nhãn dán]";
						quoteMediaUrl = replyingToMessage.content;
					} else if (replyingToMessage.messageType === "Gif") {
						quotePreview = "[Ảnh GIF]";
						quoteMediaUrl = replyingToMessage.content;
					} else {
						const { text } = parseReplyMessage(replyingToMessage.content);
						quotePreview = (text || replyingToMessage.content).slice(0, 160);
					}

					if (quoteMediaUrl?.startsWith("data:")) {
						quoteMediaUrl = undefined;
					}

					replyToContent = quotePreview.slice(0, 400);

					const replyQuote: ChatReplyQuote = {
						messageId: replyingToMessage.id,
						senderName: replyToSenderName,
						content: replyToContent,
						messageType: replyingToMessage.messageType,
						mediaUrl: quoteMediaUrl,
					};
					outgoingContent = formatReplyMessage(replyQuote, textContent);
					setReplyingToMessage(null);
				}

				const tempTextId = `temp-${Date.now()}`;
				const textMsg: ChatMessageItem = {
					id: tempTextId,
					roomId: activeRoom.roomId,
					senderId: currentUserId,
					content: outgoingContent,
					messageType: "Text",
					sentAt: new Date().toISOString(),
					replyToMessageId: replyToMessageId || undefined,
					replyToContent: replyToContent || undefined,
					replyToSenderName: replyToSenderName || undefined,
				};
				setMessages((prev) => [...prev, textMsg]);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const { text: optimisticPreview } = parseReplyMessage(outgoingContent);
				updateConversationItem(activeRoom.roomId, optimisticPreview || outgoingContent, textMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

				try {
					if (conn?.state === signalR.HubConnectionState.Connected) {
						const res = await conn.invoke(
							"SendChatMessage",
							targetRoomId,
							outgoingContent,
							Number(recipientId),
							senderRole,
							"Text",
							replyToMessageId,
							replyToContent,
							replyToSenderName
						);
						if (res?.id) {
							setMessages((prev) => prev.map((m) => (m.id === tempTextId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt, roomId: res.roomId || m.roomId } : m)));
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						}
						const { text } = parseReplyMessage(outgoingContent);
						updateConversationItem(targetRoom, text || outgoingContent, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat. Đang kết nối lại, vui lòng thử lại sau vài giây.");
					}
				} catch (e: any) {
					console.error("Lỗi khi gửi tin nhắn văn bản:", e);
					const isAlreadyDelivered = messagesRef.current.some(
						(m) => (m.content === outgoingContent || (m.id !== tempTextId && m.content.includes(textContent))) &&
							Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
					);
					if (!isAlreadyDelivered) {
						const detail = e?.message || e?.toString() || "Lỗi kết nối máy chủ";
						toast.error(`Không thể gửi tin nhắn văn bản: ${detail}`);
					}
				}
			}

			// B. Gửi nhóm ảnh (Msg 2 - Tối đa gom toàn bộ ảnh thành 1 tin nhắn)
			if (imageUrls.length > 0) {
				const imageContent = imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls);
				const tempImgId = `temp-${Date.now()}-img`;
				const imgMsg: ChatMessageItem = {
					id: tempImgId,
					roomId: activeRoom.roomId,
					senderId: currentUserId,
					content: imageContent,
					messageType: "Image",
					sentAt: new Date().toISOString(),
				};
				setMessages((prev) => [...prev, imgMsg]);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const imgPreview = imageUrls.length > 1 ? `Bạn đã gửi ${imageUrls.length} ảnh` : "Bạn đã gửi 1 ảnh";
				updateConversationItem(activeRoom.roomId, imgPreview, imgMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

				try {
					if (conn?.state === signalR.HubConnectionState.Connected) {
						const res = await conn.invoke(
							"SendChatMessage",
							targetRoomId,
							imageContent,
							Number(recipientId),
							senderRole,
							"Image",
							null,
							null,
							null
						);
						if (res?.id) {
							setMessages((prev) => prev.map((m) => (m.id === tempImgId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						}
						updateConversationItem(targetRoom, imgPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat khi gửi ảnh. Vui lòng thử lại sau vài giây.");
					}
				} catch (err: any) {
					console.error("Lỗi khi gửi nhóm ảnh:", err);
					const isAlreadyDelivered = messagesRef.current.some(
						(m) => m.content === imageContent && Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
					);
					if (!isAlreadyDelivered) {
						const detail = err?.message || err?.toString() || "Lỗi tải ảnh";
						toast.error(`Không thể gửi ${imageUrls.length > 1 ? `${imageUrls.length} hình ảnh` : "hình ảnh"}: ${detail}`);
					}
				}
			}

			// C. Gửi nhóm video (Msg 3 - Tối đa gom toàn bộ video thành 1 tin nhắn)
			if (videoUrls.length > 0) {
				const videoContent = videoUrls.length === 1 ? videoUrls[0] : JSON.stringify(videoUrls);
				const tempVidId = `temp-${Date.now()}-vid`;
				const vidMsg: ChatMessageItem = {
					id: tempVidId,
					roomId: activeRoom.roomId,
					senderId: currentUserId,
					content: videoContent,
					messageType: "Video",
					sentAt: new Date().toISOString(),
				};
				setMessages((prev) => [...prev, vidMsg]);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const vidPreview = videoUrls.length > 1 ? `Bạn đã gửi ${videoUrls.length} video` : "Bạn đã gửi 1 video";
				updateConversationItem(activeRoom.roomId, vidPreview, vidMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

				try {
					if (conn?.state === signalR.HubConnectionState.Connected) {
						const res = await conn.invoke(
							"SendChatMessage",
							targetRoomId,
							videoContent,
							Number(recipientId),
							senderRole,
							"Video",
							null,
							null,
							null
						);
						if (res?.id) {
							setMessages((prev) => prev.map((m) => (m.id === tempVidId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						}
						updateConversationItem(targetRoom, vidPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat khi gửi video. Vui lòng thử lại sau vài giây.");
					}
				} catch (err: any) {
					console.error("Lỗi khi gửi nhóm video:", err);
					const isAlreadyDelivered = messagesRef.current.some(
						(m) => m.content === videoContent && Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
					);
					if (!isAlreadyDelivered) {
						const detail = err?.message || err?.toString() || "Lỗi tải video";
						toast.error(`Không thể gửi ${videoUrls.length > 1 ? `${videoUrls.length} video` : "video"}: ${detail}`);
					}
				}
			}
		} finally {
			isSendingRef.current = false;
			setIsSending(false);
		}
	};

	const handleRevokeMessage = async (messageId: string) => {
		if (!isValidGuid(messageId) || !activeRoom?.roomId) return;
		setMessages((prev) =>
			prev.map((m) =>
				m.id === messageId
					? { ...m, content: "Tin nhắn đã được thu hồi", isRevoked: true }
					: m
			)
		);
		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				await conn.invoke("RevokeChatMessage", messageId, activeRoom.roomId);
			}
		} catch (err: any) {
			console.error("Lỗi khi thu hồi tin nhắn:", err);
			const detail = err?.message || err?.toString() || "Lỗi máy chủ";
			toast.error(`Không thể thu hồi tin nhắn: ${detail}`);
		}
	};

	const handleReactMessage = async (messageId: string, emoji: string) => {
		if (!isValidGuid(messageId) || !activeRoom?.roomId) return;
		setMessages((prev) =>
			prev.map((m) => {
				if (m.id !== messageId) return m;
				const currentReactions = { ...(m.reactions || {}) };
				const isCurrent = m.userReaction === emoji;
				if (isCurrent) {
					currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
					if (currentReactions[emoji] === 0) delete currentReactions[emoji];
					return { ...m, reactions: currentReactions, userReaction: undefined };
				} else {
					if (m.userReaction && currentReactions[m.userReaction]) {
						currentReactions[m.userReaction] = Math.max(0, currentReactions[m.userReaction] - 1);
						if (currentReactions[m.userReaction] === 0) delete currentReactions[m.userReaction];
					}
					currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
					return { ...m, reactions: currentReactions, userReaction: emoji };
				}
			})
		);
		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				await conn.invoke("ReactToChatMessage", messageId, activeRoom.roomId, emoji);
			}
		} catch (err) {
			console.error("Lỗi khi thả biểu tượng cảm xúc:", err);
		}
	};

	// Xử lý gửi Sticker 3D hoặc GIF
	const handleSendSpecial = async (content: string, type: "Sticker" | "Gif") => {
		if (!activeRoom) return;
		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

		const tempSpecialId = `temp-${Date.now()}`;
		const specialMsg: ChatMessageItem = {
			id: tempSpecialId,
			roomId: activeRoom.roomId,
			senderId: currentUserId,
			content,
			messageType: type,
			sentAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, specialMsg]);

		// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
		const specialPreview = type === "Sticker" ? "[Sticker 3D]" : "[Ảnh GIF]";
		updateConversationItem(activeRoom.roomId, specialPreview, specialMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				const res = await conn.invoke(
					"SendChatMessage",
					targetRoomId,
					content,
					Number(recipientId),
					senderRole,
					type,
					null,
					null,
					null
				);
				if (res?.id) {
					setMessages((prev) => prev.map((m) => (m.id === tempSpecialId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
				}
				const targetRoom = res?.roomId || activeRoom.roomId;
				if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
					setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
				}
				updateConversationItem(targetRoom, specialPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
			}
		} catch (e: any) {
			console.error("Lỗi khi gửi sticker/gif:", e);
			const isAlreadyDelivered = messagesRef.current.some(
				(m) => m.content === content && Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
			);
			if (!isAlreadyDelivered) {
				const detail = e?.message || e?.toString() || "Lỗi máy chủ";
				toast.error(`Không thể gửi ${type === "Sticker" ? "nhãn dán 3D" : "ảnh GIF"}: ${detail}`);
			}
		}
	};

	return (
		<div className="w-full h-full flex bg-white font-sans select-none overflow-hidden">
			{/* ======================================================== */}
			{/* CỘT 1 (BÊN TRÁI): Danh sách cuộc hội thoại                */}
			{/* ======================================================== */}
			<ChatConversationList
				conversations={conversations}
				activeRoom={activeRoom}
				onSelectRoom={setActiveRoom}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				isLoading={isLoading}
				isSeller={isSeller}
			/>

			{/* ======================================================== */}
			{/* CỘT 2 (Ở GIỮA): Khung chat đối thoại chính               */}
			{/* ======================================================== */}
			<ChatMessageArea
				activeRoom={activeRoom}
				messages={messages}
				currentUserId={currentUserId}
				isSeller={isSeller}
				isRightSidebarOpen={isRightSidebarOpen}
				onToggleRightSidebar={() => setIsRightSidebarOpen((v) => !v)}
				showMessageSearch={showMessageSearch}
				onCloseMessageSearch={() => setShowMessageSearch(false)}
				messageSearchQuery={messageSearchQuery}
				onMessageSearchChange={setMessageSearchQuery}
				themePreset={activePreset}
				onImageClick={(url) => openMediaInLightbox(url, "image")}
				onVideoClick={(url) => openMediaInLightbox(url, "video")}
				inputText={inputText}
				onInputTextChange={setInputText}
				onSendMessage={handleSendMessage}
				onSendSpecial={handleSendSpecial}
				isSending={isSending}
				pendingMediaList={pendingMediaList}
				onSelectFiles={handleSelectFiles}
				onRemovePendingMedia={removePendingMedia}
				showEmojiPicker={showEmojiPicker}
				onToggleEmojiPicker={() => setShowEmojiPicker((v) => !v)}
				onCloseEmojiPicker={() => setShowEmojiPicker(false)}
				onRevokeMessage={handleRevokeMessage}
				onReactMessage={handleReactMessage}
				replyingToMessage={replyingToMessage}
				onReplyMessage={setReplyingToMessage}
				onCancelReply={() => setReplyingToMessage(null)}
			/>

			{/* ======================================================== */}
			{/* CỘT 3 (BÊN PHẢI): Thông tin & Tài nguyên & Đổi chủ đề     */}
			{/* ======================================================== */}
			{isRightSidebarOpen && activeRoom && (
				<ChatRightSidebar
					activeRoom={activeRoom}
					isSeller={isSeller}
					isMuted={isMuted}
					onToggleMute={() => {
						setIsMuted((prev) => {
							const next = !prev;
							toast.info(next ? "Đã tắt thông báo cuộc trò chuyện" : "Đã bật thông báo cuộc trò chuyện");
							return next;
						});
					}}
					showMessageSearch={showMessageSearch}
					onToggleMessageSearch={() => setShowMessageSearch((v) => !v)}
					rightSidebarView={rightSidebarView}
					onSetRightSidebarView={setRightSidebarView}
					resourceActiveTab={resourceActiveTab}
					onSetResourceActiveTab={setResourceActiveTab}
					isThemeAccordionOpen={isThemeAccordionOpen}
					onToggleThemeAccordion={() => setIsThemeAccordionOpen((v) => !v)}
					isResourceAccordionOpen={isResourceAccordionOpen}
					onToggleResourceAccordion={() => setIsResourceAccordionOpen((v) => !v)}
					themePreset={confirmedPreset}
					previewThemePreset={previewPreset}
					onSetPreviewThemePreset={setPreviewPreset}
					hasThemeChanged={hasThemeChanged}
					onApplyTheme={handleApplyTheme}
					onCancelTheme={handleCancelTheme}
					allMediaImages={allMediaImages}
					onImageClick={(url) => openMediaInLightbox(url, url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov") ? "video" : "image")}
					isApplyingTheme={isApplyingTheme}
					messages={messages}
				/>
			)}

			{/* Trình xem ảnh toàn màn hình cao cấp (Zoom, Thumbnails, Download) */}
			<ChatImageViewer
				open={lightboxIndex >= 0 && lightboxSlides.length > 0}
				close={() => setLightboxIndex(-1)}
				index={lightboxIndex}
				slides={lightboxSlides}
			/>
		</div>
	);
}

export default ChatPage;
