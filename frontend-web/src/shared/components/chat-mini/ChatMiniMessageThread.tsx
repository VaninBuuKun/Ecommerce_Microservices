import React from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { CommentOutlined, SyncOutlined, PictureOutlined, VideoCameraOutlined, UndoOutlined } from "@ant-design/icons";
import type { ChatMessageDto, ChatThemePreset } from "@/domains/notification";
import { parseMediaUrls, downloadChatMedia } from "@/domains/notification";
import { ChatMessageActionBar } from "./ChatMessageActionBar";

interface ChatMiniMessageThreadProps {
	activeRoom: any;
	messages: ChatMessageDto[];
	currentUserId?: number;
	activePreset: ChatThemePreset;
	messagesContainerRef: React.RefObject<HTMLDivElement | null>;
	messagesEndRef: React.RefObject<HTMLDivElement | null>;
	onImageClick: (url: string) => void;
	isSeller: boolean;
	formatMessengerTime: (dateStr: string) => string;
	shouldShowTimeSeparator: (currentDateStr: string, prevDateStr?: string) => boolean;
	isPureEmoji: (text: string) => boolean;
	onRevokeMessage?: (messageId: string) => void;
	onReactMessage?: (messageId: string, emoji: string) => void;
}

export function ChatMiniMessageThread({
	activeRoom,
	messages,
	currentUserId,
	activePreset,
	messagesContainerRef,
	messagesEndRef,
	onImageClick,
	isSeller,
	formatMessengerTime,
	shouldShowTimeSeparator,
	isPureEmoji,
	onRevokeMessage,
	onReactMessage,
}: ChatMiniMessageThreadProps) {
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
				<div className="mt-auto flex flex-col space-y-2.5">
					{messages.map((msg, i) => {
						const isMyMessage = msg.senderId === currentUserId;
						const prevMsg = messages[i - 1];
						const showTimeSep = shouldShowTimeSeparator(msg.sentAt, prevMsg?.sentAt);
						const timeLabel = formatMessengerTime(msg.sentAt);
						const isEmoji = msg.messageType === "Text" && isPureEmoji(msg.content);
						const isRevoked = msg.isRevoked || msg.content === "Tin nhắn đã được thu hồi";
						const isMedia = msg.messageType === "Image" || msg.messageType === "Video";
						const mediaUrls = parseMediaUrls(msg.content);
						const mediaCount = mediaUrls.length;

						return (
							<div key={msg.id || i}>
								{/* Cột mốc thời gian ngắt quãng phong cách Messenger */}
								{showTimeSep && (
									<div className="flex justify-center my-3 select-none">
										<span className="text-[11px] font-medium text-slate-400 select-none">
											{timeLabel}
										</span>
									</div>
								)}

								<div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} items-end gap-1.5 group relative`}>
									{/* Khu vực Action Bar + Thời gian bên trái khi hover (tin nhắn gửi đi) */}
									{isMyMessage && !isRevoked && (
										<div className="flex flex-col items-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none shrink-0 pb-1">
											{!msg.isUploading && (
												<ChatMessageActionBar
													isMyMessage={isMyMessage}
													isMedia={isMedia}
													userReaction={msg.userReaction}
													onReact={(emoji) => onReactMessage?.(msg.id, emoji)}
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
											<span
												className={`text-[10px] font-semibold whitespace-nowrap ${activePreset.timestampText}`}
											>
												{timeLabel}
											</span>
										</div>
									)}

									{/* Tin nhắn đã bị thu hồi */}
									{isRevoked ? (
										<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100/90 text-slate-400 italic text-xs border border-slate-200/60 shadow-2xs select-none">
											<UndoOutlined className="text-xs text-slate-400" />
											<span>Tin nhắn đã được thu hồi</span>
										</div>
									) : isEmoji ? (
										/* Emoji độc lập */
										<div className="text-3xl py-1 select-none animate-in zoom-in-75 duration-150 relative">
											{msg.content}
										</div>
									) : (
										<div
											className={`relative max-w-[86%] transition-all ${
												msg.messageType === "Sticker"
													? "bg-transparent border-none shadow-none"
													: isMyMessage
													? `${activePreset.myBubble.bg} ${activePreset.myBubble.text} ${activePreset.myBubble.border || ""} rounded-2xl rounded-tr-xs shadow-2xs`
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
														<div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-800 bg-slate-900">
															<video src={mediaUrls[0]} controls={!msg.isUploading} className="max-w-[185px] max-h-[145px] rounded-xl block" />
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
													<div className="p-1 relative">
														<video src={mediaUrls[0] || msg.content} controls={!msg.isUploading} className="max-w-[195px] max-h-[155px] rounded-xl" />
														{msg.isUploading && (
															<div className="absolute inset-1 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white p-2 z-10 backdrop-blur-xs select-none">
																<SyncOutlined spin className="text-lg text-brand-primary mb-1" />
																<span className="text-[10px] font-bold">Đang tải video lên S3...</span>
															</div>
														)}
													</div>
												)
											) : (
												<p className="px-3 py-1.5 text-xs font-medium leading-relaxed break-words whitespace-pre-wrap">
													{msg.content}
												</p>
											)}

											{/* Reaction badges hiển thị ở góc dưới */}
											{msg.reactions && Object.keys(msg.reactions).length > 0 && (
												<div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 z-20">
													{Object.entries(msg.reactions).map(([emoji, count]) => (
														<button
															key={emoji}
															type="button"
															onClick={() => onReactMessage?.(msg.id, emoji)}
															className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] shadow-xs border transition-transform hover:scale-110 cursor-pointer ${
																msg.userReaction === emoji
																	? "bg-brand-primary/20 border-brand-primary text-brand-dark font-bold"
																	: "bg-white border-slate-200 text-slate-700 font-medium"
															}`}
														>
															<span>{emoji}</span>
															{count > 1 && <span>{count}</span>}
														</button>
													))}
												</div>
											)}
										</div>
									)}

									{/* Khu vực Action Bar + Thời gian bên phải khi hover (tin nhắn nhận được) */}
									{!isMyMessage && !isRevoked && (
										<div className="flex flex-col items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none shrink-0 pb-1">
											{!msg.isUploading && (
												<ChatMessageActionBar
													isMyMessage={isMyMessage}
													isMedia={isMedia}
													userReaction={msg.userReaction}
													onReact={(emoji) => onReactMessage?.(msg.id, emoji)}
													onDownload={
														isMedia
															? () => {
																	mediaUrls.forEach((url) => downloadChatMedia(url));
															  }
															: undefined
													}
												/>
											)}
											<span
												className={`text-[10px] font-semibold whitespace-nowrap ${activePreset.timestampText}`}
											>
												{timeLabel}
											</span>
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
