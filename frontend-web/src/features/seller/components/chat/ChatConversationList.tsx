import { Loader2 } from "lucide-react";
import type { ChatConversation } from "../../hooks/useChatConnection";

interface ChatConversationListProps {
	conversations: ChatConversation[];
	currentRoomId: string | null;
	isLoading: boolean;
	onSelectConversation: (room: ChatConversation) => void;
}

export default function ChatConversationList({
	conversations,
	currentRoomId,
	isLoading,
	onSelectConversation,
}: ChatConversationListProps) {
	return (
		<div className="w-52 border-r border-brand-border bg-white flex flex-col overflow-hidden">
			<div className="p-2 border-b border-brand-border/60 bg-brand-light-soft/10 text-[9px] font-bold text-brand-muted uppercase text-left">
				Hội thoại gần đây
			</div>
			<div className="flex-1 overflow-y-auto divide-y divide-brand-border/60">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center h-full text-brand-muted text-[10px] gap-1 p-4">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tải...
					</div>
				) : conversations.length > 0 ? (
					conversations.map((room) => {
						const isActive = currentRoomId === room.roomId;
						const initials = room.displayName
							? room.displayName.substring(0, 2).toUpperCase()
							: "CH";

						return (
							<div
								key={room.roomId}
								onClick={() => onSelectConversation(room)}
								className={`p-3 flex items-center gap-2.5 cursor-pointer transition-all duration-150 text-left border-b border-brand-border/30 ${
									isActive
										? "bg-brand-light-soft/80 border-l-4 border-brand-primary"
										: "hover:bg-brand-light-soft/40"
								}`}
							>
								{/* Avatar */}
								<div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20 overflow-hidden shadow-sm">
									{room.displayAvatar ? (
										<img
											src={room.displayAvatar}
											alt={room.displayName}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-[10px] font-black text-brand-primary-deep">
											{initials}
										</span>
									)}
								</div>

								{/* Info */}
								<div className="flex-1 min-w-0">
									<div className="flex justify-between items-baseline mb-0.5">
										<h5
											className={`text-[10px] truncate ${
												isActive
													? "font-black text-brand-dark"
													: "font-bold text-brand-muted"
											}`}
										>
											{room.displayName}
										</h5>
									</div>
									<p className="text-[9px] text-brand-muted truncate leading-tight font-medium">
										{room.lastMessage}
									</p>
								</div>
							</div>
						);
					})
				) : (
					<div className="text-center p-4 text-[10px] text-brand-muted font-bold mt-12">
						Chưa có hội thoại
					</div>
				)}
			</div>
		</div>
	);
}
