import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
	MessageOutlined,
	SendOutlined,
	PictureOutlined,
	VideoCameraOutlined,
	SmileOutlined,
	SearchOutlined,
	InfoCircleOutlined,
} from "@ant-design/icons";
import { Store, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Conversation, ChatMessageItem, ChatItemTheme, ChatBgTheme } from "../../types/chat.types";
import { QUICK_EMOJIS } from "./chat.constants";

interface ChatMessageAreaProps {
	activeRoom: Conversation | null;
	messages: ChatMessageItem[];
	currentUserId: number;
	isSeller: boolean;
	isRightSidebarOpen: boolean;
	onToggleRightSidebar: () => void;
	showMessageSearch: boolean;
	onCloseMessageSearch: () => void;
	messageSearchQuery: string;
	onMessageSearchChange: (q: string) => void;
	activeTheme: ChatItemTheme;
	activeChatBg: ChatBgTheme;
	onImageClick: (url: string) => void;
	inputText: string;
	onInputTextChange: (text: string) => void;
	onSendMessage: () => void;
	isSending: boolean;
	pendingMedia: { url: string; type: "Image" | "Video"; file?: File } | null;
	onClearPendingMedia: () => void;
	onImageSelect: (file: File) => void;
	onVideoSelect: (file: File) => void;
	showEmojiPicker: boolean;
	onToggleEmojiPicker: () => void;
	onCloseEmojiPicker: () => void;
}

