import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	SendOutlined,
	PaperClipOutlined,
	VideoCameraOutlined,
	SmileOutlined,
	CloseOutlined,
	RollbackOutlined,
} from "@ant-design/icons";
import type { ChatPendingMedia, ChatMessageDto } from "@/domains/notification";
import { QUICK_EMOJIS, CHAT_STICKERS, CHAT_GIFS, parseReplyMessage } from "@/domains/notification";
import { ChatUploadingWidget } from "./ChatUploadingWidget";

interface ChatMiniInputBarProps {
	inputText: string;
	onInputTextChange: (text: string) => void;
	onSend: () => void;
	isSending: boolean;
	pendingMediaList: ChatPendingMedia[];
	onSelectFiles: (files: FileList | File[]) => void;
	onRemovePendingMedia: (id: string) => void;
	onSendSpecial: (content: string, type: "Sticker" | "Gif") => void;
	showEmojiPicker: boolean;
	onToggleEmojiPicker: () => void;
	onCloseEmojiPicker: () => void;
	pickerTab: "emoji" | "sticker" | "gif";
	onPickerTabChange: (tab: "emoji" | "sticker" | "gif") => void;
	replyingToMessage?: ChatMessageDto | null;
	onCancelReply?: () => void;
	partnerName?: string;
	currentUserId?: number;
}

