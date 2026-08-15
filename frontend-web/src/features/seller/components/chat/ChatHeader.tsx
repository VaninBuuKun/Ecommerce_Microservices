import { ExternalLink } from "lucide-react";

interface ChatHeaderProps {
	shopName: string;
	avatarUrl: string;
	profileLink: string;
	isSeller: boolean;
}

export default function ChatHeader({
	shopName,
	avatarUrl,
	profileLink,
	isSeller,
}: ChatHeaderProps) {
	const initials = shopName
		? shopName.substring(0, 2).toUpperCase()
		: "CH";

	return (
		<div className="px-4 py-2 border-b border-brand-border bg-white text-left flex items-center justify-between shadow-sm relative overflow-visible">
			<div className="flex items-center gap-2 relative">
				{/* Avatar */}
				<div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20 overflow-hidden select-none">
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt={shopName}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-[9px] font-black text-brand-primary-deep">
							{initials}
						</span>
					)}
				</div>

				{/* Name */}
				<span
					className="text-[11px] font-black text-brand-dark max-w-[120px] truncate"
					title={shopName}
				>
					{shopName}
				</span>

				{/* External link with tooltip */}
				<a
					href={profileLink}
					target="_blank"
					rel="noopener noreferrer"
					className="p-1 hover:bg-brand-primary/10 rounded text-brand-primary-deep transition-all flex items-center justify-center cursor-pointer relative group"
				>
					<ExternalLink className="w-3.5 h-3.5" />

					{/* Tooltip rendered BELOW to avoid overflow clip */}
					<span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block bg-brand-dark text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl border border-brand-dark-lift/25 whitespace-nowrap z-[9999] pointer-events-none">
						{isSeller
							? "Xem thông tin cá nhân"
							: "Xem thông tin Shop"}
						<span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-brand-dark rotate-45 border-l border-t border-brand-dark-lift/25" />
					</span>
				</a>
			</div>

			{/* Online indicator */}
			<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
		</div>
	);
}
