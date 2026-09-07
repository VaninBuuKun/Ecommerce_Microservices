import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { api } from "@/core";
import { useAuthStore } from "@/domains/auth";
import { useChatStore, getChatTheme, useChatMediaUpload, parseMediaUrls, formatReplyMessage, parseReplyMessage, getChatParticipantInfo } from "@/domains/notification";
import type { ChatMessageDto, ChatReplyQuote } from "@/domains/notification";
import { ensureSignalRConnected } from "@/shared/hooks/useSignalR";
import { ChatImageViewer, type ChatImageViewerSlide } from "./ChatImageViewer";
import {
	ChatMiniHeader,
	ChatMiniConversationList,
	ChatMiniMessageThread,
	ChatMiniInputBar,
} from "./chat-mini";

// Helper định dạng mốc thời gian hội thoại
const formatMessengerTime = (dateStr: string) => {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	const now = new Date();

	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	const isYesterday =
		new Date(now.setDate(now.getDate() - 1)).toDateString() ===
		date.toDateString();

	const timeStr = date.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});

	if (isToday) return `Hôm nay, ${timeStr}`;
	if (isYesterday) return `Hôm qua, ${timeStr}`;

	const sameYear = date.getFullYear() === new Date().getFullYear();
	if (sameYear) {
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} Th${month}, ${timeStr}`;
	}

	return date.toLocaleDateString("vi-VN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const shouldShowTimeSeparator = (currentDateStr: string, prevDateStr?: string) => {
	if (!prevDateStr) return true;
	const current = new Date(currentDateStr).getTime();
	const prev = new Date(prevDateStr).getTime();
	return current - prev > 15 * 60 * 1000;
};

const isPureEmoji = (text: string) => {
	const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u;
	return emojiRegex.test(text.trim());
};

const isValidGuid = (id?: string) =>
	Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && id !== "00000000-0000-0000-0000-000000000000");

interface ChatMiniModalProps {
	isSeller?: boolean;
}

export function ChatMiniModal({ isSeller: isSellerProp }: ChatMiniModalProps) {
	const user = useAuthStore((s) => s.user);

	const {
		closeChat,
		conversations,
		setConversations,
		activeRoom,
		setActiveRoom,
		messages,
		setMessages,
		appendMessage,
		updateMessage,
		clearUnread,
		isLoadingConversations,
		setLoadingConversations,
		revokeMessage,
		reactToMessage,
		applyServerReaction,
		isSeller,
		setIsSeller,
		selectedShop,
		setSelectedShop,
		lastActiveRoomId,
		updateConversationPreview,
	} = useChatStore();

	useEffect(() => {
		if (isSellerProp !== undefined) {
			setIsSeller(isSellerProp);
		}
	}, [isSellerProp, setIsSeller]);

	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isSending, setIsSending] = useState(false);
	const isSendingRef = useRef(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerTab, setPickerTab] = useState<"emoji" | "sticker" | "gif">("emoji");
	const [replyingToMessage, setReplyingToMessage] = useState<ChatMessageDto | null>(null);

	const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
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

	// Theme phối màu đồng bộ với ChatPage
	const activePreset = useMemo(() => {
		return getChatTheme(activeRoom?.themeColor, activeRoom?.backgroundColor);
	}, [activeRoom?.themeColor, activeRoom?.backgroundColor]);

	// Media Viewer Facebook-style: Hỗ trợ cả Hình ảnh (Image, Sticker, Gif) và Video (Video)
	const [lightboxIndex, setLightboxIndex] = useState(-1);
	const [lightboxSlides, setLightboxSlides] = useState<ChatImageViewerSlide[]>([]);

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

	const openMediaInLightbox = useCallback((mediaUrl: string, type: "image" | "video" = "image") => {
		if (!mediaUrl) return;
		let list = [...allMedias];
		let index = list.findIndex((m) => m.src === mediaUrl);
		if (index === -1) {
			list.unshift({ type, src: mediaUrl });
			index = 0;
		}
		setLightboxSlides(list);
		setLightboxIndex(index);
	}, [allMedias]);

	const scrollToBottom = useCallback(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, []);

	const messageCount = messages.length;
	const lastMessageId = messages[messages.length - 1]?.id;

	// Tự động cuộn ở đáy khi có tin nhắn mới hoặc đổi phòng (loại bỏ timeout gián đoạn)
	useEffect(() => {
		scrollToBottom();
	}, [messageCount, lastMessageId, pendingMediaList.length, activeRoom?.roomId, scrollToBottom]);

	// Khởi tạo và lắng nghe kết nối SignalR Singleton dùng chung qua API Gateway
	useEffect(() => {
		let isMounted = true;

		const setupConnection = async () => {
			const connection = await ensureSignalRConnected();
			if (!connection || !isMounted) return;
			hubConnectionRef.current = connection;

			if (activeRoomRef.current?.roomId && isValidGuid(activeRoomRef.current.roomId)) {
				connection.invoke("JoinChatRoom", activeRoomRef.current.roomId).catch(() => {});
			}

			const handleReceiveChatMessage = (msg: any) => {
				appendMessage({
					id: msg.id,
					roomId: msg.roomId,
					senderId: msg.senderId,
					content: msg.content,
					messageType: msg.messageType || "Text",
					sentAt: msg.sentAt || new Date().toISOString(),
				});

				const cur = activeRoomRef.current;
				if (cur && (!isValidGuid(cur.roomId) || cur.roomId.toLowerCase() === msg.roomId.toLowerCase()) && (cur.shopId === msg.shopId || cur.roomId.toLowerCase() === msg.roomId.toLowerCase())) {
					if (!isValidGuid(cur.roomId)) {
						setActiveRoom({ ...cur, roomId: msg.roomId });
					}
				}

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

				updateConversationPreview(msg.roomId, preview, msg.sentAt, msg.shopId, msg.buyerUserId);
			};

			const handleReceiveMessageRevoked = (data: { id: string; roomId: string; content: string }) => {
				if (data?.id) {
					revokeMessage(data.id);
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
			connection.on("ReceiveChatMessage", handleReceiveChatMessage);
			connection.on("ReceiveMessageRevoked", handleReceiveMessageRevoked);

			return () => {
				connection.off("ReceiveChatMessage", handleReceiveChatMessage);
				connection.off("ReceiveMessageRevoked", handleReceiveMessageRevoked);
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
	}, []);

	// Tải danh sách cuộc trò chuyện theo vai trò hiện tại (isSeller, selectedShop) và khôi phục phòng chat trước đó
	useEffect(() => {
		setLoadingConversations(true);
		api.get("/chat/conversations", {
			params: {
				isSeller,
				shopId: selectedShop?.id,
			},
		})
			.then((res) => {
				const list: Conversation[] = res.data?.value || res.data || [];
				setConversations(list);

				// Khôi phục phòng chat đang active trước đó nếu có
				if (list.length > 0) {
					const cur = activeRoomRef.current;
					if (!cur || !isValidGuid(cur.roomId)) {
						const remembered = lastActiveRoomId ? list.find((c) => c.roomId?.toLowerCase() === lastActiveRoomId.toLowerCase()) : null;
						if (remembered) {
							setActiveRoom(remembered);
						}
					}
				}
			})
			.catch((err) => {
				console.warn("REST load conversations failed:", err);
			})
			.finally(() => {
				setLoadingConversations(false);
			});
	}, [isSeller, selectedShop?.id, lastActiveRoomId]);

	const handleSwitchToBuyer = useCallback(() => {
		setIsSeller(false);
		setSelectedShop(null);
		setActiveRoom(null);
		setMessages([]);
	}, [setIsSeller, setSelectedShop, setActiveRoom, setMessages]);

	const handleSwitchToSeller = useCallback((shop: { id: number; name: string; logoUrl?: string }) => {
		setIsSeller(true);
		setSelectedShop(shop);
		setActiveRoom(null);
		setMessages([]);
	}, [setIsSeller, setSelectedShop, setActiveRoom, setMessages]);

	// Tải lịch sử tin nhắn khi chọn phòng
	useEffect(() => {
		if (!activeRoom) return;

		if (activeRoom.unreadCount && activeRoom.unreadCount > 0) {
			clearUnread(activeRoom.roomId);
		}

		if (!isValidGuid(activeRoom.roomId)) {
			setMessages([]);
			return;
		}

		const roomId = activeRoom.roomId;

		// 1. Tải lịch sử qua REST API
		api.get(`/chat/rooms/${roomId}/messages`)
			.then((res) => {
				const list: ChatMessageDto[] = res.data?.value || res.data || [];
				setMessages((prev) => {
					if (prev.length > 0 && list.length === 0) {
						return prev;
					}
					const tempMsgs = prev.filter(
						(m) =>
							(m.roomId?.toLowerCase() === roomId.toLowerCase() || !isValidGuid(m.roomId)) &&
							m.id.startsWith("temp-") &&
							!list.some((lm) => lm.content === m.content)
					);
					return [...list, ...tempMsgs];
				});
			})
			.catch(async (err) => {
				console.warn("REST load messages failed, trying SignalR fallback:", err);
				if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
					try {
						const history: ChatMessageDto[] = await hubConnectionRef.current.invoke(
							"GetChatHistory",
							roomId,
							null,
							50
						);
						if (history && history.length > 0) {
							setMessages(history);
						}
					} catch (e) {
						console.error("SignalR fallback history failed:", e);
					}
				}
			});

		// 2. Join chat room trên SignalR nếu đã connected
		if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
			hubConnectionRef.current.invoke("JoinChatRoom", roomId).catch(() => {});
		}
	}, [activeRoom?.roomId]);

	const handleSend = async () => {
		if (isSendingRef.current) return;
		if ((!inputText.trim() && pendingMediaList.length === 0) || !activeRoom) return;

		isSendingRef.current = true;
		setIsSending(true);

		const textContent = inputText.trim();
		setInputText("");
		setShowEmojiPicker(false);

		const { recipientId, senderRole } = getChatParticipantInfo(activeRoom, user?.id || 0, isSeller);
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

		try {
			// 1. Chờ các tệp đang tải lên S3 hoàn tất (nếu có)
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
					replyToSenderName = (replyingToMessage.senderId === (user?.id || 0) ? "Bạn" : (activeRoom.displayName || "Đối phương")).slice(0, 80);
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
				const textMsg: ChatMessageDto = {
					id: tempTextId,
					roomId: activeRoom.roomId,
					senderId: user?.id || 0,
					content: outgoingContent,
					messageType: "Text",
					sentAt: new Date().toISOString(),
					replyToMessageId: replyToMessageId || undefined,
					replyToContent: replyToContent || undefined,
					replyToSenderName: replyToSenderName || undefined,
				};
				appendMessage(textMsg);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const { text: optimisticPreview } = parseReplyMessage(outgoingContent);
				updateConversationPreview(activeRoom.roomId, optimisticPreview || outgoingContent, textMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

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
							updateMessage(tempTextId, { id: res.id, sentAt: res.sentAt, roomId: res.roomId });
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							const updatedRoom = { ...activeRoom, roomId: res.roomId };
							setActiveRoom(updatedRoom);
						}
						const { text } = parseReplyMessage(outgoingContent);
						updateConversationPreview(targetRoom, text || outgoingContent, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat. Đang kết nối lại, vui lòng thử lại sau vài giây.");
					}
				} catch (err: any) {
					console.error("Gửi tin nhắn văn bản thất bại:", err);
					const isAlreadyDelivered = useChatStore.getState().messages.some(
						(m) => (m.content === outgoingContent || (m.id !== tempTextId && m.content.includes(textContent))) &&
							Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
					);
					if (!isAlreadyDelivered) {
						const detail = err?.message || err?.toString() || "Lỗi kết nối máy chủ";
						toast.error(`Không thể gửi tin nhắn văn bản: ${detail}`);
					}
				}
			}

			// B. Gửi nhóm ảnh (Msg 2 - Tối đa gom toàn bộ ảnh thành 1 tin nhắn)
			if (imageUrls.length > 0) {
				const imageContent = imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls);
				const tempImgId = `temp-${Date.now()}-img`;
				const imgMsg: ChatMessageDto = {
					id: tempImgId,
					roomId: activeRoom.roomId,
					senderId: user?.id || 0,
					content: imageContent,
					messageType: "Image",
					sentAt: new Date().toISOString(),
				};
				appendMessage(imgMsg);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const imgPreview = imageUrls.length > 1 ? `Bạn đã gửi ${imageUrls.length} ảnh` : "Bạn đã gửi 1 ảnh";
				updateConversationPreview(activeRoom.roomId, imgPreview, imgMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

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
							updateMessage(tempImgId, { id: res.id, sentAt: res.sentAt, roomId: res.roomId });
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							const updatedRoom = { ...activeRoom, roomId: res.roomId };
							setActiveRoom(updatedRoom);
						}
						updateConversationPreview(targetRoom, imgPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat khi gửi ảnh. Vui lòng thử lại sau vài giây.");
					}
				} catch (err: any) {
					console.error("Gửi ảnh thất bại:", err);
					const isAlreadyDelivered = useChatStore.getState().messages.some(
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
				const vidMsg: ChatMessageDto = {
					id: tempVidId,
					roomId: activeRoom.roomId,
					senderId: user?.id || 0,
					content: videoContent,
					messageType: "Video",
					sentAt: new Date().toISOString(),
				};
				appendMessage(vidMsg);

				// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
				const vidPreview = videoUrls.length > 1 ? `Bạn đã gửi ${videoUrls.length} video` : "Bạn đã gửi 1 video";
				updateConversationPreview(activeRoom.roomId, vidPreview, vidMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

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
							updateMessage(tempVidId, { id: res.id, sentAt: res.sentAt, roomId: res.roomId });
						}
						const targetRoom = res?.roomId || activeRoom.roomId;
						if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
							const updatedRoom = { ...activeRoom, roomId: res.roomId };
							setActiveRoom(updatedRoom);
						}
						updateConversationPreview(targetRoom, vidPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
					} else {
						toast.error("Mất kết nối với máy chủ chat khi gửi video. Vui lòng thử lại sau vài giây.");
					}
				} catch (err: any) {
					console.error("Gửi video thất bại:", err);
					const isAlreadyDelivered = useChatStore.getState().messages.some(
						(m) => m.content === videoContent && Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
					);
					if (!isAlreadyDelivered) {
						const detail = err?.message || err?.toString() || "Lỗi tải video";
						toast.error(`Không thể gửi video: ${detail}`);
					}
				}
			}
		} finally {
			isSendingRef.current = false;
			setIsSending(false);
		}
	};

	const handleRevokeMessage = async (messageId: string) => {
		if (!activeRoom || !messageId) return;
		revokeMessage(messageId);
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
		if (!activeRoom || !messageId) return;
		reactToMessage(messageId, emoji, user?.id || 0);
		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				await conn.invoke("ReactToChatMessage", messageId, activeRoom.roomId, emoji);
			}
		} catch (err) {
			console.error("Lỗi khi thả cảm xúc:", err);
		}
	};

	const handleSendSpecial = async (content: string, type: "Sticker" | "Gif") => {
		if (!activeRoom) return;
		const tempId = `temp-${Date.now()}`;
		const specialMsg: ChatMessageDto = {
			id: tempId,
			roomId: activeRoom.roomId,
			senderId: user?.id || 0,
			content,
			messageType: type,
			sentAt: new Date().toISOString(),
		};
		appendMessage(specialMsg);

		// Cập nhật ngay lập tức ngoài danh sách cuộc hội thoại (Optimistic Preview)
		const specialPreview = type === "Sticker" ? "[Sticker 3D]" : "[Ảnh GIF]";
		updateConversationPreview(activeRoom.roomId, specialPreview, specialMsg.sentAt, activeRoom.shopId, activeRoom.buyerUserId);

		const { recipientId, senderRole } = getChatParticipantInfo(activeRoom, user?.id || 0, isSeller);
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

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
					updateMessage(tempId, { id: res.id, sentAt: res.sentAt, roomId: res.roomId });
				}
				const targetRoom = res?.roomId || activeRoom.roomId;
				if (res?.roomId && (!isValidGuid(activeRoom.roomId) || activeRoom.roomId.toLowerCase() !== res.roomId.toLowerCase())) {
					const updatedRoom = { ...activeRoom, roomId: res.roomId };
					setActiveRoom(updatedRoom);
				}
				updateConversationPreview(targetRoom, specialPreview, res?.sentAt, activeRoom.shopId, activeRoom.buyerUserId);
			}
		} catch (err: any) {
			console.error(`Gửi ${type} thất bại:`, err);
			const isAlreadyDelivered = useChatStore.getState().messages.some(
				(m) => m.content === content && Math.abs(new Date(m.sentAt).getTime() - Date.now()) < 30000
			);
			if (!isAlreadyDelivered) {
				const detail = err?.message || err?.toString() || "Lỗi máy chủ";
				toast.error(`Không thể gửi ${type === "Sticker" ? "nhãn dán 3D" : "ảnh GIF"}: ${detail}`);
			}
		}
	};

	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return conversations;
		const q = searchQuery.toLowerCase();
		return conversations.filter((c) => c.displayName?.toLowerCase().includes(q));
	}, [conversations, searchQuery]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.12 }}
			className="fixed bottom-3 right-4 sm:right-20 z-[10000] w-[95vw] sm:w-[680px] h-[520px] max-h-[calc(100vh-24px)] bg-white rounded-md shadow-2xl border border-brand-border flex flex-col overflow-hidden font-sans"
		>
			{/* Header Mini Chat */}
			<ChatMiniHeader
				activeRoom={activeRoom}
				isSeller={isSeller}
				selectedShop={selectedShop}
				onClose={closeChat}
				onSwitchToBuyer={handleSwitchToBuyer}
				onSwitchToSeller={handleSwitchToSeller}
			/>

			{/* Khung thân 2 cột: Danh sách hội thoại + Khung chat */}
			<div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50">
				<ChatMiniConversationList
					conversations={filteredConversations}
					activeRoom={activeRoom}
					onSelectRoom={setActiveRoom}
					isLoading={isLoadingConversations}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
				/>

				<div className="flex-1 flex flex-col overflow-hidden bg-white min-h-0">
					<ChatMiniMessageThread
						activeRoom={activeRoom}
						messages={messages}
						currentUserId={user?.id}
						activePreset={activePreset}
						messagesContainerRef={messagesContainerRef}
						messagesEndRef={messagesEndRef}
						onImageClick={(url) => openMediaInLightbox(url, "image")}
						onVideoClick={(url) => openMediaInLightbox(url, "video")}
						isSeller={isSeller}
						formatMessengerTime={formatMessengerTime}
						shouldShowTimeSeparator={shouldShowTimeSeparator}
						isPureEmoji={isPureEmoji}
						onRevokeMessage={handleRevokeMessage}
						onReactMessage={handleReactMessage}
						onReplyMessage={setReplyingToMessage}
					/>

					{activeRoom && (
						<ChatMiniInputBar
							inputText={inputText}
							onInputTextChange={setInputText}
							onSend={handleSend}
							isSending={isSending}
							pendingMediaList={pendingMediaList}
							onSelectFiles={handleSelectFiles}
							onRemovePendingMedia={removePendingMedia}
							onSendSpecial={handleSendSpecial}
							showEmojiPicker={showEmojiPicker}
							onToggleEmojiPicker={() => setShowEmojiPicker((v) => !v)}
							onCloseEmojiPicker={() => setShowEmojiPicker(false)}
							pickerTab={pickerTab}
							onPickerTabChange={setPickerTab}
							replyingToMessage={replyingToMessage}
							onCancelReply={() => setReplyingToMessage(null)}
							partnerName={activeRoom.displayName}
							currentUserId={user?.id}
						/>
					)}
				</div>
			</div>

			{/* Trình xem ảnh toàn màn hình cao cấp */}
			<ChatImageViewer
				open={lightboxIndex >= 0 && lightboxSlides.length > 0}
				close={() => setLightboxIndex(-1)}
				index={lightboxIndex}
				slides={lightboxSlides}
			/>
		</motion.div>
	);
}

export default ChatMiniModal;
