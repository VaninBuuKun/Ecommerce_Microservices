import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	SendOutlined,
	PictureOutlined,
	VideoCameraOutlined,
	SmileOutlined,
	CloseOutlined,
} from "@ant-design/icons";
import type { ChatPendingMedia } from "@/domains/notification";
import { QUICK_EMOJIS, CHAT_STICKERS, CHAT_GIFS } from "@/domains/notification";
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
}: ChatMiniInputBarProps) {
	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

	return (
		<div className="p-2.5 border-t border-brand-border bg-white shrink-0 relative">
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
												title={s.title}
											>
												<img
													src={s.url}
													alt={s.title}
													className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
												/>
												<span className="text-[9px] text-brand-muted truncate w-full text-center mt-0.5">
													{s.title}
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
				className="flex items-center gap-2"
			>
				{/* Hidden file inputs */}
				<input
					type="file"
					ref={imageInputRef}
					accept="image/*"
					multiple
					onChange={handleImageChange}
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

				<div className="flex items-center gap-0.5 shrink-0 text-brand-muted">
					<button
						type="button"
						onClick={() => imageInputRef.current?.click()}
						className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
						title="Gửi hình ảnh (hỗ trợ nhiều tệp, tối đa 50MB)"
					>
						<PictureOutlined className="text-base" />
					</button>
					<button
						type="button"
						onClick={() => videoInputRef.current?.click()}
						className="p-1.5 hover:bg-brand-light-soft hover:text-brand-dark rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
						title="Gửi video (hỗ trợ nhiều tệp, tối đa 50MB)"
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

				<input
					type="text"
					value={inputText}
					onChange={(e) => onInputTextChange(e.target.value)}
					placeholder="Nhập tin nhắn..."
					className="flex-1 px-3 py-1.5 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary bg-brand-light-soft/20 text-brand-dark placeholder:text-brand-muted/70"
				/>

				<button
					type="submit"
					disabled={(!inputText.trim() && pendingMediaList.length === 0) || isSending}
					className="p-2 bg-brand-dark text-brand-primary hover:bg-brand-dark/90 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer shrink-0 font-bold flex items-center justify-center"
					title="Gửi tin nhắn"
				>
					<SendOutlined className="text-sm" />
				</button>
			</form>
		</div>
	);
}

export default ChatMiniInputBar;