export const ChatMessageArea: React.FC<ChatMessageAreaProps> = ({
	activeRoom,
	messages,
	currentUserId,
	isSeller,
	isRightSidebarOpen,
	onToggleRightSidebar,
	showMessageSearch,
	onCloseMessageSearch,
	messageSearchQuery,
	onMessageSearchChange,
	activeTheme,
	activeChatBg,
	onImageClick,
	inputText,
	onInputTextChange,
	onSendMessage,
	isSending,
	pendingMedia,
	onClearPendingMedia,
	onImageSelect,
	onVideoSelect,
	showEmojiPicker,
	onToggleEmojiPicker,
	onCloseEmojiPicker,
}) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);

	// Tự động cuộn xuống đáy khi có tin nhắn mới hoặc đính kèm
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, pendingMedia]);

	// Đóng emoji picker khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
				onCloseEmojiPicker();
			}
		};
		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker, onCloseEmojiPicker]);

	const isPureEmoji = (text: string) => {
		const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u;
		return emojiRegex.test(text.trim());
	};

	const displayedMessages = messages.filter((m) => {
		if (!messageSearchQuery.trim()) return true;
		return m.content.toLowerCase().includes(messageSearchQuery.toLowerCase());
	});

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onImageSelect(file);
			e.target.value = "";
		}
	};

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onVideoSelect(file);
			e.target.value = "";
		}
	};

	if (!activeRoom) {
		return (
			<div className="flex-1 min-w-0 bg-white border-r border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
				<div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
					<MessageOutlined className="text-2xl" />
				</div>
				<p className="text-sm font-bold text-slate-800">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
			</div>
		);
	}

	return (
		<div className="flex-1 min-w-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
			{/* Chat Header */}
			<div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
				<div className="flex items-center gap-3 min-w-0">
					{activeRoom.displayAvatar ? (
						<img
							src={activeRoom.displayAvatar}
							alt={activeRoom.displayName}
							className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
						/>
					) : (
						<div className="w-10 h-10 rounded-full bg-brand-dark text-brand-primary text-xs font-black flex items-center justify-center shrink-0 border border-slate-200">
							{activeRoom.displayName?.[0]?.toUpperCase() || "?"}
						</div>
					)}
					<div className="min-w-0">
						<h3 className="text-sm font-black text-slate-900 truncate max-w-[320px]">
							{activeRoom.displayName}
						</h3>
						<p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
							Đang hoạt động
						</p>
					</div>
				</div>

				{/* Actions: Nút Xem Shop + Icon Thông tin chuẩn w-8 h-8 */}
				<div className="flex items-center gap-2 h-8">
					{!isSeller && (
						<Link
							to={`/shops/${activeRoom.shopId}`}
							className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 no-underline border border-slate-200 shrink-0"
						>
							<Store className="w-3.5 h-3.5" />
							<span>Xem Shop</span>
						</Link>
					)}

					<button
						type="button"
						onClick={onToggleRightSidebar}
						className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shrink-0 ${
							isRightSidebarOpen
								? "bg-slate-900 text-white border-slate-900 shadow-2xs"
								: "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
						}`}
						title="Thông tin cuộc trò chuyện"
					>
						<InfoCircleOutlined className="text-sm" />
					</button>
				</div>
			</div>

			{/* Search in message thread bar */}
			{showMessageSearch && (
				<div className="px-3 py-1.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
					<SearchOutlined className="text-xs text-slate-400" />
					<input
						type="text"
						placeholder="Tìm kiếm trong đoạn chat..."
						value={messageSearchQuery}
						onChange={(e) => onMessageSearchChange(e.target.value)}
						className="flex-1 bg-transparent border-none text-xs focus:outline-none text-slate-800"
						autoFocus
					/>
					{messageSearchQuery && (
						<button
							onClick={onCloseMessageSearch}
							className="text-xs text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>
			)}

			{/* Messages Thread: Hiển thị từ dưới lên (mt-auto) & thời gian chỉ hiện khi hover */}
			<div className={`flex-1 p-4 overflow-y-auto flex flex-col transition-colors duration-200 ${activeChatBg.bg}`}>
				<div className="mt-auto flex flex-col space-y-2.5">
					{displayedMessages.map((msg, i) => {
						const isMyMessage = msg.senderId === currentUserId;

						// Phân tách thời gian nếu cách nhau > 30 phút
						const prevMsg = displayedMessages[i - 1];
						const showTimeSep = prevMsg
							? new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime() > 30 * 60 * 1000
							: false;

						const timeLabel = new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
							hour: "2-digit",
							minute: "2-digit",
						});

						const isEmoji = msg.messageType === "Text" && isPureEmoji(msg.content);

						return (
							<div key={msg.id}>
								{showTimeSep && (
									<div className="flex items-center gap-2 my-3">
										<div className="flex-1 h-px bg-slate-200" />
										<span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap px-2">
											{timeLabel}
										</span>
										<div className="flex-1 h-px bg-slate-200" />
									</div>
								)}

								<div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} items-center gap-2 group`}>
									{/* Outgoing Message: Timestamp nổi ở BÊN TRÁI khi hover */}
									{isMyMessage && !isEmoji && (
										<span className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none whitespace-nowrap">
											{timeLabel}
										</span>
									)}

									{/* Emoji đứng độc lập không viền */}
									{isEmoji ? (
										<div className="text-4xl py-1 select-none animate-in zoom-in-75 duration-150">
											{msg.content}
										</div>
									) : (
										<div
											className={`relative max-w-[70%] transition-all ${
												isMyMessage
													? `${activeTheme.bg} ${activeTheme.text} rounded-2xl rounded-tr-xs shadow-2xs`
													: "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-xs shadow-2xs"
											}`}
										>
											{msg.messageType === "Image" ? (
												<div className="p-1">
													<img
														src={msg.content}
														alt="Ảnh đính kèm"
														className="max-w-[320px] max-h-[280px] rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
														onClick={() => onImageClick(msg.content)}
													/>
												</div>
											) : msg.messageType === "Video" ? (
												<div className="p-1">
													<video src={msg.content} controls className="max-w-[340px] rounded-xl" />
												</div>
											) : (
												<p className="px-3.5 py-2 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">
													{msg.content}
												</p>
											)}
										</div>
									)}

									{/* Incoming Message: Timestamp nổi ở BÊN PHẢI khi hover */}
									{!isMyMessage && !isEmoji && (
										<span className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none whitespace-nowrap">
											{timeLabel}
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
				<div ref={messagesEndRef} />
			</div>

			{/* Input Bar - Chứa nút gửi file, sticker (Fix triệt để không nhích đoạn chat lên) */}
			<div className="p-2.5 border-t border-slate-200 bg-white shrink-0 relative">
				{/* Media Preview nếu đang đính kèm */}
				{pendingMedia && (
					<div className="mb-2 flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg border border-slate-200 w-fit relative">
						{pendingMedia.type === "Image" ? (
							<img src={pendingMedia.url} alt="preview" className="w-12 h-12 rounded object-cover" />
						) : (
							<video src={pendingMedia.url} className="w-12 h-12 rounded object-cover" />
						)}
						<span className="text-xs font-semibold text-slate-800 pr-6 truncate max-w-[180px]">
							{pendingMedia.file?.name || "Đính kèm"}
						</span>
						<button
							type="button"
							onClick={onClearPendingMedia}
							className="absolute top-1 right-1 p-0.5 hover:bg-gray-200 rounded-full text-slate-400 cursor-pointer border-none bg-transparent"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				)}

				{/* Emoji / Sticker Quick Picker:
				    ĐẶT ABSOLUTE FLOATING BÊN TRÊN INPUT BAR
				    -> KHÔNG LÀM TĂNG CHIỀU CAO INPUT BAR -> KHÔNG NHÍCH ĐOẠN CHAT LÊN! */}
				<AnimatePresence>
					{showEmojiPicker && (
						<motion.div
							ref={emojiPickerRef}
							initial={{ opacity: 0, y: 8, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.95 }}
							transition={{ duration: 0.15 }}
							className="absolute bottom-full mb-3 left-3 z-50 p-2.5 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-wrap gap-1.5 max-w-[320px]"
						>
							{QUICK_EMOJIS.map((emoji) => (
								<button
									key={emoji}
									type="button"
									onClick={() => {
										onInputTextChange(inputText + emoji);
										onCloseEmojiPicker();
									}}
									className="text-lg hover:scale-125 transition-transform p-1.5 cursor-pointer border-none bg-transparent rounded-lg hover:bg-slate-100"
								>
									{emoji}
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSendMessage();
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
					<div className="flex items-center gap-0.5 text-slate-400 shrink-0">
						<button
							type="button"
							onClick={() => imageInputRef.current?.click()}
							className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors cursor-pointer border-none bg-transparent"
							title="Gửi hình ảnh"
						>
							<PictureOutlined className="text-base" />
						</button>
						<button
							type="button"
							onClick={() => videoInputRef.current?.click()}
							className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors cursor-pointer border-none bg-transparent"
							title="Gửi video"
						>
							<VideoCameraOutlined className="text-base" />
						</button>
						<button
							type="button"
							onClick={onToggleEmojiPicker}
							className={`p-1.5 rounded-md transition-colors cursor-pointer border-none bg-transparent ${
								showEmojiPicker ? "text-brand-primary-deep bg-brand-primary/10" : "hover:bg-slate-100 hover:text-slate-800"
							}`}
							title="Sticker / Emoji"
						>
							<SmileOutlined className="text-base" />
						</button>
					</div>

					<div className="flex-1 relative flex items-center">
						<input
							type="text"
							placeholder="Nhập tin nhắn..."
							value={inputText}
							onChange={(e) => onInputTextChange(e.target.value)}
							className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-primary bg-slate-50 focus:bg-white transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={(!inputText.trim() && !pendingMedia) || isSending}
						className="p-2 bg-brand-dark text-brand-primary hover:bg-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer font-bold shrink-0 shadow-2xs flex items-center justify-center"
						title="Gửi tin nhắn"
					>
						<SendOutlined className="text-sm" />
					</button>
				</form>
			</div>
		</div>
	);
};
