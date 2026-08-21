import React from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import { useFollowShop } from "../hooks/useFollowShop";

interface FollowShopButtonProps {
	shopId: number;
	className?: string;
	variant?: "primary" | "outline" | "compact";
}

export const FollowShopButton: React.FC<FollowShopButtonProps> = ({
	shopId,
	className = "",
	variant = "primary",
}) => {
	const { isFollowing, toggleFollowShop, isToggling } = useFollowShop(shopId);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!isToggling && shopId) {
			toggleFollowShop(shopId);
		}
	};

	if (variant === "compact") {
		return (
			<motion.button
				whileTap={{ scale: 0.92 }}
				onClick={handleClick}
				disabled={isToggling}
				className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
					isFollowing
						? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
						: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
				} ${className}`}
			>
				{isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
				<span>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
			</motion.button>
		);
	}

	return (
		<motion.button
			whileTap={{ scale: 0.95 }}
			whileHover={{ scale: 1.02 }}
			onClick={handleClick}
			disabled={isToggling}
			className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer shadow-sm ${
				isFollowing
					? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
					: "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200"
			} ${className}`}
		>
			{isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
			<span>{isFollowing ? "Đang theo dõi Shop" : "+ Theo dõi Shop"}</span>
		</motion.button>
	);
};
