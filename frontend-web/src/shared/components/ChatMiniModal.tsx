import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	MessageOutlined,
	CloseOutlined,
	FullscreenOutlined,
	PictureOutlined,
	VideoCameraOutlined,
	SmileOutlined,
	SendOutlined,
} from "@ant-design/icons";
import { Search, Store, X } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { api } from "@/core";
import { toast } from "react-toastify";
import { useChatStore } from "@/domains/notification";
import { useAuthStore } from "@/domains/auth";
import type { Conversation, ChatMessageDto } from "@/domains/notification";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👏", "📦", "🛍️", "⭐", "💯", "🙏", "😍", "✨", "🎁"];

export function ChatMiniModal() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuthStore();
	const isSeller = location.pathname.startsWith("/seller");

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
	} = useChatStore();

	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [pendingMedia, setPendingMedia] = useState<{ url: string; type: "Image" | "Video"; file?: File } | null>(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	// Scroll to bottom on new message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, pendingMedia]);

	// Fetch conversations on mount
	useEffect(() => {
		const fetchConversations = async () => {
			setLoadingConversations(true);
			try {
				const res = await api.get("/chat/conversations", { params: { isSeller } });
				const list: Conversation[] = res.data?.value || res.data || [];
				setConversations(list);
				if (list.length > 0 && !activeRoom) {
					setActiveRoom(list[0]);
				}
			} catch (err) {
				console.error("Chat: error loading conversations", err);
				setConversations([]);
			} finally {
				setLoadingConversations(false);
			}
		};
		fetchConversations();
	}, [isSeller]);

	// SignalR connection
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

		connection.start()
			.then(() => {
				hubConnectionRef.current = connection;
				connection.on("ReceiveChatMessage", (msg: any) => {
					const newMsg: ChatMessageDto = {
						id: msg.id || String(Date.now()),
						roomId: msg.roomId,
						senderId: msg.senderId,
						content: msg.content,
						messageType: msg.messageType || "Text",
						sentAt: msg.sentAt || new Date().toISOString(),
					};
					appendMessage(newMsg);
				});
			})
			.catch(() => {
				console.warn("Chat mini modal: SignalR offline mode");
			});

		return () => { connection.stop(); };
	}, []);

	// Load history when room changes
	useEffect(() => {
		if (!activeRoom) return;
		clearUnread();

		const loadHistory = async () => {
			if (hubConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
				try {
					await hubConnectionRef.current.invoke("JoinChatRoom", activeRoom.roomId);
					const history: ChatMessageDto[] = await hubConnectionRef.current.invoke(
						"GetChatHistory",
						activeRoom.roomId,
						null,
						30
					);
					setMessages(history || []);
				} catch (e) {
					console.error("ChatMiniModal: error loading history", e);
					setMessages([]);
				}
			} else {
				setMessages([]);
			}
		};

		loadHistory();
	}, [activeRoom?.roomId]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 8 * 1024 * 1024) {
			toast.warning("Vui lòng chọn ảnh dung lượng dưới 8MB");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setPendingMedia({ url: reader.result as string, type: "Image", file });
		};
		reader.readAsDataURL(file);
	};

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 30 * 1024 * 1024) {
			toast.warning("Vui lòng chọn video dung lượng dưới 30MB");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setPendingMedia({ url: reader.result as string, type: "Video", file });
		};
		reader.readAsDataURL(file);
	};

	const handleSend = async () => {
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
			const mediaMsg: ChatMessageDto = {
				id: String(Date.now()),
				roomId: activeRoom.roomId,
				senderId: user?.id || 1,
				content: media.url,
				messageType: media.type,
				sentAt: new Date().toISOString(),
			};
			appendMessage(mediaMsg);

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
			const textMsg: ChatMessageDto = {
				id: String(Date.now() + 1),
				roomId: activeRoom.roomId,
				senderId: user?.id || 1,
				content: textContent,
				messageType: "Text",
				sentAt: new Date().toISOString(),
			};
			appendMessage(textMsg);

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

		setIsSending(false);
	};

	const handleExpandToFullPage = () => {
		closeChat();
		const query = activeRoom
			? `?shopId=${activeRoom.shopId}${isSeller ? "&seller=true" : ""}`
			: isSeller ? "?seller=true" : "";
		navigate(`/chat${query}`);
	};

	const filteredConversations = conversations.filter((c) =>
		c.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())
	);

	const currentUserId = user?.id || 0;

	return (
		<motion.div
			id="chat-mini-modal"
			initial={{ opacity: 0, y: 20, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 16, scale: 0.96 }}
			transition={{ type: "spring", stiffness: 360, damping: 28 }}
			className="fixed bottom-2 right-18 z-[10000] w-[760px] max-w-[calc(100vw-20px)] h-[80vh] max-h-[580px] bg-white rounded-2xl shadow-2xl border border-brand-border flex flex-col overflow-hidden"
		>
			{/* === HEADER 1: Thanh tiêu đề chính trên cùng === */}
			<div className="px-4 py-2.5 border-b border-brand-border flex items-center justify-between bg-white shrink-0 select-none">
				{/* Bên trái: icon chat Ant Design, chữ Chat */}
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-brand-primary/20 text-brand-dark flex items-center justify-center border border-brand-primary/40 shadow-2xs">
						<MessageOutlined className="text-sm text-brand-dark" />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-black text-brand-dark tracking-wide">Chat</span>
						<span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-light-soft text-brand-muted font-bold border border-brand-border/60">
							{isSeller ? "Người bán" : "Khách hàng"}
						</span>
					</div>
				</div>

				{/* Bên phải: nút phóng to (bên trái close), với close */}
				<div className="flex items-center gap-1">
					{/* Nút phóng to (icon mở rộng kiểu Chrome) */}
					<button
						type="button"
						onClick={handleExpandToFullPage}
						className="p-1.5 hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-md transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
						title="Phóng to đoạn chat (Mở trang đầy đủ)"
					>
						<FullscreenOutlined className="text-sm" />
					</button>

					{/* Nút close */}
					<button
						type="button"
						onClick={closeChat}
						className="p-1.5 hover:bg-red-50 text-brand-muted hover:text-red-500 rounded-md transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
						title="Đóng"
					>
						<CloseOutlined className="text-sm" />
					</button>
				</div>
			</div>

			{/* === BODY: Tiếp theo xuống dưới mới bọc thẻ div chứa list conversations & khung chat === */}
			<div className="flex-1 flex overflow-hidden min-h-0">
				{/* === CỘT TRÁI: Thẻ div chứa danh sách các cuộc hội thoại (list conversations) === */}
				<div className="w-64 md:w-72 shrink-0 border-r border-brand-border flex flex-col bg-brand-light-soft/20">
					{/* Thanh tìm kiếm */}
					<div className="p-2 border-b border-brand-border/60 bg-white">
						<div className="relative flex items-center">
							<input
								type="text"
								placeholder={isSeller ? "Tìm khách hàng..." : "Tìm shop..."}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-8 pr-2.5 py-1.5 border border-brand-border rounded-md text-xs font-medium focus:outline-none focus:border-brand-primary bg-brand-light-soft/40 placeholder:text-brand-muted/70"
							/>
							<Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
						</div>
					</div>

					{/* Danh sách các cuộc hội thoại */}
					<div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
						{isLoadingConversations ? (
							<div className="p-6 text-center text-xs text-brand-muted">Đang tải cuộc trò chuyện...</div>
						) : filteredConversations.length === 0 ? (
							<div className="p-6 text-center text-xs text-brand-muted">
								Chưa có cuộc trò chuyện nào
							</div>
						) : (
							filteredConversations.map((conv) => {
								const isActive = activeRoom?.roomId === conv.roomId;
								const initial = conv.displayName?.[0]?.toUpperCase() || "?";
								return (
									<button
										key={conv.roomId}
										onClick={() => setActiveRoom(conv)}
										className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-none cursor-pointer ${
											isActive
												? "bg-brand-primary/10 border-l-4 border-brand-primary shadow-2xs"
												: "hover:bg-brand-light-soft bg-transparent"
										}`}
									>
										<div className="shrink-0 w-8 h-8 rounded-full bg-brand-dark text-brand-primary text-xs font-black flex items-center justify-center overflow-hidden border border-brand-border">
											{conv.displayAvatar ? (
												<img src={conv.displayAvatar} alt={conv.displayName} className="w-full h-full object-cover" />
											) : (
												initial
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-1">
												<p
													className={`text-xs truncate ${
														isActive ? "font-black text-brand-dark" : "font-bold text-slate-800"
													}`}
												>
													{conv.displayName}
												</p>
												<span className="text-[10px] text-brand-muted font-normal shrink-0">
													{conv.lastActiveAt
														? new Date(conv.lastActiveAt).toLocaleTimeString("vi-VN", {
																hour: "2-digit",
																minute: "2-digit",
															})
														: ""}
												</span>
											</div>
											<p
												className={`text-[11px] truncate font-normal mt-0.5 ${
													isActive ? "text-brand-dark/80" : "text-brand-muted"
												}`}
											>
												{conv.lastMessage || "Chưa có tin nhắn"}
											</p>
										</div>
									</button>
								);
							})
						)}
					</div>
				</div>

				{/* === CỘT PHẢI: Khung chat đối thoại chi tiết === */}
				<div className="flex-1 flex flex-col overflow-hidden bg-white min-h-0">
					{activeRoom ? (
						<>
							{/* Header thông tin đối tác chat (Đã bỏ chữ chính chủ) */}
							<div className="px-4 py-2.5 border-b border-brand-border flex items-center justify-between bg-white shrink-0">
								<div className="flex items-center gap-2.5 min-w-0">
									<div className="w-8 h-8 rounded-full bg-brand-dark text-brand-primary text-xs font-black flex items-center justify-center shrink-0 border border-brand-border overflow-hidden">
										{activeRoom.displayAvatar ? (
											<img src={activeRoom.displayAvatar} alt={activeRoom.displayName} className="w-full h-full object-cover rounded-full" />
										) : (
											activeRoom.displayName?.[0]?.toUpperCase() || "?"
										)}
									</div>
									<div className="min-w-0">
										<p className="text-xs font-black text-brand-dark truncate max-w-[220px]">{activeRoom.displayName}</p>
										<p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
											Đang hoạt động
										</p>
									</div>
								</div>

								{!isSeller && (
									<a
										href={`/shops/${activeRoom.shopId}`}
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-light-soft hover:bg-brand-border/40 text-brand-dark rounded-md text-[11px] font-bold transition-colors border border-brand-border no-underline shrink-0"
									>
										<Store className="w-3.5 h-3.5" />
										Xem shop
									</a>
								)}
							</div>

							{/* Messages area (Đã bỏ chữ bảo mật SignalR) */}
							<div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-brand-light-soft/20">
								{messages.map((msg, i) => {
									const isMe = msg.senderId === currentUserId;

									// Time separator logic (> 30 phút)
									const prevMsg = messages[i - 1];
									const showTimeSep = prevMsg
										? (new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime()) > 30 * 60 * 1000
										: false;

									const timeLabel = new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
										hour: "2-digit",
										minute: "2-digit",
									});

									return (
										<div key={msg.id}>
											{showTimeSep && (
												<div className="flex items-center gap-2 my-2.5">
													<div className="flex-1 h-px bg-brand-border/60" />
													<span className="text-[9px] text-brand-muted font-semibold whitespace-nowrap">{timeLabel}</span>
													<div className="flex-1 h-px bg-brand-border/60" />
												</div>
											)}
											<div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
												<div className="group relative">
													<div
														className={`max-w-[320px] rounded-md px-3 py-2 text-xs font-medium leading-relaxed shadow-2xs ${
															isMe
																? "bg-brand-dark text-white"
																: "bg-white text-brand-dark border border-brand-border"
														}`}
													>
														{msg.messageType === "Image" ? (
															<img
																src={msg.content}
																alt="Ảnh đính kèm"
																className="max-w-[240px] max-h-[220px] rounded-md object-cover cursor-pointer hover:opacity-95"
																onClick={() => window.open(msg.content, "_blank")}
															/>
														) : msg.messageType === "Video" ? (
															<video src={msg.content} controls className="max-w-[260px] rounded-md shadow-xs" />
														) : (
															<p className="break-words">{msg.content}</p>
														)}
													</div>
													{/* Hover timestamp */}
													<span
														className={`absolute top-1/2 -translate-y-1/2 text-[9px] text-brand-muted font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none ${
															isMe ? "right-full mr-2" : "left-full ml-2"
														}`}
													>
														{timeLabel}
													</span>
												</div>
											</div>
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>

							{/* Input bar kèm chỗ gửi ảnh, video, sticker */}
							<div className="p-2.5 border-t border-brand-border bg-white shrink-0 relative">
								{/* Media preview nếu đang chọn */}
								{pendingMedia && (
									<div className="mb-2 flex items-center gap-2 p-1.5 bg-brand-light-soft rounded-lg border border-brand-border w-fit relative">
										{pendingMedia.type === "Image" ? (
											<img src={pendingMedia.url} alt="preview" className="w-12 h-12 rounded object-cover" />
										) : (
											<video src={pendingMedia.url} className="w-12 h-12 rounded object-cover" />
										)}
										<span className="text-[11px] font-semibold text-brand-dark pr-6 truncate max-w-[160px]">
											{pendingMedia.file?.name || "Đính kèm"}
										</span>
										<button
											type="button"
											onClick={() => setPendingMedia(null)}
											className="absolute top-1 right-1 p-0.5 hover:bg-gray-200 rounded-full text-brand-muted cursor-pointer border-none bg-transparent"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									</div>
								)}

								{/* Emoji Quick Picker: Floating absolute không làm nhích khung chat */}
								<AnimatePresence>
									{showEmojiPicker && (
										<motion.div
											initial={{ opacity: 0, y: 5, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 5, scale: 0.95 }}
											className="absolute bottom-full mb-2 left-2 z-50 p-2 bg-white rounded-xl border border-brand-border shadow-xl flex flex-wrap gap-1.5 max-w-[280px]"
										>
											{QUICK_EMOJIS.map((emoji) => (
												<button
													key={emoji}
													type="button"
													onClick={() => {
														setInputText((prev) => prev + emoji);
														setShowEmojiPicker(false);
													}}
													className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer border-none bg-transparent rounded hover:bg-brand-light-soft"
												>
													{emoji}
												</button>
											))}
										</motion.div>
									)}
								</AnimatePresence>

								{/* Form gõ tin nhắn + nút gửi */}
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleSend();
									}}
									className="flex items-center gap-2"
								>
									{/* Hidden file inputs */}
									<input
										type="file"
										ref={imageInputRef}
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
									/>
									<input
										type="file"
										ref={videoInputRef}
										accept="video/*"
										onChange={handleVideoChange}
										className="hidden"
									/>

									{/* Action buttons (Ảnh, Video, Sticker) */}
									<div className="flex items-center gap-0.5 text-brand-muted shrink-0">
										<button
											type="button"
											onClick={() => imageInputRef.current?.click()}
											className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors cursor-pointer border-none bg-transparent"
											title="Gửi hình ảnh"
										>
											<PictureOutlined className="text-base" />
										</button>
										<button
											type="button"
											onClick={() => videoInputRef.current?.click()}
											className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors cursor-pointer border-none bg-transparent"
											title="Gửi video"
										>
											<VideoCameraOutlined className="text-base" />
										</button>
										<button
											type="button"
											onClick={() => setShowEmojiPicker((s) => !s)}
											className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors cursor-pointer border-none bg-transparent"
											title="Biểu tượng cảm xúc / Sticker"
										>
											<SmileOutlined className="text-base" />
										</button>
									</div>

									{/* Input box */}
									<input
										type="text"
										placeholder="Nhập tin nhắn..."
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										className="flex-1 pl-3 pr-2.5 py-1.5 border border-brand-border rounded-md text-xs font-medium focus:outline-none focus:border-brand-primary bg-brand-light-soft/40"
									/>

									{/* Nút gửi */}
									<button
										type="submit"
										disabled={(!inputText.trim() && !pendingMedia) || isSending}
										className="p-2 bg-brand-dark text-brand-primary hover:bg-brand-dark/90 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer shrink-0 font-bold flex items-center justify-center"
										title="Gửi tin nhắn"
									>
										<SendOutlined className="text-sm" />
									</button>
								</form>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-muted gap-2.5">
							<div className="w-12 h-12 rounded-full bg-brand-light-soft flex items-center justify-center text-brand-muted/40 border border-brand-border">
								<MessageOutlined className="text-xl" />
							</div>
							<p className="text-xs font-bold text-brand-dark">Chọn cuộc trò chuyện để bắt đầu</p>
							<p className="text-[11px] text-brand-muted">Trao đổi trực tiếp, nhận hỗ trợ tức thì</p>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
