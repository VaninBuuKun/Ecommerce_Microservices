import React from "react";
import { Link } from "react-router-dom";
import { FullscreenOutlined, CloseOutlined } from "@ant-design/icons";
import { CommentOutlined } from "@ant-design/icons";

interface ChatMiniHeaderProps {
	activeRoom: any;
	isSeller: boolean;
	onClose: () => void;
}

export function ChatMiniHeader({ activeRoom, isSeller, onClose }: ChatMiniHeaderProps) {
	return (
		<div className="h-12 px-3.5 bg-white border-b border-brand-border flex items-center justify-between select-none shrink-0 shadow-2xs">
			<div className="flex items-center gap-2.5 min-w-0">
				<CommentOutlined className="text-lg text-brand-primary-deep shrink-0 hover:scale-110 transition-transform" />
				<div className="flex items-center gap-1.5 min-w-0">
					<span className="font-black text-xs text-brand-dark truncate">Chat</span>
					<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-light-soft text-brand-primary-deep border border-brand-border">
						{isSeller ? "Người mua" : "Người bán"}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-1">
				{/* Nút phóng to toàn màn hình sang /chat */}
				<Link
					to={isSeller ? "/chat?seller=true" : "/chat"}
					onClick={onClose}
					className="p-1.5 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark transition-colors flex items-center justify-center no-underline"
					title="Mở toàn màn hình"
				>
					<FullscreenOutlined className="text-xs" />
				</Link>

				{/* Nút đóng mini chat */}
				<button
					type="button"
					onClick={onClose}
					className="p-1.5 rounded-md hover:bg-red-50 text-brand-muted hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
					title="Đóng chat"
				>
					<CloseOutlined className="text-xs" />
				</button>
			</div>
		</div>
	);
}

export default ChatMiniHeader;
