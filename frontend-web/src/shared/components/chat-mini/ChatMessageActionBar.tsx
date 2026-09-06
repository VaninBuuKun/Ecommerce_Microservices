import React, { useState, useRef, useEffect } from "react";
import { SmileOutlined, DownloadOutlined, DeleteOutlined } from "@ant-design/icons";
import { REACTION_EMOJIS } from "@/domains/notification";

interface ChatMessageActionBarProps {
	isMyMessage: boolean;
	isMedia: boolean;
	onReact: (emoji: string) => void;
	onRevoke?: () => void;
	onDownload?: () => void;
	userReaction?: string;
}

export const ChatMessageActionBar: React.FC<ChatMessageActionBarProps> = ({
	isMyMessage,
	isMedia,
	onReact,
	onRevoke,
	onDownload,
	userReaction,
}) => {
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
	const emojiPickerRef = useRef<HTMLDivElement>(null);

	// Tự động đóng popover emoji khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
				setShowEmojiPicker(false);
			}
		};
		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker]);

	return (
		<div
			ref={emojiPickerRef}
			className="relative flex items-center gap-0.5 bg-white/95 backdrop-blur-md px-1 py-0.5 rounded-full border border-slate-200 shadow-xs z-20 select-none"
		>
			{/* 1. Nút Icon Cảm Xúc (Mặt cười) - Click mới mở danh sách biểu tượng cảm xúc */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					setShowEmojiPicker((v) => !v);
					setShowConfirmRevoke(false);
				}}
				className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors cursor-pointer border-none ${
					showEmojiPicker || userReaction
						? "bg-amber-100/80 text-amber-600 font-bold"
						: "text-slate-500 hover:text-amber-500 hover:bg-slate-100 bg-transparent"
				}`}
				title="Thả cảm xúc"
			>
				<SmileOutlined className="text-xs" />
			</button>

			{/* 2. Nút Tải ảnh / video về máy (chỉ hiện khi là media) */}
			{isMedia && onDownload && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDownload();
					}}
					className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
					title="Tải về thiết bị"
				>
					<DownloadOutlined className="text-xs" />
				</button>
			)}

			{/* 3. Nút Xóa / Thu hồi tin nhắn (chỉ hiện với tin nhắn của mình) */}
			{isMyMessage && onRevoke && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setShowConfirmRevoke((v) => !v);
						setShowEmojiPicker(false);
					}}
					className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer ${
						showConfirmRevoke
							? "bg-red-100 text-red-600"
							: "text-slate-500 hover:text-red-500 hover:bg-red-50 bg-transparent"
					}`}
					title="Thu hồi tin nhắn"
				>
					<DeleteOutlined className="text-xs" />
				</button>
			)}

			{/* Floating Popover Emoji List khi nhấn nút (Căn giữa cân đối 2 bên) */}
			{showEmojiPicker && (
				<div
					className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xl border border-slate-200 animate-in zoom-in-90 duration-150 whitespace-nowrap"
					onClick={(e) => e.stopPropagation()}
				>
					{REACTION_EMOJIS.map((emoji) => {
						const isSelected = userReaction === emoji;
						return (
							<button
								key={emoji}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setShowEmojiPicker(false);
									onReact(emoji);
								}}
								className={`w-7 h-7 flex items-center justify-center text-base rounded-full transition-transform hover:scale-135 active:scale-95 cursor-pointer border-none ${
									isSelected ? "bg-brand-primary/20 scale-115" : "bg-transparent hover:bg-slate-100"
								}`}
								title={emoji}
							>
								{emoji}
							</button>
						);
					})}
				</div>
			)}

			{/* Popover xác nhận thu hồi (Căn giữa cân đối) */}
			{showConfirmRevoke && (
				<div
					className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-center space-y-1.5 animate-in zoom-in-95 duration-100"
					onClick={(e) => e.stopPropagation()}
				>
					<p className="text-[10px] font-bold text-slate-800 leading-tight">
						Thu hồi tin nhắn ở cả hai phía?
					</p>
					<div className="flex items-center justify-center gap-1.5 pt-0.5">
						<button
							type="button"
							onClick={() => setShowConfirmRevoke(false)}
							className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
						>
							Hủy
						</button>
						<button
							type="button"
							onClick={() => {
								setShowConfirmRevoke(false);
								onRevoke?.();
							}}
							className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 border-none cursor-pointer shadow-2xs"
						>
							Thu hồi
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatMessageActionBar;
