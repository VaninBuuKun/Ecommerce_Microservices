import { useEffect, useRef } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useChatConnection } from "../hooks/useChatConnection";
import { MessageCircle, MessageSquare, X } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";

// Sub-components
import ChatConversationList from "./chat/ChatConversationList";
import ChatHeader from "./chat/ChatHeader";
import ChatMessageBubble from "./chat/ChatMessageBubble";
import ChatInputBar from "./chat/ChatInputBar";

export default function ChatFloatingWidget() {
	const { openChatWithShop, closeChat } = useChatStore();
	const [isWidgetOpen, setIsWidgetOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const {
		userId,
		isSeller,
		conversations,
		isConversationsLoading,
		fetchConversations,
		selectConversation,
		currentRoomId,
		currentShopId,
		currentShopName,
		messages,
		hasMore,
		sendMessage,
		sendAttachment,
		isUploading,
		loadOlderMessages,
		isConnected,
	} = useChatConnection();

	// ─── Listen to dispatch event from ProductDetailPage ──────
	useEffect(() => {
		const handleOpenChatEvent = (e: Event) => {
			const data = (e as CustomEvent).detail;
			if (data?.shopId) {
				openChatWithShop(data.shopId, data.shopName);
				setIsWidgetOpen(true);
				fetchConversations(data.shopId, data.shopName);
			}
		};

		window.addEventListener("open-shop-chat", handleOpenChatEvent);
		return () =>
			window.removeEventListener("open-shop-chat", handleOpenChatEvent);
	}, [openChatWithShop, fetchConversations]);

	// ─── Fetch conversations when widget opens ───────────────
	useEffect(() => {
		if (isWidgetOpen) {
			fetchConversations();
		}
	}, [isWidgetOpen, isSeller, fetchConversations]);

	// ─── Auto scroll to bottom on new messages ───────────────
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({
				behavior: "auto",
				block: "end",
			});
		}
	}, [messages]);

	// ─── Scroll handler for loading older messages ───────────
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (e.currentTarget.scrollTop === 0 && hasMore) {
			loadOlderMessages();
		}
	};

	// ─── Derive header props ─────────────────────────────────
	const currentRoom = conversations.find(
		(c) => c.roomId === currentRoomId,
	);
	const headerAvatarUrl = currentRoom?.displayAvatar || "";
	const headerProfileLink = isSeller
		? `/user/${currentRoom?.buyerUserId || 0}`
		: `/shop/${currentShopId}`;

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
			{/* ═══ Chat Window ═══ */}
			{isWidgetOpen && (
				<div className="w-[580px] h-[450px] bg-white border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
					{/* Top bar */}
					<div className="bg-brand-primary text-brand-dark px-4 py-3 flex items-center justify-between border-b border-brand-border">
						<h4 className="text-xs font-black">Tin nhắn</h4>
						<button
							onClick={() => {
								setIsWidgetOpen(false);
								closeChat();
							}}
							className="p-1 hover:bg-black/10 rounded-full transition-colors border-none bg-transparent cursor-pointer"
						>
							<X className="w-4.5 h-4.5 text-brand-dark" />
						</button>
					</div>

					{/* Body: left sidebar + right panel */}
					<div className="flex-1 flex overflow-hidden">
						{/* Left: Conversations */}
						<ChatConversationList
							conversations={conversations}
							currentRoomId={currentRoomId}
							isLoading={isConversationsLoading}
							onSelectConversation={selectConversation}
						/>

						{/* Right: Chat panel */}
						<div className="flex-1 flex flex-col overflow-hidden bg-brand-light-soft/20">
							{currentShopId ? (
								<div className="flex-1 flex flex-col overflow-hidden">
									{/* Header */}
									<ChatHeader
										shopName={currentShopName}
										avatarUrl={headerAvatarUrl}
										profileLink={headerProfileLink}
										isSeller={isSeller}
									/>

									{/* Messages area */}
									<div
										onScroll={handleScroll}
										className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col"
									>
										{messages.map((msg, index) => (
											<ChatMessageBubble
												key={msg.id || index}
												content={msg.content}
												fromMe={
													String(msg.senderId) ===
													userId
												}
												sentAt={msg.sentAt}
											/>
										))}
										<div ref={messagesEndRef} />
									</div>

									{/* Input bar */}
									<ChatInputBar
										onSendMessage={sendMessage}
										onFileUpload={sendAttachment}
										isUploading={isUploading}
									/>
								</div>
							) : (
								/* Empty state */
								<div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted gap-2.5">
									<div className="w-12 h-12 rounded-full bg-brand-light-soft flex items-center justify-center text-brand-muted">
										<MessageCircle className="w-6 h-6 text-brand-muted" />
									</div>
									<div className="space-y-1">
										<h4 className="text-xs font-bold text-brand-dark">
											Chọn cuộc trò chuyện
										</h4>
										<p className="text-[10px] max-w-[200px] leading-relaxed">
											Vui lòng chọn một cuộc hội thoại
											bên trái để bắt đầu chat, hoặc bấm
											chat với người bán từ trang sản
											phẩm.
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ═══ Floating Buttons ═══ */}
			<div className="flex gap-2.5 items-center">
				{/* AI Chat (mock) */}
				<button
					onClick={() =>
						toast.info(
							"Tính năng Trợ lý AI đang được chuẩn bị phát triển!",
						)
					}
					className="w-11 h-11 rounded-full bg-brand-dark border border-brand-border/40 text-brand-light flex items-center justify-center shadow-lg hover:opacity-90 transition-all cursor-pointer"
					title="Trò chuyện AI"
				>
					<MessageSquare className="w-5 h-5 text-brand-primary" />
				</button>

				{/* Chat toggle */}
				<button
					onClick={() => setIsWidgetOpen(!isWidgetOpen)}
					className="w-12 h-12 rounded-full bg-brand-primary text-brand-dark flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer border-none"
					title="Trò chuyện người bán"
				>
					{isWidgetOpen ? (
						<X className="w-5 h-5" />
					) : (
						<MessageCircle className="w-6 h-6" />
					)}
				</button>
			</div>
		</div>
	);
}
