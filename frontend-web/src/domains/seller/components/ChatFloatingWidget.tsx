import { MessageCircle, Bot, X, Maximize2, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ChatFloatingWidget() {
	const [isWidgetOpen, setIsWidgetOpen] = useState(false);
	const navigate = useNavigate();

	return (
		<div className="fixed bottom-6 right-2 z-50 flex flex-col items-end font-sans select-none">
			{/* Chat popup window */}
			{isWidgetOpen && (
				<div className="w-[350px] sm:w-[380px] h-[440px] bg-white/95 backdrop-blur-xl border border-brand-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 mr-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
					{/* Header */}
					<div className="bg-gradient-to-r from-brand-dark via-gray-900 to-brand-dark text-white px-4 py-3 flex items-center justify-between border-b border-brand-border/40 shadow-sm">
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40">
								<MessageCircle className="w-3.5 h-3.5 text-brand-primary" />
							</div>
							<div>
								<h4 className="text-xs font-black tracking-wide leading-tight">Chat với Cửa Hàng</h4>
								<span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Trực tuyến
								</span>
							</div>
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={() => {
									setIsWidgetOpen(false);
									navigate("/chat");
								}}
								title="Mở toàn màn hình"
								className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-gray-300 hover:text-white"
							>
								<Maximize2 className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={() => setIsWidgetOpen(false)}
								className="p-1.5 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-gray-300 hover:text-white"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>

					{/* Body Content */}
					<div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted gap-3.5 bg-gradient-to-b from-transparent to-brand-light-soft/30">
						<div className="relative">
							<div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-sm">
								<MessageCircle className="w-7 h-7" />
							</div>
							<div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
								✓
							</div>
						</div>
						<div className="space-y-1 max-w-[260px]">
							<h4 className="text-sm font-extrabold text-brand-dark">Kênh Hỗ Trợ Khách Hàng</h4>
							<p className="text-xs text-brand-muted leading-relaxed">
								Trò chuyện trực tiếp với các shop để tư vấn sản phẩm, đơn hàng & bảo hành 24/7.
							</p>
						</div>
						<button
							onClick={() => {
								setIsWidgetOpen(false);
								navigate("/chat");
							}}
							className="px-5 py-2.5 bg-brand-dark hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer border-none shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
						>
							<MessageCircle className="w-3.5 h-3.5 text-brand-primary" />
							Mở hộp thoại Chat
						</button>
					</div>
				</div>
			)}

			{/* Floating buttons docked to the right */}
			<div className="flex flex-col gap-2 mr-2 items-center">
				{/* AI Assistant Button */}
				<button
					onClick={() =>
						toast.info(
							"✨ Trợ lý AI đang được huấn luyện và sẽ sớm ra mắt để phục vụ bạn!"
						)
					}
					className="group relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-brand-primary p-0.5 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-x-1 transition-all duration-200 cursor-pointer border-none flex items-center justify-center"
					title="Trợ lý AI Thông Minh"
				>
					<div className="w-full h-full bg-gray-950/90 rounded-[14px] flex items-center justify-center group-hover:bg-gray-900 transition-colors">
						<Bot className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
					</div>
					<span className="absolute -top-1 -right-1 flex h-3 w-3">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
					</span>
					{/* Tooltip on hover */}
					<span className="absolute right-full mr-2.5 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-gray-800">
						Trợ lý AI <Sparkles className="w-3 h-3 text-brand-primary inline ml-0.5" />
					</span>
				</button>

				{/* Shop Chat Button */}
				<button
					onClick={() => setIsWidgetOpen(!isWidgetOpen)}
					className="group relative w-11 h-11 rounded-2xl bg-brand-primary hover:bg-brand-primary-deep text-brand-dark shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-x-1 transition-all duration-200 flex items-center justify-center cursor-pointer border-none"
					title="Chat với Shop"
				>
					{isWidgetOpen ? (
						<X className="w-5 h-5" />
					) : (
						<MessageCircle className="w-5 h-5" />
					)}
					<span className="absolute right-full mr-2.5 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-gray-800">
						{isWidgetOpen ? "Đóng Chat" : "Chat với Shop"}
					</span>
				</button>
			</div>
		</div>
	);
}

export default ChatFloatingWidget;