export function ChatMiniInputBar({
	inputText,
	onInputTextChange,
	onSend,
	isSending,
	pendingMediaList,
	onSelectFiles,
	onRemovePendingMedia,
	onSendSpecial,
	showEmojiPicker,
	onToggleEmojiPicker,
	onCloseEmojiPicker,
	pickerTab,
	onPickerTabChange,
	replyingToMessage,
	onCancelReply,
	partnerName,
	currentUserId,
}: ChatMiniInputBarProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onSelectFiles(e.target.files);
			e.target.value = "";
		}
	};

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onSelectFiles(e.target.files);
			e.target.value = "";
		}
	};

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const val = e.target.value;
		onInputTextChange(val);
		if (!val.trim() && !val.includes("\n")) {
			e.target.style.height = "38px";
			e.target.style.overflowY = "hidden";
			return;
		}
		e.target.style.height = "auto";
		const scrollH = e.target.scrollHeight;
		if (!val.includes("\n") && scrollH <= 40) {
			e.target.style.height = "38px";
			e.target.style.overflowY = "hidden";
		} else {
			const nextHeight = Math.min(scrollH, 96);
			e.target.style.height = `${nextHeight}px`;
			e.target.style.overflowY = scrollH > 96 ? "auto" : "hidden";
		}
	};

	useEffect(() => {
		if (!inputText && textareaRef.current) {
			textareaRef.current.style.height = "38px";
			textareaRef.current.style.overflowY = "hidden";
		}
	}, [inputText]);

	useEffect(() => {
		if (replyingToMessage && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [replyingToMessage]);

	const getReplyPreviewText = (msg: ChatMessageDto) => {
		if (msg.messageType === "Image") return "[Hình ảnh]";
		if (msg.messageType === "Video") return "[Video]";
		if (msg.messageType === "Sticker") return "[Nhãn dán]";
		if (msg.messageType === "Gif") return "[Ảnh GIF]";
		const { text } = parseReplyMessage(msg.content);
		return text || msg.content;
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if ((inputText.trim() || pendingMediaList.length > 0) && !isSending) {
				onSend();
			}
		}
	};

	return (
		<div className="border-t border-brand-border bg-white shrink-0 relative flex flex-col">
			{/* Thanh xem trước tin nhắn đang trả lời phong cách Facebook Messenger: nằm trên cùng của hộp chat cuối */}
			{replyingToMessage && (
				<div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border-b border-brand-border/60 text-xs select-none">
					<div className="flex items-center gap-2 min-w-0">
						<div className="w-1 h-7 rounded-full bg-brand-primary shrink-0" />
						<div className="min-w-0">
							<div className="text-[11px] font-bold text-slate-800 leading-tight">
								Đang trả lời <span className="text-brand-primary">{replyingToMessage.senderId === currentUserId ? "chính mình" : (partnerName || "Đối phương")}</span>
							</div>
							<div className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-[380px]">
								{getReplyPreviewText(replyingToMessage)}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={onCancelReply}
						className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200/60 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0"
						title="Hủy trả lời"
					>
						<CloseOutlined className="text-xs" />
					</button>
				</div>
			)}

			<div className="p-2.5 relative">
				{/* Widget hiển thị tiến trình tải lên S3 ngầm kèm Hover Popover danh sách & dải thumbnail */}
				<ChatUploadingWidget
					pendingMediaList={pendingMediaList}
					onRemoveMedia={onRemovePendingMedia}
				/>

			{/* Emoji & Sticker 3D Popover */}
			<AnimatePresence>
				{showEmojiPicker && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						className="absolute bottom-14 left-4 z-50 bg-white border border-brand-border rounded-2xl shadow-xl p-2.5 w-72 sm:w-80"
					>
						<div className="flex flex-col gap-2">
							{/* Tab Bar */}
							<div className="flex items-center gap-1 bg-brand-light-soft p-1 rounded-xl">
								<button
									type="button"
									onClick={() => onPickerTabChange("emoji")}
									className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "emoji"
											? "bg-white text-brand-dark shadow-xs"
											: "text-brand-muted hover:text-brand-dark bg-transparent"
									}`}
								>
									😀 Biểu tượng
								</button>
								<button
									type="button"
									onClick={() => onPickerTabChange("sticker")}
									className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "sticker"
											? "bg-white text-brand-dark shadow-xs"
											: "text-brand-muted hover:text-brand-dark bg-transparent"
									}`}
								>
									🐱 Sticker 3D
								</button>
								<button
									type="button"
									onClick={() => onPickerTabChange("gif")}
									className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "gif"
											? "bg-white text-brand-dark shadow-xs"
											: "text-brand-muted hover:text-brand-dark bg-transparent"
									}`}
								>
									🎞️ Ảnh GIF
								</button>
							</div>

							{/* Tab Content */}
							<div className="max-h-[190px] overflow-y-auto pr-1">
								{pickerTab === "emoji" && (
									<div className="flex flex-wrap gap-1">
										{QUICK_EMOJIS.map((emoji) => (
											<button
												key={emoji}
												type="button"
												onClick={() => {
													onInputTextChange(inputText + emoji);
													onCloseEmojiPicker();
												}}
												className="w-8 h-8 text-lg flex items-center justify-center hover:bg-brand-light-soft rounded-lg transition-colors border-none bg-transparent cursor-pointer"
											>
												{emoji}
											</button>
										))}
									</div>
								)}

								{pickerTab === "sticker" && (
									<div className="grid grid-cols-4 gap-2">
										{CHAT_STICKERS.map((s) => (
											<button
												key={s.id}
												type="button"
												onClick={() => {
													onSendSpecial(s.url, "Sticker");
													onCloseEmojiPicker();
												}}
												className="p-1 rounded-xl hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent flex flex-col items-center group"
												title={s.name}
											>
												<img
													src={s.url}
													alt={s.name}
													className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
												/>
												<span className="text-[9px] text-brand-muted truncate w-full text-center mt-0.5">
													{s.name}
												</span>
											</button>
										))}
									</div>
								)}

								{pickerTab === "gif" && (
									<div className="grid grid-cols-2 gap-2">
										{CHAT_GIFS.map((g) => (
											<button
												key={g.id}
												type="button"
												onClick={() => {
													onSendSpecial(g.url, "Gif");
													onCloseEmojiPicker();
												}}
												className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer border border-brand-border aspect-video bg-slate-100"
												title={g.title}
											>
												<img src={g.url} alt={g.title} className="w-full h-full object-cover" />
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Form gõ tin nhắn + nút gửi */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSend();
				}}
				className="flex items-end gap-2"
			>
				{/* Hidden file inputs */}
				<input
					type="file"
					ref={fileInputRef}
					accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
					multiple
					onChange={handleFileChange}
					className="hidden"
				/>
				<input
					type="file"
					ref={videoInputRef}
					accept="video/*"
					multiple
					onChange={handleVideoChange}
					className="hidden"
				/>

				<div className="flex items-center gap-0.5 shrink-0 text-brand-muted pb-1">
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
						title="Đính kèm tệp / hình ảnh (tối đa 50MB)"
					>
						<PaperClipOutlined className="text-base" />
					</button>
					<button
						type="button"
						onClick={() => videoInputRef.current?.click()}
						className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
						title="Gửi video (tối đa 50MB)"
					>
						<VideoCameraOutlined className="text-base" />
					</button>
					<button
						type="button"
						onClick={onToggleEmojiPicker}
						className={`p-1.5 rounded-md transition-colors border-none cursor-pointer flex items-center justify-center ${
							showEmojiPicker
								? "bg-brand-primary/20 text-brand-dark"
								: "hover:bg-brand-light-soft hover:text-brand-dark bg-transparent"
						}`}
						title="Biểu tượng, Sticker 3D & Ảnh GIF"
					>
						<SmileOutlined className="text-base" />
					</button>
				</div>

				<textarea
					ref={textareaRef}
					rows={1}
					value={inputText}
					onChange={handleTextareaChange}
					onKeyDown={handleKeyDown}
					style={{ height: "38px", overflowY: "hidden" }}
					className="flex-1 px-3 py-2 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary bg-brand-light-soft/20 text-brand-dark resize-none max-h-[96px] h-[38px] overflow-hidden leading-relaxed [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
				/>

				<button
					type="submit"
					disabled={(!inputText.trim() && pendingMediaList.length === 0) || isSending}
					className="w-8 h-8 rounded-full bg-brand-primary text-brand-dark hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer shrink-0 shadow-2xs"
					title="Gửi tin nhắn (Enter)"
				>
					<SendOutlined className="text-sm" />
				</button>
			</form>
		</div>
	</div>
	);
}

export default ChatMiniInputBar;
