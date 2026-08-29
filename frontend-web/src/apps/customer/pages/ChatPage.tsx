import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/core";
import * as signalR from "@microsoft/signalr";
import { ArrowLeft, MessageSquare, RefreshCw, Search, Send, Store } from "lucide-react";

interface Conversation {
	roomId: string;
	shopId: number;
	buyerUserId: number;
	lastMessage: string;
	lastActiveAt: string;
	displayName: string;
	displayAvatar: string;
}

interface ChatMessageItem {
	id: string;
	roomId: string;
	senderId: number;
	content: string;
	sentAt: string;
}

export function ChatPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const targetShopIdParam = searchParams.get("shopId");

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeRoom, setActiveRoom] = useState<Conversation | null>(null);
	const [messages, setMessages] = useState<ChatMessageItem[]>([]);
	const [inputText, setInputText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);

	const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Scroll to bottom when new message arrives
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Fetch Conversations
	const fetchConversations = async () => {
		try {
			setIsLoading(true);
			const res = await api.get("/chat/conversations", { params: { isSeller: false } });
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
			// Fallback mock conversations if backend chat not connected
			const mockList: Conversation[] = [
				{
					roomId: "room-1",
					shopId: 101,
					buyerUserId: 1,
					lastMessage: "Dạ sản phẩm này bên em còn hàng chị nhé!",
					lastActiveAt: new Date().toISOString(),
					displayName: "Cửa Hàng Thiết Bị Điện Máy Official",
					displayAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
				},
				{
					roomId: "room-2",
					shopId: 102,
					buyerUserId: 1,
					lastMessage: "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển GHN.",
					lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
					displayName: "Thời Trang Nam CoolStyle",
					displayAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
				},
			];
			setConversations(mockList);
			setActiveRoom(mockList[0]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchConversations();
	}, [targetShopIdParam]);

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
				console.log("SignalR Chat Connected!");
				hubConnectionRef.current = connection;

				// Listen for incoming messages
				connection.on("ReceiveChatMessage", (msg: any) => {
					setMessages((prev) => [
						...prev,
						{
							id: msg.id || String(Date.now()),
							roomId: msg.roomId,
							senderId: msg.senderId,
							content: msg.content,
							sentAt: msg.sentAt || new Date().toISOString(),
						},
					]);
				});
			})
			.catch((err) => {
				console.warn("SignalR Connection failed (running in offline/mock fallback mode):", err.message);
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
					const history: ChatMessageItem[] = await hubConnectionRef.current.invoke("GetChatHistory", activeRoom.roomId, null, 50);
					setMessages(history || []);
				} catch (e) {
					console.error("Lỗi khi tải lịch sử SignalR:", e);
				}
			} else {
				// Mock messages for UI observation
				setMessages([
					{
						id: "m-1",
						roomId: activeRoom.roomId,
						senderId: 999, // Shop
						content: `Xin chào! Cảm ơn bạn đã liên hệ với ${activeRoom.displayName}. Shop có thể hỗ trợ gì cho bạn ạ?`,
						sentAt: new Date(Date.now() - 600000).toISOString(),
					},
					{
						id: "m-2",
						roomId: activeRoom.roomId,
						senderId: 1, // Buyer
						content: activeRoom.lastMessage || "Sản phẩm này có được bảo hành chính hãng không shop?",
						sentAt: new Date(Date.now() - 300000).toISOString(),
					},
				]);
			}
		};

		loadHistory();
	}, [activeRoom]);

	const handleSendMessage = async () => {
		if (!inputText.trim() || !activeRoom) return;

		const content = inputText.trim();
		setInputText("");
		setIsSending(true);

		const tempMessage: ChatMessageItem = {
			id: String(Date.now()),
			roomId: activeRoom.roomId,
			senderId: 1, // Current buyer ID
			content: content,
			sentAt: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, tempMessage]);

		try {
			if (hubConnectionRef.current && hubConnectionRef.current.state === signalR.HubConnectionState.Connected) {
				await hubConnectionRef.current.invoke("SendChatMessage", activeRoom.roomId, content, activeRoom.shopId, "Buyer");
			} else {
				// Mock Auto Response from Shop after 1.2s
				setTimeout(() => {
					setMessages((prev) => [
						...prev,
						{
							id: String(Date.now() + 1),
							roomId: activeRoom.roomId,
							senderId: activeRoom.shopId,
							content: "Dạ shop đã nhận được tin nhắn của bạn và sẽ phản hồi trong giây lát ạ!",
							sentAt: new Date().toISOString(),
						},
					]);
				}, 1200);
			}
		} catch (err) {
			toast.error("Không thể gửi tin nhắn qua SignalR.");
		} finally {
			setIsSending(false);
		}
	};

	const filteredConversations = conversations.filter((c) =>
		c.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim()),
	);

	return (
		<div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col">
			{/* Sub-header Navigation */}
			<div className="bg-white border-b border-brand-border px-6 py-3.5 flex items-center justify-between shadow-xs">
				<div className="flex items-center gap-3">
					<button
						onClick={() => navigate(-1)}
						className="p-2 hover:bg-brand-light-soft rounded-xl transition-colors cursor-pointer border border-brand-border bg-white"
						title="Quay lại"
					>
						<ArrowLeft className="w-4 h-4 text-brand-dark" />
					</button>
					<div>
						<h1 className="text-base font-black text-brand-dark flex items-center gap-2">
							<MessageSquare className="w-5 h-5 text-brand-primary" />
							Trung Tâm Trò Chuyện Trực Tuyến
						</h1>
						<p className="text-xs text-brand-muted font-medium">Trao đổi thông tin trực tiếp giữa Khách hàng và Chủ Shop</p>
					</div>
				</div>
				<button
					onClick={fetchConversations}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border text-xs font-bold hover:bg-brand-light-soft transition-colors cursor-pointer bg-white"
				>
					<RefreshCw className="w-3.5 h-3.5 text-brand-muted" />
					Làm mới hội thoại
				</button>
			</div>

			{/* Main Layout Chat Interface */}
			<div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-4 h-[calc(100vh-80px)] overflow-hidden">
				{/* Left Sidebar - Conversations List */}
				<div className="w-80 md:w-96 bg-white border border-brand-border rounded-2xl shadow-xs flex flex-col overflow-hidden shrink-0">
					{/* Search Bar */}
					<div className="p-3.5 border-b border-brand-border bg-brand-light-soft/50">
						<div className="relative">
							<input
								type="text"
								placeholder="Tìm kiếm shop..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary bg-white"
							/>
							<Search className="w-4 h-4 absolute left-3 top-2.5 text-brand-muted" />
						</div>
					</div>

					{/* Conversations Items */}
					<div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
						{isLoading ? (
							<div className="p-6 text-center text-xs text-brand-muted font-medium">Đang tải cuộc hội thoại...</div>
						) : filteredConversations.length === 0 ? (
							<div className="p-8 text-center text-brand-muted space-y-2">
								<MessageSquare className="w-8 h-8 mx-auto text-brand-muted/40" />
								<p className="text-xs font-bold">Chưa có cuộc trò chuyện nào</p>
							</div>
						) : (
							filteredConversations.map((conv) => {
								const isActive = activeRoom?.roomId === conv.roomId;
								return (
									<div
										key={conv.roomId}
										onClick={() => setActiveRoom(conv)}
										className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${isActive ? "bg-brand-primary/10 border-l-4 border-brand-primary" : "hover:bg-brand-light-soft"
											}`}
									>
										<div className="relative shrink-0">
											<img
												src={conv.displayAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
												alt={conv.displayName}
												className="w-11 h-11 rounded-full object-cover border border-brand-border"
											/>
											<span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-xs"></span>
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-1 mb-1">
												<h4 className="text-xs font-bold text-brand-dark truncate">{conv.displayName}</h4>
												<span className="text-[10px] text-brand-muted font-medium shrink-0">
													{new Date(conv.lastActiveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</span>
											</div>
											<p className="text-[11px] text-brand-muted truncate font-normal">{conv.lastMessage || "Bắt đầu cuộc hội thoại..."}</p>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Right Main Chat Panel */}
				<div className="flex-1 bg-white border border-brand-border rounded-2xl shadow-xs flex flex-col overflow-hidden">
					{activeRoom ? (
						<>
							{/* Chat Header */}
							<div className="px-5 py-3.5 border-b border-brand-border flex items-center justify-between bg-white">
								<div className="flex items-center gap-3">
									<img
										src={activeRoom.displayAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
										alt={activeRoom.displayName}
										className="w-10 h-10 rounded-full object-cover border border-brand-border"
									/>
									<div>
										<h3 className="text-sm font-black text-brand-dark flex items-center gap-2">
											{activeRoom.displayName}
											<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Chính chủ</span>
										</h3>
										<p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
											Đang hoạt động
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Link
										to={`/shops/${activeRoom.shopId}`}
										className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-light-soft hover:bg-brand-border/40 text-brand-dark rounded-xl text-xs font-bold transition-colors text-decoration-none border border-brand-border"
									>
										<Store className="w-3.5 h-3.5" />
										Xem Shop
									</Link>
								</div>
							</div>

							{/* Messages Area */}
							<div className="flex-1 p-5 overflow-y-auto bg-brand-light-soft/30 space-y-4">
								<div className="text-center my-2">
									<span className="text-[10px] bg-white border border-brand-border px-3 py-1 rounded-full text-brand-muted font-semibold shadow-2xs">
										Cuộc hội thoại được bảo mật & hỗ trợ bởi SignalR Realtime Hub
									</span>
								</div>

								{messages.map((msg) => {
									const isMyMessage = msg.senderId === 1 || String(msg.senderId) !== String(activeRoom.shopId);
									return (
										<div
											key={msg.id}
											className={`flex ${isMyMessage ? "justify-end" : "justify-start"} animate-in fade-in duration-150`}
										>
											<div
												className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-2xs leading-relaxed ${isMyMessage
														? "bg-brand-dark text-white rounded-br-none"
														: "bg-white text-brand-dark border border-brand-border rounded-bl-none"
													}`}
											>
												<p>{msg.content}</p>
												<span
													className={`text-[9px] block text-right mt-1 font-semibold ${isMyMessage ? "text-white/60" : "text-brand-muted"
														}`}
												>
													{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
												</span>
											</div>
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>

							{/* Chat Input Bar */}
							<div className="p-4 border-t border-brand-border bg-white">
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleSendMessage();
									}}
									className="flex items-center gap-2"
								>
									<div className="flex-1 relative flex items-center">
										<input
											type="text"
											placeholder="Nhập tin nhắn..."
											value={inputText}
											onChange={(e) => setInputText(e.target.value)}
											className="w-full pl-4 pr-10 py-2.5 border border-brand-border rounded-2xl text-xs font-medium focus:outline-none focus:border-brand-primary bg-brand-light-soft/50"
										/>
									</div>

									<button
										type="submit"
										disabled={!inputText.trim() || isSending}
										className="p-2.5 bg-brand-primary text-brand-dark rounded-2xl hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer font-bold shrink-0 shadow-xs"
									>
										<Send className="w-4 h-4" />
									</button>
								</form>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-muted gap-3">
							<MessageSquare className="w-12 h-12 text-brand-muted/40" />
							<p className="text-sm font-bold text-brand-dark">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default ChatPage;
