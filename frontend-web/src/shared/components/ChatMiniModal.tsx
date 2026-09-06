import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";
import { api } from "@/core";
import { useAuthStore } from "@/domains/auth";
import { useChatStore, getChatTheme, useChatMediaUpload, parseMediaUrls } from "@/domains/notification";
import type { ChatMessageDto } from "@/domains/notification";
import { ensureSignalRConnected } from "@/shared/hooks/useSignalR";
import { ChatImageViewer } from "./ChatImageViewer";
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
	const location = useLocation();
	const user = useAuthStore((s) => s.user);
	const isSeller = isSellerProp !== undefined ? isSellerProp : location.pathname.startsWith("/seller");

	const {
		closeChat,
		conversations,
		setConversations,
		activeRoom,
		setActiveRoom,
		messages,
		setMessages,
		appendMessage,
		clearUnread,
		isLoadingConversations,
		setLoadingConversations,
		revokeMessage,
		reactToMessage,
	} = useChatStore();

	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerTab, setPickerTab] = useState<"emoji" | "sticker" | "gif">("emoji");

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

	// Media Viewer: Hỗ trợ toàn bộ ảnh (Image, Sticker, Gif), trích xuất chuẩn từng URL
	const [lightboxIndex, setLightboxIndex] = useState(-1);
	const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);

	const allMediaImages = useMemo(() => {
		const urls: string[] = [];
		const seen = new Set<string>();
		messages.forEach((m) => {
			const type = (m.messageType || "").toLowerCase();
			if ((type === "image" || type === "sticker" || type === "gif") && m.content) {
				const parsed = parseMediaUrls(m.content);
				parsed.forEach((url) => {
					if (!seen.has(url)) {
						urls.push(url);
						seen.add(url);
					}
				});
			}
		});
		return urls;
	}, [messages]);

	const openImageInLightbox = useCallback((imgUrl: string) => {
		if (!imgUrl) return;
		let list = [...allMediaImages];
		let index = list.indexOf(imgUrl);
		if (index === -1) {
			list.unshift(imgUrl);
			index = 0;
		}
		setLightboxSlides(list.map((src) => ({ src })));
		setLightboxIndex(index);
	}, [allMediaImages]);

	const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
		messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
	};

	// Tự động cuộn và cố định tuyệt đối ở đáy khi đổi phòng hoặc có tin nhắn mới
	useEffect(() => {
		scrollToBottom("auto");
		const t1 = setTimeout(() => scrollToBottom("auto"), 60);
		const t2 = setTimeout(() => scrollToBottom("auto"), 200);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, [messages, pendingMediaList, activeRoom?.roomId]);

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
				if (cur && !isValidGuid(cur.roomId) && (cur.shopId === msg.shopId || cur.roomId === msg.roomId)) {
					setActiveRoom({ ...cur, roomId: msg.roomId });
				}

				setConversations((prev) =>
					prev.map((c) => {
						if (c.roomId === msg.roomId || (!isValidGuid(c.roomId) && c.shopId === msg.shopId)) {
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
							}

							return {
								...c,
								roomId: msg.roomId,
								lastMessage: preview,
								lastActiveAt: msg.sentAt || new Date().toISOString(),
							};
						}
						return c;
					})
				);
			};

			const handleReceiveMessageRevoked = (data: { id: string; roomId: string; content: string }) => {
				if (data?.id) {
					revokeMessage(data.id);
					setConversations((prev) =>
						prev.map((c) =>
							c.roomId === data.roomId ? { ...c, lastMessage: "Tin nhắn đã được thu hồi" } : c
						)
					);
				}
			};

			const handleReceiveMessageReaction = (data: { messageId: string; roomId: string; emoji: string; senderId: number }) => {
				if (data?.messageId && data?.emoji) {
					reactToMessage(data.messageId, data.emoji, data.senderId);
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
	}, []);

	// Tải danh sách cuộc trò chuyện nếu chưa có
	useEffect(() => {
		if (conversations.length === 0) {
			setLoadingConversations(true);
			api.get("/chat/conversations", { params: { isSeller } })
				.then((res) => {
					const list = res.data?.value || res.data || [];
					setConversations(list);
				})
				.catch((err) => {
					console.warn("REST load conversations failed:", err);
				})
				.finally(() => {
					setLoadingConversations(false);
				});
		}
	}, [conversations.length, isSeller]);

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
				setMessages(list);
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
						setMessages(history || []);
					} catch (e) {
						console.error("SignalR fallback history failed:", e);
						setMessages([]);
					}
				}
			});

		// 2. Join chat room trên SignalR nếu đã connected
		if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
			hubConnectionRef.current.invoke("JoinChatRoom", roomId).catch(() => {});
		}
	}, [activeRoom?.roomId]);

	const handleSend = async () => {
		if ((!inputText.trim() && pendingMediaList.length === 0) || !activeRoom) return;

		const textContent = inputText.trim();
		setInputText("");
		setShowEmojiPicker(false);
		setIsSending(true);

		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

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
			const tempTextId = `temp-${Date.now()}`;
			const textMsg: ChatMessageDto = {
				id: tempTextId,
				roomId: activeRoom.roomId,
				senderId: user?.id || 1,
				content: textContent,
				messageType: "Text",
				sentAt: new Date().toISOString(),
			};
			appendMessage(textMsg);

			try {
				if (conn?.state === signalR.HubConnectionState.Connected) {
					const res = await conn.invoke(
						"SendChatMessage",
						targetRoomId,
						textContent,
						Number(recipientId),
						senderRole,
						"Text"
					);
					if (res && res.roomId && !isValidGuid(activeRoom.roomId)) {
						setActiveRoom({ ...activeRoom, roomId: res.roomId });
					}
				}
			} catch (err: any) {
				console.error("Gửi tin nhắn văn bản thất bại:", err);
				toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
			}
		}

		// B. Gửi nhóm ảnh (Msg 2 - Tối đa gom toàn bộ ảnh thành 1 tin nhắn)
		if (imageUrls.length > 0) {
			const imageContent = imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls);
			const tempImgId = `temp-${Date.now()}-img`;
			const imgMsg: ChatMessageDto = {
				id: tempImgId,
				roomId: activeRoom.roomId,
				senderId: user?.id || 1,
				content: imageContent,
				messageType: "Image",
				sentAt: new Date().toISOString(),
			};
			appendMessage(imgMsg);

			try {
				if (conn?.state === signalR.HubConnectionState.Connected) {
					const res = await conn.invoke(
						"SendChatMessage",
						targetRoomId,
						imageContent,
						Number(recipientId),
						senderRole,
						"Image"
					);
					if (res && res.roomId && !isValidGuid(activeRoom.roomId)) {
						setActiveRoom({ ...activeRoom, roomId: res.roomId });
					}
				}
			} catch (err: any) {
				console.error("Gửi nhóm ảnh thất bại:", err);
				toast.error("Không thể gửi ảnh đính kèm.");
			}
		}

		// C. Gửi nhóm video (Msg 3 - Tối đa gom toàn bộ video thành 1 tin nhắn)
		if (videoUrls.length > 0) {
			const videoContent = videoUrls.length === 1 ? videoUrls[0] : JSON.stringify(videoUrls);
			const tempVidId = `temp-${Date.now()}-vid`;
			const vidMsg: ChatMessageDto = {
				id: tempVidId,
				roomId: activeRoom.roomId,
				senderId: user?.id || 1,
				content: videoContent,
				messageType: "Video",
				sentAt: new Date().toISOString(),
			};
			appendMessage(vidMsg);

			try {
				if (conn?.state === signalR.HubConnectionState.Connected) {
					const res = await conn.invoke(
						"SendChatMessage",
						targetRoomId,
						videoContent,
						Number(recipientId),
						senderRole,
						"Video"
					);
					if (res && res.roomId && !isValidGuid(activeRoom.roomId)) {
						setActiveRoom({ ...activeRoom, roomId: res.roomId });
					}
				}
			} catch (err: any) {
				console.error("Gửi nhóm video thất bại:", err);
				toast.error("Không thể gửi video đính kèm.");
			}
		}

		setIsSending(false);
	};

	const handleRevokeMessage = async (messageId: string) => {
		if (!isValidGuid(messageId) || !activeRoom?.roomId) return;
		revokeMessage(messageId);
		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				await conn.invoke("RevokeChatMessage", messageId, activeRoom.roomId);
			}
		} catch (err) {
			console.error("Lỗi khi thu hồi tin nhắn:", err);
		}
	};

	const handleReactMessage = async (messageId: string, emoji: string) => {
		if (!isValidGuid(messageId) || !activeRoom?.roomId) return;
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
			senderId: user?.id || 1,
			content,
			messageType: type,
			sentAt: new Date().toISOString(),
		};
		appendMessage(specialMsg);

		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";
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
					type
				);
				if (res && res.roomId && !isValidGuid(activeRoom.roomId)) {
					setActiveRoom({ ...activeRoom, roomId: res.roomId });
				}
			}
		} catch (err) {
			console.error(`Gửi ${type} thất bại:`, err);
		}
	};

	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return conversations;
		const q = searchQuery.toLowerCase();
		return conversations.filter((c) => c.displayName?.toLowerCase().includes(q));
	}, [conversations, searchQuery]);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: 20 }}
			transition={{ duration: 0.18, ease: "easeOut" }}
			className="fixed bottom-3 right-4 sm:right-20 z-[10000] w-[95vw] sm:w-[680px] h-[520px] max-h-[calc(100vh-24px)] bg-white rounded-2xl shadow-2xl border border-brand-border flex flex-col overflow-hidden font-sans"
		>
			{/* Header Mini Chat */}
			<ChatMiniHeader
				activeRoom={activeRoom}
				isSeller={isSeller}
				onClose={closeChat}
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
						onImageClick={openImageInLightbox}
						isSeller={isSeller}
						formatMessengerTime={formatMessengerTime}
						shouldShowTimeSeparator={shouldShowTimeSeparator}
						isPureEmoji={isPureEmoji}
						onRevokeMessage={handleRevokeMessage}
						onReactMessage={handleReactMessage}
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
