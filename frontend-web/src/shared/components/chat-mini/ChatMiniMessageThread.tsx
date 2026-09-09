import React from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { CommentOutlined, SyncOutlined, PictureOutlined, VideoCameraOutlined, UndoOutlined, RollbackOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import type { ChatMessageDto, ChatThemePreset } from "@/domains/notification";
import { parseMediaUrls, downloadChatMedia, parseReplyMessage } from "@/domains/notification";
import { ChatMessageActionBar } from "./ChatMessageActionBar";

interface ChatMiniMessageThreadProps {
	activeRoom: any;
	messages: ChatMessageDto[];
	currentUserId?: number;
	activePreset: ChatThemePreset;
	messagesContainerRef: React.RefObject<HTMLDivElement | null>;
	onImageClick: (url: string) => void;
	onVideoClick?: (url: string) => void;
	isSeller: boolean;
	formatMessengerTime: (dateStr: string) => string;
	shouldShowTimeSeparator: (currentDateStr: string, prevDateStr?: string) => boolean;
	isPureEmoji: (text: string) => boolean;
	onRevokeMessage?: (messageId: string) => void;
	onReactMessage?: (messageId: string, emoji: string) => void;
	onReplyMessage?: (msg: ChatMessageDto) => void;
}

export function ChatMiniMessageThread({
	activeRoom,
	messages,
	currentUserId,
	activePreset,
	messagesContainerRef,
	messagesEndRef,
	onImageClick,
	onVideoClick,
	isSeller,
	formatMessengerTime,
	shouldShowTimeSeparator,
	isPureEmoji,
	onRevokeMessage,
	onReactMessage,
	onReplyMessage,
}: ChatMiniMessageThreadProps) {
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



	if (!activeRoom) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted bg-white select-none">
				<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/15 via-emerald-500/10 to-teal-500/15 flex items-center justify-center text-brand-primary border border-brand-primary/30 shadow-xs mb-3">
					<CommentOutlined className="text-2xl text-brand-primary" />
				</div>
				<h3 className="text-sm font-black text-brand-dark mb-1">
					{isSeller ? "Trung tâm Tin nhắn Người bán" : "Hộp thư Trò chuyện Cửa hàng"}
				</h3>
				<p className="text-xs text-brand-muted max-w-[270px] leading-relaxed mb-4">
					{isSeller
						? "Chọn một người mua từ danh sách bên trái để bắt đầu tư vấn và giải đáp thắc mắc."
						: "Chọn một cuộc trò chuyện từ danh sách bên trái để nhắn tin với cửa hàng hoặc nhận hỗ trợ mua sắm."}
				</p>
				<div className="flex flex-col gap-1.5 w-full max-w-[260px] text-left">
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-brand-border/60 text-[11px] text-slate-700 font-medium">
						<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
						<span>{isSeller ? "Tư vấn & chăm sóc người mua tức thì" : "Tư vấn sản phẩm & đặt hàng tức thì"}</span>
					</div>
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-brand-border/60 text-[11px] text-slate-700 font-medium">
						<span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
						<span>Hỗ trợ gửi hình ảnh, video chất lượng cao</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col overflow-hidden bg-white min-h-0">
			{/* Header thông tin đối tác chat */}
			<div className="px-4 py-2.5 border-b border-brand-border flex items-center justify-between bg-white shrink-0">
				<div className="flex items-center gap-2.5 min-w-0">
					<div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary-deep text-xs font-black flex items-center justify-center shrink-0 border border-brand-border overflow-hidden shadow-2xs relative">
						{activeRoom.displayAvatar ? (
							<img
								src={activeRoom.displayAvatar}
								alt={activeRoom.displayName}
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.currentTarget as HTMLElement).style.display = "none";
								}}
							/>
						) : (
							activeRoom.displayName?.[0]?.toUpperCase() || "?"
						)}
					</div>
					<div className="min-w-0">
						<h4 className="text-xs font-bold text-brand-dark truncate max-w-[180px]">
							{activeRoom.displayName}
						</h4>
						<div className="flex items-center gap-1 text-[10px] text-brand-primary font-bold">
							<span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
							Đang hoạt động
						</div>
					</div>
				</div>

				{!isSeller && activeRoom.shopId && (
					<Link
						to={`/shops/${activeRoom.shopId}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-light-soft hover:bg-brand-border/40 text-brand-dark rounded-md text-[11px] font-bold transition-colors border border-brand-border no-underline shrink-0"
					>
						<Store className="w-3.5 h-3.5" />
						Xem shop
					</Link>
				)}
			</div>

			{/* Danh sách tin nhắn hiển thị từ dưới lên & background đồng bộ với ChatPage */}
			<div
				ref={messagesContainerRef}
				className={`flex-1 p-3 overflow-y-auto flex flex-col transition-colors duration-200 ${activePreset.background}`}
			>
				<div className="mt-auto flex flex-col space-y-1">
					{messages.map((msg, i) => {
						const isMyMessage = msg.senderId === currentUserId;
						const prevMsg = messages[i - 1];
						const showTimeSep = shouldShowTimeSeparator(msg.sentAt, prevMsg?.sentAt);
						const timeLabel = formatMessengerTime(msg.sentAt);
						const { replyQuote, text: parsedText } = parseReplyMessage(msg.content);
						const isEmoji = msg.messageType === "Text" && !replyQuote && isPureEmoji(parsedText);
						const isRevoked = msg.isRevoked || msg.content === "Tin nhắn đã được thu hồi";
						const isMedia = msg.messageType === "Image" || msg.messageType === "Video";
						const mediaUrls = parseMediaUrls(msg.content);
						const mediaCount = mediaUrls.length;

						return (
							<div key={msg.id || i} id={`chat-msg-${msg.id}`} className="transition-all duration-300">
								{/* Cột mốc thời gian ngắt quãng phong cách Messenger */}
								{showTimeSep && (
									<div className="flex justify-center my-3 select-none">
										<span className="text-[11px] font-medium text-slate-400 select-none">
											{timeLabel}
										</span>
									</div>
								)}

								<div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} items-end gap-1.5 group relative mb-3.5`}>
									{/* Khu vực Action Bar bên trái khi hover (tin nhắn gửi đi) */}
									{isMyMessage && !isRevoked && (
										<div className="flex flex-col items-end o	pacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none shrink-0 pb-1">
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
										/* Emoji độc lập */
										<div id={`chat-msg-bubble-${msg.id}`} className="text-3xl py-1 select-none animate-in zoom-in-75 duration-150 relative">
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
											className={`relative max-w-[86%] transition-all ${
												msg.messageType === "Sticker"
													? "bg-transparent border-none shadow-none"
													: isMyMessage
													? `${activePreset.myBubble.bg} ${activePreset.myBubble.text} border ${activePreset.myBubble.border || ""} rounded-2xl rounded-tr-xs shadow-2xs`
													: `${activePreset.theirBubble.bg} ${activePreset.theirBubble.text} border ${activePreset.theirBubble.border} rounded-2xl rounded-tl-xs shadow-2xs`
											}`}
										>
											{msg.messageType === "Sticker" ? (
												<div className="p-1 select-none">
													<img
														src={msg.content}
														alt="Sticker"
														className="w-20 h-20 sm:w-24 sm:h-24 object-contain hover:scale-105 transition-transform duration-200 cursor-pointer drop-shadow-md"
														onClick={() => onImageClick(msg.content)}
													/>
												</div>
											) : msg.messageType === "Gif" ? (
												<div className="p-1">
													<img
														src={msg.content}
														alt="Ảnh GIF"
														className="max-w-[200px] max-h-[160px] rounded-xl object-contain shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
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
																className="max-w-[185px] max-h-[145px] w-full object-cover block"
															/>

															{/* Badge thông tin số lượng ảnh */}
															<div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
																<PictureOutlined className="text-[10px] text-brand-primary" />
																<span>{isMyMessage ? `Bạn đã gửi ${mediaCount} ảnh` : `Đã gửi ${mediaCount} ảnh`}</span>
															</div>

															{/* Badge góc dưới phải: Xem thêm (+N ảnh) */}
															<div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-black tracking-wide">
																+{mediaCount - 1} ảnh
															</div>

															{/* Mini thumbnail overlapping strip */}
															<div className="absolute bottom-1.5 left-1.5 flex items-center -space-x-1.5 overflow-hidden py-0.5">
																{mediaUrls.slice(1, 4).map((thumb, idx) => (
																	<img
																		key={idx}
																		src={thumb}
																		alt="thumb"
																		className="w-5 h-5 rounded-full object-cover border-2 border-white shadow-xs"
																	/>
																))}
															</div>

															{msg.isUploading && (
																<div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																	<SyncOutlined spin className="text-lg text-brand-primary mb-1" />
																	<span className="text-[10px] font-bold">Đang tải {mediaCount} ảnh lên S3...</span>
																</div>
															)}
														</div>
													</div>
												) : (
													/* 1 ảnh duy nhất */
													<div className="p-1 relative">
														<img
															src={mediaUrls[0] || msg.content}
															alt="Ảnh đính kèm"
															className="max-w-[195px] max-h-[155px] rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
															onClick={() => !msg.isUploading && onImageClick(mediaUrls[0] || msg.content)}
														/>
														{msg.isUploading && (
															<div className="absolute inset-1 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																<SyncOutlined spin className="text-lg text-brand-primary mb-1" />
																<span className="text-[10px] font-bold">Đang tải lên S3...</span>
															</div>
														)}
													</div>
												)
											) : msg.messageType === "Video" ? (
												mediaCount > 1 ? (
													/* Nhiều video xếp lớp với thẻ div xám phía sau */
													<div
														className="p-1 pt-2 px-2 relative group/stack select-none"
														onClick={() => !msg.isUploading && (onVideoClick ? onVideoClick(mediaUrls[0]) : onImageClick(mediaUrls[0]))}
													>
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
														<div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-800 bg-slate-900 group">
															<video src={mediaUrls[0]} controls={false} className="max-w-[185px] max-h-[145px] rounded-xl block pointer-events-none" />
															<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
																<div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white text-xs shadow-md group-hover:scale-110 transition-transform">
																	▶
																</div>
															</div>
															<div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm pointer-events-none">
																<VideoCameraOutlined className="text-[10px] text-brand-primary" />
																<span>{isMyMessage ? `Bạn đã gửi ${mediaCount} video` : `Đã gửi ${mediaCount} video`}</span>
															</div>
															<div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10px] font-black tracking-wide pointer-events-none">
																+{mediaCount - 1} video
															</div>
															{msg.isUploading && (
																<div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																	<SyncOutlined spin className="text-lg text-brand-primary mb-1" />
																	<span className="text-[10px] font-bold">Đang tải {mediaCount} video lên S3...</span>
																</div>
															)}
														</div>
													</div>
												) : (
													/* 1 video duy nhất */
													<div 
														className="p-1 relative group cursor-pointer select-none"
														onClick={() => !msg.isUploading && (onVideoClick ? onVideoClick(mediaUrls[0] || msg.content) : onImageClick(mediaUrls[0] || msg.content))}
													>
														<div className="relative rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700">
															<video src={mediaUrls[0] || msg.content} controls={false} className="max-w-[195px] max-h-[155px] rounded-xl block pointer-events-none" />
															<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
																<div className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform">
																	▶
																</div>
															</div>
														</div>
														{msg.isUploading && (
															<div className="absolute inset-1 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																<SyncOutlined spin className="text-lg text-brand-primary mb-1" />
																<span className="text-[10px] font-bold">Đang tải video lên S3...</span>
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
																	className="mx-2 mt-1.5 mb-1 relative cursor-pointer select-none overflow-hidden rounded-xl border border-slate-300/80 dark:border-slate-700 bg-slate-900/10 shadow-2xs hover:opacity-90 transition-opacity max-w-[130px]"
																	title="Bấm để di chuyển đến tin nhắn gốc"
																>
																	<div className="relative w-28 h-28 bg-slate-900/10 flex items-center justify-center overflow-hidden">
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
																		<div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/35">
																			<span className="text-[9px] font-bold text-white/95 truncate drop-shadow-xs">
																				{quoteSenderName}
																			</span>
																			<span className="text-[9px] text-white/90 font-semibold flex items-center gap-0.5">
																				<RollbackOutlined className="text-[8px]" /> Tin gốc
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
																	className={`mx-2 mt-1.5 mb-0.5 px-2.5 py-1 rounded-md border-l-2 text-left select-none cursor-pointer hover:opacity-85 transition-opacity ${
																		isMyMessage
																			? "bg-slate-100/90 border-brand-primary text-slate-700"
																			: "bg-brand-light-soft border-brand-primary text-slate-700"
																	}`}
																	title="Bấm để di chuyển đến tin nhắn gốc"
																>
																	<div className="font-bold text-[9px] text-brand-primary opacity-90 flex items-center gap-1">
																		<RollbackOutlined className="text-[8px]" />
																		<span>{quoteSenderName}</span>
																	</div>
																	<div className="truncate max-w-[220px] text-[10px] text-slate-600">
																		{msg.replyToContent || replyQuote?.content}
																	</div>
																</div>
															);
														}

														return null;
													})()}
													<p className="px-3 py-1.5 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">
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

									{/* Khu vực Action Bar bên phải khi hover (tin nhắn nhận được) */}
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
					<div ref={messagesEndRef} />
				</div>
			</div>
		</div>
	);
}

export default ChatMiniMessageThread;
