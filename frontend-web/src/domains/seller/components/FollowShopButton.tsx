import React from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, UserX, Loader2 } from "lucide-react";
import { useFollowShop } from "../hooks/useFollowShop";

interface FollowShopButtonProps {
	shopId: number;
	className?: string;
	variant?: "primary" | "outline" | "compact";
	followerCount?: number;
}

export const FollowShopButton: React.FC<FollowShopButtonProps> = ({
	shopId,
	className = "",
	variant = "primary",
	followerCount,
}) => {
	const { isFollowing, toggleFollowShop, isToggling, isLoadingStatus } = useFollowShop(shopId);

	if (isLoadingStatus) {
		return (
			<div className={`inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-100 text-slate-400 text-xs font-bold gap-1.5 ${className}`}>
				<Loader2 className="w-3.5 h-3.5 animate-spin" />
				<span>Đang tải...</span>
			</div>
		);
	}

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!isToggling && shopId) {
			toggleFollowShop(shopId);
		}
	};

	// Compact pill variant
	if (variant === "compact") {
		return (
			<motion.button
				whileTap={{ scale: 0.94 }}
				whileHover={{ scale: 1.03 }}
				onClick={handleClick}
				disabled={isToggling}
				className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs ${
					isFollowing
						? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
						: "bg-brand-primary text-white hover:bg-brand-primary-deep shadow-xs"
				} ${className}`}
			>
				{isToggling ? (
					<Loader2 className="w-3.5 h-3.5 animate-spin" />
				) : isFollowing ? (
					<>
						<UserCheck className="w-3.5 h-3.5 group-hover:hidden text-emerald-600" />
						<UserX className="w-3.5 h-3.5 hidden group-hover:block text-rose-500" />
					</>
				) : (
					<UserPlus className="w-3.5 h-3.5" />
				)}
				<span>
					{isFollowing ? (
						<>
							<span className="group-hover:hidden">Đang theo dõi</span>
							<span className="hidden group-hover:inline">Bỏ theo dõi</span>
						</>
					) : (
						"Theo dõi"
					)}
				</span>
				{followerCount !== undefined && followerCount > 0 && (
					<span className="text-[10px] font-mono opacity-80">
						({followerCount > 999 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount})
					</span>
				)}
			</motion.button>
		);
	}

	// Primary default variant (for Shop Profile page header)
	return (
		<motion.button
			whileTap={{ scale: 0.96 }}
			whileHover={{ scale: 1.02 }}
			onClick={handleClick}
			disabled={isToggling}
			className={`group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
				isFollowing
					? "bg-emerald-50/90 text-emerald-700 border border-emerald-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 hover:shadow-sm"
					: "bg-brand-primary hover:bg-brand-primary-deep text-white border border-brand-primary hover:shadow-md"
			} ${className}`}
		>
			{isToggling ? (
				<Loader2 className="w-4 h-4 animate-spin text-current" />
			) : isFollowing ? (
				<>
					<UserCheck className="w-4 h-4 text-emerald-600 group-hover:hidden transition-transform" />
					<UserX className="w-4 h-4 text-rose-500 hidden group-hover:block transition-transform" />
				</>
			) : (
				<UserPlus className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
			)}

			<span className="tracking-wide">
				{isFollowing ? (
					<>
						<span className="group-hover:hidden">Đang theo dõi Shop</span>
						<span className="hidden group-hover:inline font-black">Bỏ theo dõi Shop</span>
					</>
				) : (
					"+ Theo dõi Shop"
				)}
			</span>

			{/* Hiển thị số lượng follower nếu có */}
			{followerCount !== undefined && (
				<span
					className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-black ${
						isFollowing
							? "bg-emerald-100/80 text-emerald-800 group-hover:bg-rose-100 group-hover:text-rose-700"
							: "bg-white/20 text-white"
					}`}
				>
					{followerCount > 999 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount}
				</span>
			)}
		</motion.button>
	);
};
