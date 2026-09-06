import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/core";
import * as signalR from "@microsoft/signalr";

import { useAuthStore } from "@/domains/auth";
import type { Conversation, ChatMessageItem, ChatThemePreset } from "@/domains/notification";
import {
	CHAT_THEME_PRESETS,
	DEFAULT_CHAT_THEME,
	getChatTheme,
	useChatMediaUpload,
	parseMediaUrls,
	ChatConversationList,
	ChatMessageArea,
	ChatRightSidebar,
} from "@/domains/notification";
import { ChatImageViewer } from "@/shared/components";
import { ensureSignalRConnected } from "@/shared/hooks/useSignalR";

export function ChatPage() {
	const [searchParams] = useSearchParams();
	const targetShopIdParam = searchParams.get("shopId");
	const isSeller = searchParams.get("seller") === "true";
	const { user } = useAuthStore();
	const currentUserId = user?.id || 0;

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeRoom, setActiveRoom] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<ChatMessageItem[]>([]);
	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

	// Fetch Conversations
	const fetchConversations = async () => {
		try {
			setIsLoading(true);
			const res = await api.get("/chat/conversations", { params: { isSeller } });
			const list: Conversation[] = res.data?.value || res.data || [];
			setConversations(list);

			if (list.length > 0) {
				if (targetShopIdParam) {
					const found = list.find((c) => String(c.shopId) === targetShopIdParam);
					setActiveRoom(found || list[0]);
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

	// Helper kiểm tra Guid hợp lệ
	// Helper kiểm tra Guid hợp lệ
	const isValidGuid = (id?: string) =>
		Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) && id !== "00000000-0000-0000-0000-000000000000");

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
							m.roomId === msg.roomId &&
							Number(m.senderId) === Number(msg.senderId) &&
							m.content === msg.content &&
							m.id !== msg.id &&
							Math.abs(new Date(m.sentAt).getTime() - new Date(msg.sentAt).getTime()) < 15000
					);

					const newMsg: ChatMessageItem = {
						id: msg.id || String(Date.now()),
						roomId: msg.roomId,
						senderId: msg.senderId,
						content: msg.content,
						messageType: msg.messageType || "Text",
						sentAt: msg.sentAt || new Date().toISOString(),
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
				if (cur && !isValidGuid(cur.roomId) && (cur.shopId === msg.shopId || cur.roomId === msg.roomId)) {
					setActiveRoom({ ...cur, roomId: msg.roomId });
				}

				// Đồng bộ danh sách cuộc hội thoại
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
					setMessages((prev) =>
						prev.map((m) =>
							m.id === data.id ? { ...m, content: "Tin nhắn đã được thu hồi", isRevoked: true } : m
						)
					);
					setConversations((prev) =>
						prev.map((c) =>
							c.roomId === data.roomId ? { ...c, lastMessage: "Tin nhắn đã được thu hồi" } : c
						)
					);
				}
			};

			const handleReceiveMessageReaction = (data: { messageId: string; roomId: string; emoji: string; senderId: number }) => {
				if (data?.messageId && data?.emoji) {
					setMessages((prev) =>
						prev.map((m) => {
							if (m.id !== data.messageId) return m;
							const currentReactions = { ...(m.reactions || {}) };
							currentReactions[data.emoji] = (currentReactions[data.emoji] || 0) + 1;
							const isMine = Number(data.senderId) === currentUserId;
							return {
								...m,
								reactions: currentReactions,
								userReaction: isMine ? data.emoji : m.userReaction,
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
				setMessages(list);
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

	// Media Slides for Lightbox (Hỗ trợ toàn bộ hình ảnh trong cuộc hội thoại: Image, Sticker, Gif)
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

	const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);

	const openImageInLightbox = (imgUrl: string) => {
		if (!imgUrl) return;
		let list = [...allMediaImages];
		let foundIndex = list.indexOf(imgUrl);
		if (foundIndex === -1) {
			list.unshift(imgUrl);
			foundIndex = 0;
		}
		setLightboxSlides(list.map((src) => ({ src })));
		setLightboxIndex(foundIndex);
	};

	// Xử lý gửi tin nhắn (Tối đa 3 tin nhắn: Text, Nhóm Ảnh, Nhóm Video)
	const handleSendMessage = async () => {
		if ((!inputText.trim() && pendingMediaList.length === 0) || !activeRoom) return;

		const textContent = inputText.trim();
		setInputText("");
		setShowEmojiPicker(false);
		setIsSending(true);

		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";
		const targetRoomId = isValidGuid(activeRoom.roomId) ? activeRoom.roomId : "00000000-0000-0000-0000-000000000000";

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
			const tempTextId = `temp-${Date.now()}`;
			const textMsg: ChatMessageItem = {
				id: tempTextId,
				roomId: activeRoom.roomId,
				senderId: currentUserId,
				content: textContent,
				messageType: "Text",
				sentAt: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, textMsg]);

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
					if (res?.id) {
						setMessages((prev) => prev.map((m) => (m.id === tempTextId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
					}
					if (res?.roomId && res.roomId !== activeRoom.roomId) {
						setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						setConversations((prev) => prev.map((c) => (c.roomId === activeRoom.roomId ? { ...c, roomId: res.roomId } : c)));
						conn.invoke("JoinChatRoom", res.roomId);
					}
				}
			} catch (e) {
				console.error("Lỗi khi gửi tin nhắn văn bản:", e);
				toast.error("Không thể gửi tin nhắn.");
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
					if (res?.id) {
						setMessages((prev) => prev.map((m) => (m.id === tempImgId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
					}
					if (res?.roomId && res.roomId !== activeRoom.roomId) {
						setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						setConversations((prev) => prev.map((c) => (c.roomId === activeRoom.roomId ? { ...c, roomId: res.roomId } : c)));
						conn.invoke("JoinChatRoom", res.roomId);
					}
				}
			} catch (err) {
				console.error("Lỗi khi gửi nhóm ảnh:", err);
				toast.error("Không thể gửi ảnh đính kèm.");
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
					if (res?.id) {
						setMessages((prev) => prev.map((m) => (m.id === tempVidId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
					}
					if (res?.roomId && res.roomId !== activeRoom.roomId) {
						setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
						setConversations((prev) => prev.map((c) => (c.roomId === activeRoom.roomId ? { ...c, roomId: res.roomId } : c)));
						conn.invoke("JoinChatRoom", res.roomId);
					}
				}
			} catch (err) {
				console.error("Lỗi khi gửi nhóm video:", err);
				toast.error("Không thể gửi video đính kèm.");
			}
		}

		setIsSending(false);
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
		} catch (err) {
			console.error("Lỗi khi thu hồi tin nhắn:", err);
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

		try {
			const conn = await ensureSignalRConnected();
			if (conn?.state === signalR.HubConnectionState.Connected) {
				const res = await conn.invoke(
					"SendChatMessage",
					targetRoomId,
					content,
					recipientId,
					senderRole,
					type
				);
				if (res?.id) {
					setMessages((prev) => prev.map((m) => (m.id === tempSpecialId ? { ...m, id: res.id, sentAt: res.sentAt || m.sentAt } : m)));
				}
				if (res?.roomId && res.roomId !== activeRoom.roomId) {
					setActiveRoom((prev) => (prev ? { ...prev, roomId: res.roomId } : null));
					setConversations((prev) => prev.map((c) => (c.roomId === activeRoom.roomId ? { ...c, roomId: res.roomId } : c)));
					conn.invoke("JoinChatRoom", res.roomId);
				}
			}
		} catch (e) {
			console.error("Lỗi khi gửi sticker/gif:", e);
			toast.error("Không thể gửi sticker/gif.");
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
				onImageClick={openImageInLightbox}
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
					onImageClick={openImageInLightbox}
					isApplyingTheme={isApplyingTheme}
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
