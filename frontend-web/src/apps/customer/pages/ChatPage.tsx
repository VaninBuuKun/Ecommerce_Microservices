import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/core";
import * as signalR from "@microsoft/signalr";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { useAuthStore } from "@/domains/auth";
import type { Conversation, ChatMessageItem } from "@/domains/notification";
import {
	CHAT_ITEM_THEMES,
	CHAT_BG_THEMES,
	DEFAULT_CHAT_ITEM_THEME,
	DEFAULT_CHAT_BG_THEME,
	ChatConversationList,
	ChatMessageArea,
	ChatRightSidebar,
} from "@/domains/notification";

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

	// Media & Emoji Picker
	const [pendingMedia, setPendingMedia] = useState<{ url: string; type: "Image" | "Video"; file?: File } | null>(null);
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

	// Theme state (Confirmed vs Preview for live preview & cancel & DB persistence)
	const [confirmedTheme, setConfirmedTheme] = useState(DEFAULT_CHAT_ITEM_THEME);
	const [confirmedChatBg, setConfirmedChatBg] = useState(DEFAULT_CHAT_BG_THEME);
	const [previewTheme, setPreviewTheme] = useState(DEFAULT_CHAT_ITEM_THEME);
	const [previewChatBg, setPreviewChatBg] = useState(DEFAULT_CHAT_BG_THEME);
	const [isApplyingTheme, setIsApplyingTheme] = useState(false);

	const [isMuted, setIsMuted] = useState(false);
	const [showMessageSearch, setShowMessageSearch] = useState(false);
	const [messageSearchQuery, setMessageSearchQuery] = useState("");

	const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

	// Active colors: When in "theme" subview, use preview colors for real-time live preview
	const activeTheme = rightSidebarView === "theme" ? previewTheme : confirmedTheme;
	const activeChatBg = rightSidebarView === "theme" ? previewChatBg : confirmedChatBg;

	// Check if any theme change occurred
	const hasThemeChanged =
		previewTheme.id !== confirmedTheme.id || previewChatBg.id !== confirmedChatBg.id;

	// Đồng bộ màu sắc đã lưu khi activeRoom thay đổi (Nếu null -> chọn màu mặc định Rose giống ảnh mẫu)
	useEffect(() => {
		if (!activeRoom) return;

		const matchedItemTheme =
			CHAT_ITEM_THEMES.find((t) => t.id === activeRoom.themeColor) || DEFAULT_CHAT_ITEM_THEME;
		const matchedBgTheme =
			CHAT_BG_THEMES.find((b) => b.id === activeRoom.backgroundColor) || DEFAULT_CHAT_BG_THEME;

		setConfirmedTheme(matchedItemTheme);
		setConfirmedChatBg(matchedBgTheme);
		setPreviewTheme(matchedItemTheme);
		setPreviewChatBg(matchedBgTheme);
	}, [activeRoom?.roomId, activeRoom?.themeColor, activeRoom?.backgroundColor]);

	// Mở subview đổi màu
	const handleOpenThemeCustomizer = () => {
		setPreviewTheme(confirmedTheme);
		setPreviewChatBg(confirmedChatBg);
		setRightSidebarView("theme");
	};

	// Lưu chủ đề màu vào Backend DB
	const handleApplyTheme = async () => {
		if (!activeRoom) return;

		setIsApplyingTheme(true);
		try {
			await api.put(`/chat/rooms/${activeRoom.roomId}/theme`, {
				themeColor: previewTheme.id,
				backgroundColor: previewChatBg.id,
			});

			setConfirmedTheme(previewTheme);
			setConfirmedChatBg(previewChatBg);

			// Cập nhật room trong state hiện tại
			const updatedRoom: Conversation = {
				...activeRoom,
				themeColor: previewTheme.id,
				backgroundColor: previewChatBg.id,
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
			setConfirmedTheme(previewTheme);
			setConfirmedChatBg(previewChatBg);
			toast.info("Đã áp dụng chủ đề màu cho phiên hiện tại.");
			setRightSidebarView("main");
		} finally {
			setIsApplyingTheme(false);
		}
	};

	// Hủy bỏ và hoàn tác màu cũ
	const handleCancelTheme = () => {
		setPreviewTheme(confirmedTheme);
		setPreviewChatBg(confirmedChatBg);
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

	// Initialize SignalR Hub Connection
	useEffect(() => {
		const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
		const hubUrl = import.meta.env.VITE_API_URL
			? `${import.meta.env.VITE_API_URL}/hubs/notification`
			: "http://localhost:5075/hubs/notification";

		const connection = new signalR.HubConnectionBuilder()
			.withUrl(hubUrl, {
				accessTokenFactory: () => token || "",
				skipNegotiation: false,
				transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
			})
			.withAutomaticReconnect()
			.build();

		connection
			.start()
			.then(() => {
				hubConnectionRef.current = connection;
				connection.on("ReceiveChatMessage", (msg: any) => {
					setMessages((prev) => [
						...prev,
						{
							id: msg.id || String(Date.now()),
							roomId: msg.roomId,
							senderId: msg.senderId,
							content: msg.content,
							messageType: msg.messageType || "Text",
							sentAt: msg.sentAt || new Date().toISOString(),
						},
					]);
				});
			})
			.catch((err) => {
				console.warn("SignalR Connection failed (offline mode):", err.message);
			});

		return () => {
			connection.stop();
		};
	}, []);

	// Join Active Room & Load Chat History
	useEffect(() => {
		if (!activeRoom) return;

		const loadHistory = async () => {
			if (hubConnectionRef.current && hubConnectionRef.current.state === signalR.HubConnectionState.Connected) {
				try {
					await hubConnectionRef.current.invoke("JoinChatRoom", activeRoom.roomId);
					const history: ChatMessageItem[] = await hubConnectionRef.current.invoke(
						"GetChatHistory",
						activeRoom.roomId,
						null,
						50
					);
					setMessages(history || []);
				} catch (e) {
					console.error("Lỗi khi tải lịch sử SignalR:", e);
					setMessages([]);
				}
			} else {
				setMessages([]);
			}
		};

		loadHistory();
	}, [activeRoom?.roomId, isSeller]);

	// Media Slides for Lightbox (chỉ hiển thị ảnh thực tế được gửi trong chat)
	const allMediaImages = useMemo(() => {
		return messages
			.filter((m) => m.messageType === "Image" && m.content)
			.map((m) => m.content);
	}, [messages]);

	const imageSlides = useMemo(() => {
		return allMediaImages.map((url) => ({ src: url }));
	}, [allMediaImages]);

	const openImageInLightbox = (imgUrl: string) => {
		const foundIndex = allMediaImages.indexOf(imgUrl);
		setLightboxIndex(foundIndex >= 0 ? foundIndex : 0);
	};

	// Xử lý gửi tin nhắn
	const handleSendMessage = async () => {
		if ((!inputText.trim() && !pendingMedia) || !activeRoom) return;

		const textContent = inputText.trim();
		const media = pendingMedia;

		setInputText("");
		setPendingMedia(null);
		setShowEmojiPicker(false);
		setIsSending(true);

		const recipientId = isSeller ? activeRoom.buyerUserId : activeRoom.shopId;
		const senderRole = isSeller ? "Seller" : "Buyer";

		// 1. Gửi media nếu có
		if (media) {
			const mediaMsg: ChatMessageItem = {
				id: String(Date.now()),
				roomId: activeRoom.roomId,
				senderId: currentUserId,
				content: media.url,
				messageType: media.type,
				sentAt: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, mediaMsg]);

			try {
				if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
					await hubConnectionRef.current.invoke(
						"SendChatMessage",
						activeRoom.roomId,
						media.url,
						recipientId,
						senderRole,
						media.type
					);
				}
			} catch {
				toast.error("Không thể gửi file.");
			}
		}

		// 2. Gửi văn bản nếu có
		if (textContent) {
			const textMsg: ChatMessageItem = {
				id: String(Date.now() + 1),
				roomId: activeRoom.roomId,
				senderId: currentUserId,
				content: textContent,
				messageType: "Text",
				sentAt: new Date().toISOString(),
			};
			setMessages((prev) => [...prev, textMsg]);

			try {
				if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
					await hubConnectionRef.current.invoke(
						"SendChatMessage",
						activeRoom.roomId,
						textContent,
						recipientId,
						senderRole,
						"Text"
					);
				}
			} catch {
				toast.error("Không thể gửi tin nhắn.");
			}
		}

		// Cập nhật preview lastMessage trong conversation list
		setConversations((prev) =>
			prev.map((c) =>
				c.roomId === activeRoom.roomId
					? {
							...c,
							lastMessage: textContent || (media ? `[${media.type}]` : c.lastMessage),
							lastActiveAt: new Date().toISOString(),
						}
					: c
			)
		);

		setIsSending(false);
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
				activeTheme={activeTheme}
				activeChatBg={activeChatBg}
				onImageClick={openImageInLightbox}
				inputText={inputText}
				onInputTextChange={setInputText}
				onSendMessage={handleSendMessage}
				isSending={isSending}
				pendingMedia={pendingMedia}
				onClearPendingMedia={() => setPendingMedia(null)}
				onImageSelect={(file) => {
					if (file.size > 15 * 1024 * 1024) {
						toast.warning("Vui lòng chọn hình ảnh dưới 15MB");
						return;
					}
					const reader = new FileReader();
					reader.onload = () => {
						setPendingMedia({ url: reader.result as string, type: "Image", file });
					};
					reader.readAsDataURL(file);
				}}
				onVideoSelect={(file) => {
					if (file.size > 50 * 1024 * 1024) {
						toast.warning("Vui lòng chọn video dưới 50MB");
						return;
					}
					const reader = new FileReader();
					reader.onload = () => {
						setPendingMedia({ url: reader.result as string, type: "Video", file });
					};
					reader.readAsDataURL(file);
				}}
				showEmojiPicker={showEmojiPicker}
				onToggleEmojiPicker={() => setShowEmojiPicker((v) => !v)}
				onCloseEmojiPicker={() => setShowEmojiPicker(false)}
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
					confirmedTheme={confirmedTheme}
					confirmedChatBg={confirmedChatBg}
					previewTheme={previewTheme}
					onSetPreviewTheme={setPreviewTheme}
					previewChatBg={previewChatBg}
					onSetPreviewChatBg={setPreviewChatBg}
					hasThemeChanged={hasThemeChanged}
					onApplyTheme={handleApplyTheme}
					onCancelTheme={handleCancelTheme}
					allMediaImages={allMediaImages}
					onImageClick={openImageInLightbox}
					isApplyingTheme={isApplyingTheme}
				/>
			)}

			{/* Lightbox trình xem ảnh toàn màn hình có trượt qua lại mượt mà */}
			<Lightbox
				open={lightboxIndex >= 0}
				close={() => setLightboxIndex(-1)}
				index={lightboxIndex}
				slides={imageSlides}
			/>
		</div>
	);
}

export default ChatPage;
