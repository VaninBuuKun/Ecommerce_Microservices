import React, { useState, useRef, useEffect } from "react";
import { DownloadOutlined, DeleteOutlined, RollbackOutlined } from "@ant-design/icons";

interface ChatMessageActionBarProps {
	isMyMessage: boolean;
	isMedia: boolean;
	onReply?: () => void;
	onRevoke?: () => void;
	onDownload?: () => void;
}

export const ChatMessageActionBar: React.FC<ChatMessageActionBarProps> = ({
	isMyMessage,
	isMedia,
	onReply,
	onRevoke,
	onDownload,
}) => {
	const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
	const barRef = useRef<HTMLDivElement>(null);

	// Tự động đóng popover xác nhận khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (barRef.current && !barRef.current.contains(e.target as Node)) {
				setShowConfirmRevoke(false);
			}
		};
		if (showConfirmRevoke) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showConfirmRevoke]);

	return (
		<div
			ref={barRef}
			className="relative flex items-center gap-0.5 bg-white/95 backdrop-blur-md px-1 py-0.5 rounded-full border border-slate-200 shadow-xs z-20 select-none"
		>
			{/* 1. Nút Trả lời (Reply) tin nhắn */}
			{onReply && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setShowConfirmRevoke(false);
						onReply();
					}}
					className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 hover:text-brand-dark hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
					title="Trả lời tin nhắn"
				>
					<RollbackOutlined className="text-xs" />
				</button>
			)}

			{/* 2. Nút Tải ảnh / video / file về máy (chỉ hiện khi là media/file) */}
			{isMedia && onDownload && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onDownload();
					}}
					className="w-5 h-5 flex items-center justify-center rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
					title="Tải xuống thiết bị"
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
