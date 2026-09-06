import React from "react";
import { Search } from "lucide-react";
import { formatConversationLastMessage } from "@/domains/notification";

interface ChatMiniConversationListProps {
	conversations: any[];
	activeRoom: any;
	onSelectRoom: (room: any) => void;
	isLoading: boolean;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

export function ChatMiniConversationList({
	conversations,
	activeRoom,
	onSelectRoom,
	isLoading,
	searchQuery,
	onSearchChange,
}: ChatMiniConversationListProps) {
	const safeConversations = Array.isArray(conversations) ? conversations : [];

	return (
		<div className="w-56 sm:w-64 border-r border-brand-border flex flex-col bg-white shrink-0 overflow-hidden">
			{/* Ô tìm kiếm cuộc trò chuyện */}
			<div className="p-2 border-b border-brand-border/60 shrink-0">
				<div className="relative">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Tìm shop..."
						className="w-full pl-8 pr-2.5 py-1.5 border border-brand-border rounded-md text-xs font-medium focus:outline-none focus:border-brand-primary bg-brand-light-soft/40 placeholder:text-brand-muted/70"
					/>
					<Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
				</div>
			</div>

			{/* Danh sách các cuộc hội thoại */}
			<div className="flex-1 overflow-y-auto divide-y divide-brand-border/40">
				{isLoading ? (
					<div className="p-6 text-center text-xs text-brand-muted">Đang tải cuộc trò chuyện...</div>
				) : safeConversations.length === 0 ? (
					<div className="p-6 text-center text-xs text-brand-muted">
						Chưa có cuộc trò chuyện nào
					</div>
				) : (
					safeConversations.map((conv) => {
						const isActive = activeRoom?.roomId === conv.roomId;
						return (
							<button
								key={conv.roomId}
								onClick={() => {
									if (activeRoom?.roomId === conv.roomId) return;
									onSelectRoom(conv);
								}}
								className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-none cursor-pointer ${
									isActive
										? "bg-brand-primary/10 border-l-4 border-brand-primary shadow-2xs"
										: "hover:bg-brand-light-soft bg-transparent"
								}`}
							>
								<div className="shrink-0 w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary-deep text-xs font-black flex items-center justify-center overflow-hidden border border-brand-border shadow-2xs relative">
									{conv.displayAvatar ? (
										<img
											src={conv.displayAvatar}
											alt={conv.displayName}
											className="w-full h-full object-cover"
											onError={(e) => {
												(e.currentTarget as HTMLElement).style.display = "none";
											}}
										/>
									) : (
										conv.displayName?.[0]?.toUpperCase() || "?"
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-1">
										<p
											className={`text-xs truncate ${
												isActive ? "font-black text-brand-dark" : "font-bold text-slate-800"
											}`}
										>
											{conv.displayName}
										</p>
										<span className="text-[10px] text-brand-muted font-normal shrink-0">
											{conv.lastActiveAt
												? new Date(conv.lastActiveAt).toLocaleTimeString("vi-VN", {
														hour: "2-digit",
														minute: "2-digit",
												  })
												: ""}
										</span>
									</div>
									<p
										className={`text-[11px] truncate font-normal mt-0.5 ${
											isActive ? "text-brand-dark/80" : "text-brand-muted"
										}`}
									>
										{formatConversationLastMessage(conv.lastMessage)}
									</p>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}

export default ChatMiniConversationList;
