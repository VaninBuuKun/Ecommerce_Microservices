import { useState } from "react";
import { Send, Image, Video, Sparkles, Paperclip, Loader2, Smile } from "lucide-react";

interface ChatInputBarProps {
	onSendMessage: (text: string) => Promise<void>;
	onFileUpload: (file: File) => Promise<void>;
	isUploading: boolean;
}

// 12 adorable animated WebP stickers from Google Noto Emoji library
const STICKERS = [
	{ id: "laughing", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.webp" },
	{ id: "crying", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.webp" },
	{ id: "love", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp" },
	{ id: "wow", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f632/512.webp" },
	{ id: "sunglasses", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp" },
	{ id: "clapping", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp" },
	{ id: "celebrating", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp" },
	{ id: "fire", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp" },
	{ id: "wink", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.webp" },
	{ id: "sweating", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f605/512.webp" },
	{ id: "mindblown", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp" },
	{ id: "heart", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp" }
];

export default function ChatInputBar({
	onSendMessage,
	onFileUpload,
	isUploading,
}: ChatInputBarProps) {
	const [messageText, setMessageText] = useState("");
	const [showStickerPanel, setShowStickerPanel] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageText.trim()) return;
		const text = messageText;
		setMessageText("");
		await onSendMessage(text);
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			await onFileUpload(file);
		}
		// Reset input so same file can be re-selected
		e.target.value = "";
	};

	const triggerFileInput = (accept?: string) => {
		const input = document.getElementById("chat-file-upload") as HTMLInputElement;
		if (input) {
			if (accept) input.accept = accept;
			input.click();
		}
	};

	const handleSelectSticker = async (url: string) => {
		setShowStickerPanel(false);
		await onSendMessage(`[sticker]:${url}`);
	};

	return (
		<div className="relative overflow-visible">
			{/* Sticker Selection Popover */}
			{showStickerPanel && (
				<div className="absolute bottom-full left-3 mb-2 w-52 bg-white border border-brand-border rounded-xl shadow-xl p-2.5 grid grid-cols-4 gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
					<div className="col-span-4 flex items-center justify-between pb-1 border-b border-brand-border/40 select-none">
						<span className="text-[9px] font-black text-brand-dark flex items-center gap-1">
							<Smile className="w-3 h-3 text-brand-primary-deep" />
							Nhãn dán động
						</span>
						<button
							type="button"
							onClick={() => setShowStickerPanel(false)}
							className="text-[9px] font-bold text-brand-muted hover:text-brand-dark border-none bg-transparent cursor-pointer"
						>
							Đóng
						</button>
					</div>
					{STICKERS.map((stk) => (
						<button
							key={stk.id}
							type="button"
							onClick={() => handleSelectSticker(stk.url)}
							className="w-10 h-10 p-1 rounded-lg hover:bg-brand-light-soft transition-colors flex items-center justify-center border-none bg-transparent cursor-pointer"
							title={stk.id}
						>
							<img src={stk.url} alt={stk.id} className="w-full h-full object-contain" />
						</button>
					))}
				</div>
			)}

			{/* Hidden file input */}
			<input
				type="file"
				id="chat-file-upload"
				className="hidden"
				onChange={handleFileChange}
				accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-rar-compressed"
			/>

			{/* Attachment toolbar */}
			<div className="px-3 py-1 bg-white border-t border-brand-border flex items-center gap-3 select-none">
				<button
					type="button"
					onClick={() => triggerFileInput("image/*")}
					disabled={isUploading}
					className="p-1.5 hover:bg-brand-light-soft rounded-lg text-brand-muted hover:text-brand-primary-deep transition-all border-none bg-transparent cursor-pointer disabled:opacity-40"
					title="Gửi hình ảnh"
				>
					<Image className="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onClick={() => triggerFileInput("video/*")}
					disabled={isUploading}
					className="p-1.5 hover:bg-brand-light-soft rounded-lg text-brand-muted hover:text-brand-primary-deep transition-all border-none bg-transparent cursor-pointer disabled:opacity-40"
					title="Gửi video"
				>
					<Video className="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onClick={() => setShowStickerPanel(!showStickerPanel)}
					className={`p-1.5 rounded-lg transition-all border-none bg-transparent cursor-pointer ${
						showStickerPanel
							? "bg-brand-primary/25 text-brand-primary-deep"
							: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-primary-deep"
					}`}
					title="Gửi nhãn dán (Stickers)"
				>
					<Sparkles className="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onClick={() =>
						triggerFileInput(
							"application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip",
						)
					}
					disabled={isUploading}
					className="p-1.5 hover:bg-brand-light-soft rounded-lg text-brand-muted hover:text-brand-primary-deep transition-all border-none bg-transparent cursor-pointer disabled:opacity-40"
					title="Gửi tệp tài liệu"
				>
					<Paperclip className="w-3.5 h-3.5" />
				</button>

				{isUploading && (
					<div className="flex items-center gap-1 text-[9px] text-brand-primary-deep font-bold ml-auto">
						<Loader2 className="w-3 h-3 animate-spin" />
						Đang upload...
					</div>
				)}
			</div>

			{/* Message input form */}
			<form
				onSubmit={handleSubmit}
				className="p-2 bg-white border-t border-brand-border flex items-center gap-1.5"
			>
				<input
					type="text"
					placeholder="Nhập tin nhắn..."
					value={messageText}
					onChange={(e) => setMessageText(e.target.value)}
					className="flex-1 h-8 px-3 text-xs bg-brand-light-soft/50 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary font-semibold"
				/>
				<button
					type="submit"
					disabled={!messageText.trim()}
					className="w-8 h-8 flex items-center justify-center bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-xl border-none cursor-pointer shadow-sm transition-colors disabled:opacity-40"
				>
					<Send className="w-3.5 h-3.5" />
				</button>
			</form>
		</div>
	);
}
