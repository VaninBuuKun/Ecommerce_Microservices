import React from "react";
import { CommentOutlined } from "@ant-design/icons";
import { Search } from "lucide-react";
import type { Conversation } from "../../types/chat.types";

interface ChatConversationListProps {
	conversations: Conversation[];
	activeRoom: Conversation | null;
	onSelectRoom: (room: Conversation) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	isLoading: boolean;
	isSeller: boolean;
}

export const ChatConversationList: React.FC<ChatConversationListProps> = ({
	conversations,
	activeRoom,
	onSelectRoom,
	searchQuery,
	onSearchChange,
	isLoading,
	isSeller,
}) => {
	const filteredConversations = conversations.filter((c) =>
		c.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="w-[300px] xl:w-[320px] bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
			{/* Top Search bar - Căn giữa chuẩn xác icon kính lúp */}
			<div className="h-14 px-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
				<div className="relative w-full flex items-center">
					<input
						type="text"
						placeholder={isSeller ? "Tìm kiếm khách hàng..." : "Tìm kiếm shop..."}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary bg-slate-50 focus:bg-white transition-colors"
					/>
					<Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
				</div>
			</div>

			{/* Danh sách các cuộc hội thoại */}
			<div className="flex-1 overflow-y-auto divide-y divide-slate-100">
				{isLoading ? (
					<div className="p-6 text-center text-xs text-slate-400 font-medium">Đang tải cuộc hội thoại...</div>
				) : filteredConversations.length === 0 ? (
					<div className="p-8 text-center text-slate-400 space-y-2">
						<CommentOutlined className="text-2xl text-slate-300 mx-auto block" />
						<p className="text-xs font-bold text-slate-500">Chưa có cuộc trò chuyện nào</p>
					</div>
				) : (
					filteredConversations.map((conv) => {
						const isActive = activeRoom?.roomId === conv.roomId;
						const initial = conv.displayName?.[0]?.toUpperCase() || "?";
						return (
							<div
								key={conv.roomId}
								onClick={() => onSelectRoom(conv)}
								className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-none ${
									isActive
										? "bg-brand-primary/10 border-l-4 border-brand-primary shadow-2xs"
										: "hover:bg-brand-light-soft bg-transparent"
								}`}
							>
								<div className="relative shrink-0">
									{conv.displayAvatar ? (
										<img
											src={conv.displayAvatar}
											alt={conv.displayName}
											className="w-10 h-10 rounded-full object-cover border border-slate-200"
										/>
									) : (
										<div className="w-10 h-10 rounded-full bg-brand-dark text-brand-primary text-xs font-black flex items-center justify-center border border-slate-200">
											{initial}
										</div>
									)}
									<span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-xs" />
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-1 mb-0.5">
										<h4
											className={`text-xs font-bold truncate ${
												isActive ? "text-brand-dark font-black" : "text-slate-800"
											}`}
										>
											{conv.displayName}
										</h4>
										<span className="text-[10px] text-slate-400 font-medium shrink-0">
											{conv.lastActiveAt
												? new Date(conv.lastActiveAt).toLocaleTimeString("vi-VN", {
														hour: "2-digit",
														minute: "2-digit",
													})
												: ""}
										</span>
									</div>
									<p
										className={`text-[11px] truncate font-normal ${
											isActive ? "text-brand-dark/80" : "text-slate-500"
										}`}
									>
										{conv.lastMessage || "Bắt đầu cuộc hội thoại..."}
									</p>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
