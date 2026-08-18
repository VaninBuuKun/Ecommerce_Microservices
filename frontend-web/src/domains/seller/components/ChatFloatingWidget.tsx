import { MessageCircle, MessageSquare, X } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";

export function ChatFloatingWidget() {
	const [isWidgetOpen, setIsWidgetOpen] = useState(false);

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans select-none">
			{isWidgetOpen && (
				<div className="w-[360px] h-[400px] bg-white border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
					<div className="bg-brand-primary text-brand-dark px-4 py-3 flex items-center justify-between border-b border-brand-border">
						<h4 className="text-xs font-black">Trò chuyện với Cửa Hàng</h4>
						<button
							onClick={() => setIsWidgetOpen(false)}
							className="p-1 hover:bg-black/10 rounded-full transition-colors border-none bg-transparent cursor-pointer"
						>
							<X className="w-4.5 h-4.5 text-brand-dark" />
						</button>
					</div>

					<div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted gap-3">
						<div className="w-12 h-12 rounded-full bg-brand-light-soft flex items-center justify-center text-brand-muted">
							<MessageCircle className="w-6 h-6 text-brand-primary" />
						</div>
						<div className="space-y-1">
							<h4 className="text-xs font-bold text-brand-dark">Kênh Chat Trực Tuyến</h4>
							<p className="text-[11px] text-brand-muted leading-relaxed">
								Tính năng trò chuyện trực tiếp với chủ shop hiện đang chạy chế độ thử nghiệm. Bạn có thể gửi câu hỏi tại trang sản phẩm!
							</p>
						</div>
					</div>
				</div>
			)}

			<div className="flex gap-2.5 items-center">
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

export default ChatFloatingWidget;
