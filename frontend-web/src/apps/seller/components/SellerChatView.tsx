import { useState, useEffect } from "react";
import { MessageSquare, Send, User, Loader2, Store } from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

interface Conversation {
	partnerId: number;
	partnerName: string;
	partnerAvatar?: string;
	lastMessage: string;
	lastMessageAt: string;
	unreadCount: number;
}

interface ChatMessage {
	id: string;
	senderId: number;
	receiverId: number;
	content: string;
	createdAt: string;
}

export function SellerChatView() {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputText, setInputText] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);

	useEffect(() => {
		const fetchConversations = async () => {
			try {
				setIsLoading(true);
				const res = await api.get("/chat/conversations", { params: { isSeller: true } });
				const data = res.data?.value || res.data || [];
				setConversations(data);
				if (data.length > 0) setActivePartnerId(data[0].partnerId || data[0].buyerUserId);
			} catch (err: any) {
				console.error("Lỗi tải hội thoại chat seller:", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchConversations();
	}, []);

	useEffect(() => {
		const fetchMessages = async () => {
			if (!activePartnerId) return;
			try {
				const res = await api.get(`/chats/messages`, {
					params: { partnerId: activePartnerId },
				});
				const data = res.data?.value || res.data || [];
				setMessages(data);
			} catch (err: any) {
				console.error("Lỗi tải tin nhắn:", err);
			}
		};

		fetchMessages();
	}, [activePartnerId]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputText.trim() || !activePartnerId) return;

		const textToSend = inputText.trim();
		setInputText("");

		try {
			setIsSending(true);
			await api.post("/chats/send", {
				receiverId: activePartnerId,
				content: textToSend,
			});
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					senderId: 999,
					receiverId: activePartnerId,
					content: textToSend,
					createdAt: new Date().toISOString(),
				},
			]);
		} catch (err: any) {
			toast.error("Gửi tin nhắn thất bại.");
		} finally {
			setIsSending(false);
		}
	};

	const activePartner = conversations.find((c) => c.partnerId === activePartnerId);

	return (
		<div className="bg-white border border-brand-border rounded-2xl shadow-xs overflow-hidden h-[75vh] flex text-left font-sans">
			{/* CỘT TRÁI: DỊCH VỤ KHÁCH HÀNG / DANH SÁCH CONVERSATIONS */}
			<div className="w-80 border-r border-brand-border flex flex-col bg-slate-50 shrink-0">
				<div className="p-4 border-b border-brand-border bg-white flex items-center gap-2">
					<MessageSquare className="w-5 h-5 text-brand-primary" />
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Chat với Khách hàng
					</h2>
				</div>

				<div className="flex-1 overflow-y-auto divide-y divide-slate-100">
					{isLoading ? (
						<div className="py-12 text-center text-xs font-bold text-brand-muted flex flex-col items-center gap-2">
							<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
							Đang tải tin nhắn...
						</div>
					) : conversations.length === 0 ? (
						<div className="py-12 text-center text-xs font-bold text-brand-muted px-4">
							Chưa có tin nhắn nào từ khách hàng.
						</div>
					) : (
						conversations.map((conv) => {
							const isActive = conv.partnerId === activePartnerId;
							return (
								<div
									key={conv.partnerId}
									onClick={() => setActivePartnerId(conv.partnerId)}
									className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
										isActive ? "bg-brand-primary/10 border-l-4 border-brand-primary font-bold" : "hover:bg-white bg-slate-50"
									}`}
								>
									<div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 font-bold overflow-hidden border border-slate-300">
										{conv.partnerAvatar ? (
											<img src={conv.partnerAvatar} alt={conv.partnerName} className="w-full h-full object-cover" />
										) : (
											<User className="w-5 h-5" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<h4 className="text-xs font-bold text-brand-dark truncate">{conv.partnerName}</h4>
											<span className="text-[9px] text-slate-400 font-semibold">
												{new Date(conv.lastMessageAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
											</span>
										</div>
										<p className="text-[11px] text-brand-muted truncate mt-0.5 font-medium">{conv.lastMessage}</p>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* CỘT PHẢI: KHUNG TRÒ CHUYỆN HIỆN TẠI */}
			<div className="flex-1 flex flex-col bg-white">
				{activePartner ? (
					<>
						{/* Active Header */}
						<div className="p-4 border-b border-brand-border flex items-center gap-3 bg-slate-50">
							<div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
								<User className="w-5 h-5" />
							</div>
							<div>
								<h3 className="text-xs font-black text-brand-dark">{activePartner.partnerName}</h3>
								<span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trực tuyến
								</span>
							</div>
						</div>

						{/* Chat Messages */}
						<div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
							{messages.map((msg) => {
								const isMe = msg.senderId !== activePartnerId;
								return (
									<div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
										<div
											className={`max-w-[70%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-2xs ${
												isMe
													? "bg-brand-dark text-white rounded-br-none"
													: "bg-white text-brand-dark border border-brand-border rounded-bl-none"
											}`}
										>
											<p>{msg.content}</p>
											<span className={`text-[9px] block mt-1 text-right ${isMe ? "text-slate-300" : "text-slate-400"}`}>
												{new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
											</span>
										</div>
									</div>
								);
							})}
						</div>

						{/* Input Box */}
						<form onSubmit={handleSendMessage} className="p-3 border-t border-brand-border bg-white flex items-center gap-2">
							<input
								type="text"
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								placeholder="Nhập tin nhắn trả lời khách hàng..."
								className="flex-1 h-10 px-4 bg-slate-50 border border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-primary"
							/>
							<button
								type="submit"
								disabled={isSending || !inputText.trim()}
								className="h-10 px-4 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border-none transition-all"
							>
								{isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
								<span>Gửi</span>
							</button>
						</form>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center gap-2 text-brand-muted text-xs font-bold">
						<Store className="w-10 h-10 text-slate-300" />
						Chọn một cuộc hội thoại bên trái để bắt đầu nhắn tin.
					</div>
				)}
			</div>
		</div>
	);
}

export default SellerChatView;
