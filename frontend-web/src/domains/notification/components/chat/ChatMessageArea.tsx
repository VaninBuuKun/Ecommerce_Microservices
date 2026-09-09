import React, { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
	CommentOutlined,
	SendOutlined,
	PaperClipOutlined,
	VideoCameraOutlined,
	SmileOutlined,
	SearchOutlined,
	InfoCircleOutlined,
	SyncOutlined,
	UndoOutlined,
	RollbackOutlined,
	CloseOutlined,
	PictureOutlined,
} from "@ant-design/icons";
import { Store, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import type { Conversation, ChatMessageItem, ChatPendingMedia, ChatItemTheme, ChatBgTheme, ChatThemePreset, ChatMessageDto } from "../../types/chat.types";
import { QUICK_EMOJIS, CHAT_STICKERS, CHAT_GIFS, formatMessengerTime, shouldShowTimeSeparator, getChatTheme, parseMediaUrls, downloadChatMedia, parseReplyMessage } from "./chat.constants";
import { ChatUploadingWidget, ChatMessageActionBar } from "@/shared/components/chat-mini";

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
	themePreset?: ChatThemePreset;
	activeTheme?: ChatItemTheme;
	activeChatBg?: ChatBgTheme;
	onImageClick: (url: string) => void;
	onVideoClick?: (url: string) => void;
	inputText: string;
	onInputTextChange: (text: string) => void;
	onSendMessage: () => void;
	onSendSpecial?: (content: string, type: "Sticker" | "Gif") => void;
	isSending: boolean;
	pendingMediaList: ChatPendingMedia[];
	onSelectFiles: (files: FileList | File[]) => void;
	onRemovePendingMedia: (id: string) => void;
	showEmojiPicker: boolean;
	onToggleEmojiPicker: () => void;
	onCloseEmojiPicker: () => void;
	onRevokeMessage?: (messageId: string) => void;
	onReactMessage?: (messageId: string, emoji: string) => void;
	replyingToMessage?: ChatMessageItem | null;
	onReplyMessage?: (msg: ChatMessageItem) => void;
	onCancelReply?: () => void;
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
	themePreset,
	activeTheme,
	activeChatBg,
	onImageClick,
	onVideoClick,
	inputText,
	onInputTextChange,
	onSendMessage,
	onSendSpecial,
	isSending,
	pendingMediaList,
	onSelectFiles,
	onRemovePendingMedia,
	showEmojiPicker,
	onToggleEmojiPicker,
	onCloseEmojiPicker,
	onRevokeMessage,
	onReactMessage,
	replyingToMessage,
	onReplyMessage,
	onCancelReply,
}) => {
	const currentTheme = themePreset || getChatTheme(activeTheme?.id, activeChatBg?.id);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);
	const emojiPickerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [pickerTab, setPickerTab] = useState<"emoji" | "sticker" | "gif">("emoji");

	const scrollToBottom = useCallback(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, []);

	const messageCount = messages.length;
	const lastMessageId = messages[messages.length - 1]?.id;

	// Tự động cuộn ở đáy khi có tin nhắn mới hoặc đổi phòng (loại bỏ giật màn hình)
	useEffect(() => {
		scrollToBottom();
	}, [messageCount, lastMessageId, pendingMediaList.length, activeRoom?.roomId, scrollToBottom]);

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

	const scrollToOriginalMessage = (targetId?: string) => {
		if (!targetId) return;
		const targetRow = document.getElementById(`chat-msg-${targetId}`);
		const targetBubble = document.getElementById(`chat-msg-bubble-${targetId}`);
		if (targetRow) {
			targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
			if (targetBubble) {
				targetBubble.classList.add("ring-4", "ring-emerald-500", "ring-offset-2", "shadow-xl", "scale-[1.03]", "transition-all", "duration-300");
				setTimeout(() => {
					targetBubble.classList.remove("ring-4", "ring-emerald-500", "ring-offset-2", "shadow-xl", "scale-[1.03]");
				}, 1800);
			} else {
				targetRow.classList.add("ring-2", "ring-brand-primary", "bg-brand-primary/10", "rounded-2xl", "transition-all");
				setTimeout(() => {
					targetRow.classList.remove("ring-2", "ring-brand-primary", "bg-brand-primary/10", "rounded-2xl");
				}, 1800);
			}
		} else {
			toast.info("Tin nhắn gốc ở phía trên cuộc trò chuyện.", { autoClose: 1500 });
		}
	};



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
				onSendMessage();
			}
		}
	};

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

	if (!activeRoom) {
		return (
			<div className="flex-1 min-w-0 bg-white border-r border-slate-200 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
				<div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-brand-primary">
					<CommentOutlined className="text-2xl" />
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
			<div
				ref={messagesContainerRef}
				className={`flex-1 p-4 overflow-y-auto flex flex-col transition-colors duration-200 ${currentTheme.background}`}
			>
				<div className="mt-auto flex flex-col space-y-2.5">
					{displayedMessages.map((msg, i) => {
						const isMyMessage = msg.senderId === currentUserId;

						// Phân tách thời gian theo khoảng cách hội thoại (Messenger style)
						const prevMsg = displayedMessages[i - 1];
						const showTimeSep = shouldShowTimeSeparator(msg.sentAt, prevMsg?.sentAt);
						const timeLabel = formatMessengerTime(msg.sentAt);

						const { replyQuote, text: parsedText } = parseReplyMessage(msg.content);
						const isEmoji = msg.messageType === "Text" && !replyQuote && isPureEmoji(parsedText);
						const isRevoked = msg.isRevoked || msg.content === "Tin nhắn đã được thu hồi";
						const isMedia = msg.messageType === "Image" || msg.messageType === "Video";
						const mediaUrls = parseMediaUrls(msg.content);
						const mediaCount = mediaUrls.length;

						return (
							<div key={msg.id} id={`chat-msg-${msg.id}`}>
								{showTimeSep && (
									<div className="flex justify-center my-3.5 select-none">
										<span className="text-[11px] font-medium text-slate-400 select-none">
											{timeLabel}
										</span>
									</div>
								)}

								<div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} items-end gap-1.5 group relative mb-3.5`}>
									{/* Outgoing Message: Action Bar nổi ở BÊN TRÁI khi hover */}
									{isMyMessage && !isRevoked && (
										<div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none shrink-0 pb-1">
											{!msg.isUploading && (
												<ChatMessageActionBar
													isMyMessage={isMyMessage}
													isMedia={isMedia}
													onReply={() => onReplyMessage?.(msg)}
													onRevoke={isMyMessage ? () => onRevokeMessage?.(msg.id) : undefined}
													onDownload={
														isMedia
															? () => {
																	mediaUrls.forEach((url) => downloadChatMedia(url));
															  }
															: undefined
													}
												/>
											)}
										</div>
									)}

									{/* Tin nhắn đã bị thu hồi */}
									{isRevoked ? (
										<div id={`chat-msg-bubble-${msg.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100/90 text-slate-400 italic text-xs border border-slate-200/60 shadow-2xs select-none">
											<UndoOutlined className="text-xs text-slate-400" />
											<span>Tin nhắn đã được thu hồi</span>
										</div>
									) : isEmoji ? (
										/* Emoji đứng độc lập không viền */
										<div id={`chat-msg-bubble-${msg.id}`} className="text-4xl py-1 select-none animate-in zoom-in-75 duration-150 relative">
											{parsedText}
											<div
												className={`absolute ${
													isMyMessage ? "right-1 text-right" : "left-1 text-left"
												} -bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap text-[10px] text-slate-400 font-medium z-10 select-none`}
											>
												{timeLabel}
											</div>
										</div>
									) : (
										<div
											id={`chat-msg-bubble-${msg.id}`}
											className={`relative max-w-[82%] transition-all ${
												msg.messageType === "Sticker"
													? "bg-transparent border-none shadow-none"
													: isMyMessage
													? `${currentTheme.myBubble.bg} ${currentTheme.myBubble.text} border ${currentTheme.myBubble.border || ""} rounded-2xl rounded-tr-xs shadow-2xs`
													: `${currentTheme.theirBubble.bg} ${currentTheme.theirBubble.text} border ${currentTheme.theirBubble.border} rounded-2xl rounded-tl-xs shadow-2xs`
											}`}
										>
											{msg.messageType === "Sticker" ? (
												<div className="p-1 select-none">
													<img
														src={msg.content}
														alt="Sticker 3D"
														className="w-24 h-24 sm:w-28 sm:h-28 object-contain hover:scale-110 transition-transform duration-200 cursor-pointer drop-shadow-md"
														onClick={() => onImageClick(msg.content)}
													/>
												</div>
											) : msg.messageType === "Gif" ? (
												<div className="p-1">
													<img
														src={msg.content}
														alt="Ảnh GIF"
														className="max-w-[240px] max-h-[190px] rounded-xl object-contain cursor-pointer hover:opacity-95 transition-opacity shadow-xs"
														onClick={() => onImageClick(msg.content)}
													/>
												</div>
											) : msg.messageType === "Image" ? (
												mediaCount > 1 ? (
													/* Bộ sưu tập nhiều ảnh xếp lớp với thẻ div xám phía sau */
													<div
														className="p-1 pt-2 px-2 relative cursor-pointer group/stack select-none"
														onClick={() => !msg.isUploading && onImageClick(mediaUrls[0])}
													>
														{/* Thẻ xám 2 phía sau (nếu >= 3 ảnh) */}
														{mediaCount >= 3 && (
															<div
																className={`absolute inset-0.5 ${
																	isMyMessage
																		? "-translate-x-3 -translate-y-2 -rotate-3 group-hover/stack:-translate-x-4 group-hover/stack:-translate-y-3 group-hover/stack:-rotate-4"
																		: "translate-x-3 -translate-y-2 rotate-3 group-hover/stack:translate-x-4 group-hover/stack:-translate-y-3 group-hover/stack:rotate-4"
																} bg-slate-300/90 dark:bg-slate-700 rounded-2xl border-2 border-slate-400/80 dark:border-slate-600 shadow-xs transition-transform duration-200 pointer-events-none`}
															/>
														)}

														{/* Thẻ xám 1 phía sau chính */}
														<div
															className={`absolute inset-0.5 ${
																isMyMessage
																	? "-translate-x-1.5 -translate-y-1 -rotate-1.5 group-hover/stack:-translate-x-2 group-hover/stack:-translate-y-1.5 group-hover/stack:-rotate-2"
																	: "translate-x-1.5 -translate-y-1 rotate-1.5 group-hover/stack:translate-x-2 group-hover/stack:-translate-y-1.5 group-hover/stack:rotate-2"
															} bg-slate-200 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm transition-transform duration-200 pointer-events-none`}
														/>

														{/* Ảnh bìa chính ở phía trước */}
														<div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-800 bg-slate-900">
															<img
																src={mediaUrls[0]}
																alt="Ảnh đính kèm"
																className="max-w-[220px] max-h-[180px] w-full object-cover block"
															/>

															{/* Badge thông tin số lượng ảnh */}
															<div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
																<PictureOutlined className="text-xs text-brand-primary" />
																<span>{isMyMessage ? `Bạn đã gửi ${mediaCount} ảnh` : `Đã gửi ${mediaCount} ảnh`}</span>
															</div>

															{/* Badge góc dưới phải: Xem thêm (+N ảnh) */}
															<div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-xs font-black tracking-wide">
																+{mediaCount - 1} ảnh
															</div>

															{/* Mini thumbnail overlapping strip */}
															<div className="absolute bottom-2 left-2 flex items-center -space-x-1.5 overflow-hidden py-0.5">
																{mediaUrls.slice(1, 5).map((thumb, idx) => (
																	<img
																		key={idx}
																		src={thumb}
																		alt="thumb"
																		className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-xs"
																	/>
																))}
															</div>

															{msg.isUploading && (
																<div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																	<SyncOutlined spin className="text-xl text-brand-primary mb-1.5" />
																	<span className="text-xs font-bold">Đang tải {mediaCount} ảnh lên S3...</span>
																</div>
															)}
														</div>
													</div>
												) : (
													/* Ảnh đơn lẻ */
													<div className="p-1 relative">
														<img
															src={mediaUrls[0] || msg.content}
															alt="Ảnh đính kèm"
															className="max-w-[230px] max-h-[190px] rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
															onClick={() => !msg.isUploading && onImageClick(mediaUrls[0] || msg.content)}
														/>
														{msg.isUploading && (
															<div className="absolute inset-1 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																<SyncOutlined spin className="text-xl text-brand-primary mb-1.5" />
																<span className="text-xs font-bold">Đang tải lên S3...</span>
															</div>
														)}
													</div>
												)
											) : msg.messageType === "Video" ? (
												mediaCount > 1 ? (
													/* Nhiều video xếp lớp với thẻ div xám phía sau */
													<div className="p-1 pt-2 px-2 relative group/stack select-none">
														{/* Thẻ xám 2 phía sau (nếu >= 3 video) */}
														{mediaCount >= 3 && (
															<div
																className={`absolute inset-0.5 ${
																	isMyMessage
																		? "-translate-x-3 -translate-y-2 -rotate-3 group-hover/stack:-translate-x-4 group-hover/stack:-translate-y-3 group-hover/stack:-rotate-4"
																		: "translate-x-3 -translate-y-2 rotate-3 group-hover/stack:translate-x-4 group-hover/stack:-translate-y-3 group-hover/stack:rotate-4"
																} bg-slate-300/90 dark:bg-slate-700 rounded-2xl border-2 border-slate-400/80 dark:border-slate-600 shadow-xs transition-transform duration-200 pointer-events-none`}
															/>
														)}

														{/* Thẻ xám 1 phía sau */}
														<div
															className={`absolute inset-0.5 ${
																isMyMessage
																	? "-translate-x-1.5 -translate-y-1 -rotate-1.5 group-hover/stack:-translate-x-2 group-hover/stack:-translate-y-1.5 group-hover/stack:-rotate-2"
																	: "translate-x-1.5 -translate-y-1 rotate-1.5 group-hover/stack:translate-x-2 group-hover/stack:-translate-y-1.5 group-hover/stack:rotate-2"
															} bg-slate-200 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm transition-transform duration-200 pointer-events-none`}
														/>

														{/* Video chính ở phía trước */}
														<div 
															className="relative rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-800 bg-slate-900 group cursor-pointer"
															onClick={() => !msg.isUploading && (onVideoClick ? onVideoClick(mediaUrls[0]) : onImageClick(mediaUrls[0]))}
														>
															<video
																src={mediaUrls[0]}
																controls={false}
																className="max-w-[220px] max-h-[180px] w-full rounded-2xl block pointer-events-none"
															/>

															<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
																<div className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform">
																	▶
																</div>
															</div>

															{/* Badge thông tin số lượng video */}
															<div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-sm pointer-events-none">
																<VideoCameraOutlined className="text-xs text-brand-primary" />
																<span>{isMyMessage ? `Bạn đã gửi ${mediaCount} video` : `Đã gửi ${mediaCount} video`}</span>
															</div>

															<div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-xs font-black tracking-wide pointer-events-none">
																+{mediaCount - 1} video
															</div>

															{msg.isUploading && (
																<div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																	<SyncOutlined spin className="text-xl text-brand-primary mb-1.5" />
																	<span className="text-xs font-bold">Đang tải {mediaCount} video lên S3...</span>
																</div>
															)}
														</div>
													</div>
												) : (
													/* Video đơn lẻ */
													<div 
														className="p-1 relative group cursor-pointer select-none"
														onClick={() => !msg.isUploading && (onVideoClick ? onVideoClick(mediaUrls[0] || msg.content) : onImageClick(mediaUrls[0] || msg.content))}
													>
														<div className="relative rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700">
															<video src={mediaUrls[0] || msg.content} controls={false} className="max-w-[230px] max-h-[190px] rounded-xl block pointer-events-none" />
															<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
																<div className="w-11 h-11 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform">
																	▶
																</div>
															</div>
														</div>
														{msg.isUploading && (
															<div className="absolute inset-1 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																<SyncOutlined spin className="text-xl text-brand-primary mb-1.5" />
																<span className="text-xs font-bold">Đang tải video lên S3...</span>
															</div>
														)}
													</div>
												)
											) : (
												<div className="flex flex-col">
													{/* Trả lời tin nhắn đa phương tiện hoặc văn bản */}
													{(() => {
														const quoteTargetId = msg.replyToMessageId || replyQuote?.messageId;
														const quoteSenderName = msg.replyToSenderName || replyQuote?.senderName || "Tin nhắn";
														let quoteMediaUrl = replyQuote?.mediaUrl;
														let quoteMediaType = replyQuote?.messageType;

														if (!quoteMediaUrl && quoteTargetId) {
															const targetMsg = messages.find((m) => m.id === quoteTargetId);
															if (
																targetMsg &&
																(targetMsg.messageType === "Image" ||
																	targetMsg.messageType === "Video" ||
																	targetMsg.messageType === "Sticker" ||
																	targetMsg.messageType === "Gif")
															) {
																quoteMediaType = targetMsg.messageType;
																const urls = parseMediaUrls(targetMsg.content);
																quoteMediaUrl = urls[0] || targetMsg.content;
															}
														}

														if (quoteMediaUrl) {
															return (
																<div
																	onClick={(e) => {
																		e.stopPropagation();
																		scrollToOriginalMessage(quoteTargetId);
																	}}
																	className="mx-3 mt-2 mb-1 relative cursor-pointer select-none overflow-hidden rounded-xl border border-slate-300/80 dark:border-slate-700 bg-slate-900/10 shadow-2xs hover:opacity-90 transition-opacity max-w-[140px]"
																	title="Bấm để di chuyển đến tin nhắn gốc"
																>
																	<div className="relative w-32 h-32 bg-slate-900/10 flex items-center justify-center overflow-hidden">
																		{quoteMediaType === "Video" ? (
																			<video
																				src={quoteMediaUrl}
																				className="w-full h-full object-cover opacity-60 filter brightness-90 pointer-events-none"
																			/>
																		) : (
																			<img
																				src={quoteMediaUrl}
																				alt="replied-media"
																				className="w-full h-full object-cover opacity-60 filter brightness-90 pointer-events-none"
																			/>
																		)}
																		<div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/35">
																			<span className="text-[10px] font-bold text-white/95 truncate drop-shadow-xs">
																				{quoteSenderName}
																			</span>
																			<span className="text-[10px] text-white/90 font-semibold flex items-center gap-1">
																				<RollbackOutlined className="text-[9px]" /> Tin gốc
																			</span>
																		</div>
																	</div>
																</div>
															);
														}

														if (msg.replyToContent || replyQuote) {
															return (
																<div
																	onClick={(e) => {
																		e.stopPropagation();
																		scrollToOriginalMessage(quoteTargetId);
																	}}
																	className={`mx-3 mt-2 mb-0.5 px-3 py-1.5 rounded-lg border-l-3 text-left select-none cursor-pointer hover:opacity-85 transition-opacity ${
																		isMyMessage
																			? "bg-slate-100/90 border-brand-primary text-slate-700"
																			: "bg-slate-100 border-brand-primary text-slate-700"
																	}`}
																	title="Bấm để di chuyển đến tin nhắn gốc"
																>
																	<div className="font-bold text-[10px] text-brand-primary opacity-90 flex items-center gap-1">
																		<RollbackOutlined className="text-[9px]" />
																		<span>{quoteSenderName}</span>
																	</div>
																	<div className="truncate max-w-[260px] text-xs text-slate-600">
																		{msg.replyToContent || replyQuote?.content}
																	</div>
																</div>
															);
														}

														return null;
													})()}
													<p className="px-3.5 py-2 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">
														{parsedText}
													</p>
												</div>
											)}

											{/* Mốc thời gian khi hover phong cách hiện dưới tin nhắn, thụt vô một đoạn nhỏ so với mép đầu tin nhắn */}
											<div
												className={`absolute ${
													isMyMessage ? "right-2.5 text-right" : "left-2.5 text-left"
												} -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap text-[10px] text-slate-400 font-medium z-10 select-none`}
											>
												{timeLabel}
											</div>
										</div>
									)}

									{/* Incoming Message: Action Bar nổi ở BÊN PHẢI khi hover */}
									{!isMyMessage && !isRevoked && (
										<div className="flex flex-col items-start opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none shrink-0 pb-1">
											{!msg.isUploading && (
												<ChatMessageActionBar
													isMyMessage={isMyMessage}
													isMedia={isMedia}
													onReply={() => onReplyMessage?.(msg)}
													onDownload={
														isMedia
															? () => {
																	mediaUrls.forEach((url) => downloadChatMedia(url));
															  }
															: undefined
													}
												/>
											)}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
				<div ref={messagesEndRef} />
			</div>

			{/* Input Bar - Chứa nút gửi file, sticker */}
			<div className="border-t border-slate-200 bg-white shrink-0 relative flex flex-col">
				{/* Thanh xem trước tin nhắn đang trả lời phong cách Facebook Messenger: nằm trên cùng của hộp chat cuối */}
				{replyingToMessage && (
					<div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-xs select-none">
						<div className="flex items-center gap-2 min-w-0">
							<div className="w-1 h-7 rounded-full bg-brand-primary shrink-0" />
							<div className="min-w-0">
								<div className="text-[11px] font-bold text-slate-800 leading-tight">
									Đang trả lời <span className="text-brand-primary">{replyingToMessage.senderId === currentUserId ? "chính mình" : (activeRoom.displayName || "Đối phương")}</span>
								</div>
								<div className="text-[11px] text-slate-500 truncate max-w-[320px] sm:max-w-[480px]">
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
					{/* Widget tải lên ngầm S3 kèm Hover Popover hiển thị chi tiết */}
					<ChatUploadingWidget
						pendingMediaList={pendingMediaList}
						onRemoveMedia={onRemovePendingMedia}
					/>

				{/* Emoji / Sticker / GIF Floating Popover */}
				<AnimatePresence>
					{showEmojiPicker && (
						<motion.div
							ref={emojiPickerRef}
							initial={{ opacity: 0, y: 8, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.95 }}
							transition={{ duration: 0.15 }}
							className="absolute bottom-full mb-3 left-3 z-50 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col gap-2 w-[340px] max-w-[92vw]"
						>
							{/* Tab Selector */}
							<div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
								<button
									type="button"
									onClick={() => setPickerTab("emoji")}
									className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "emoji"
											? "bg-white text-brand-dark shadow-xs"
											: "text-slate-500 hover:text-slate-800 bg-transparent"
									}`}
								>
									😀 Biểu tượng
								</button>
								<button
									type="button"
									onClick={() => setPickerTab("sticker")}
									className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "sticker"
											? "bg-white text-brand-dark shadow-xs"
											: "text-slate-500 hover:text-slate-800 bg-transparent"
									}`}
								>
									🐱 Sticker 3D
								</button>
								<button
									type="button"
									onClick={() => setPickerTab("gif")}
									className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all border-none cursor-pointer ${
										pickerTab === "gif"
											? "bg-white text-brand-dark shadow-xs"
											: "text-slate-500 hover:text-slate-800 bg-transparent"
									}`}
								>
									🎞️ Ảnh GIF
								</button>
							</div>

							{/* Tab Content */}
							<div className="max-h-[220px] overflow-y-auto pr-1">
								{pickerTab === "emoji" && (
									<div className="flex flex-wrap gap-1.5">
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
									</div>
								)}

								{pickerTab === "sticker" && (
									<div className="grid grid-cols-4 gap-2">
										{CHAT_STICKERS.map((stk) => (
											<button
												key={stk.id}
												type="button"
												onClick={() => {
													onSendSpecial?.(stk.url, "Sticker");
													onCloseEmojiPicker();
												}}
												className="p-1.5 rounded-xl hover:bg-slate-100 transition-all hover:scale-110 cursor-pointer border-none bg-transparent flex flex-col items-center gap-1 group"
												title={stk.name}
											>
												<img src={stk.url} alt={stk.name} className="w-12 h-12 object-contain" />
												<span className="text-[10px] text-slate-500 truncate group-hover:text-brand-dark font-medium">
													{stk.name}
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
													onSendSpecial?.(g.url, "Gif");
													onCloseEmojiPicker();
												}}
												className="rounded-xl overflow-hidden hover:opacity-90 transition-opacity cursor-pointer border border-slate-200 relative group aspect-video bg-slate-100"
												title={g.title}
											>
												<img src={g.url} alt={g.title} className="w-full h-full object-cover" />
												<div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate text-left font-medium opacity-0 group-hover:opacity-100 transition-opacity">
													{g.title}
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>



				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSendMessage();
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

					{/* Action buttons (File đính kèm, Video, Sticker) */}
					<div className="flex items-center gap-0.5 text-slate-400 shrink-0 pb-1">
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors cursor-pointer border-none bg-transparent"
							title="Đính kèm tệp / hình ảnh (tối đa 50MB)"
						>
							<PaperClipOutlined className="text-base" />
						</button>
						<button
							type="button"
							onClick={() => videoInputRef.current?.click()}
							className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-md transition-colors cursor-pointer border-none bg-transparent"
							title="Gửi video (tối đa 50MB)"
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
						<textarea
							ref={textareaRef}
							rows={1}
							value={inputText}
							onChange={handleTextareaChange}
							onKeyDown={handleKeyDown}
							style={{ height: "38px", overflowY: "hidden" }}
							className="w-full pl-3 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-primary bg-slate-50 focus:bg-white transition-colors resize-none max-h-[96px] h-[38px] overflow-hidden leading-relaxed [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
						/>
					</div>

					<button
						type="submit"
						disabled={(!inputText.trim() && pendingMediaList.length === 0) || isSending}
						className="p-2.5 bg-brand-dark text-brand-primary hover:bg-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer font-bold shrink-0 shadow-2xs flex items-center justify-center mb-0.5"
						title="Gửi tin nhắn"
					>
						<SendOutlined className="text-sm" />
					</button>
				</form>
			</div>
		</div>
	</div>
	);
};
