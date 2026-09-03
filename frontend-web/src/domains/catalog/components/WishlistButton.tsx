import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore, useAuthModalStore } from "@/domains/auth";

interface WishlistButtonProps {
	productId: string;
	className?: string;
	size?: number;
	showLabel?: boolean;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
	productId,
	className = "",
	size = 20,
	showLabel = false,
}) => {
	const { isWishlisted, toggleWishlist, isToggling } = useWishlist();
	const accessToken = useAuthStore((s) => s.accessToken);
	const { openAuthModal } = useAuthModalStore();
	const liked = isWishlisted(productId);

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!accessToken) {
			openAuthModal({
				title: "Yêu thích sản phẩm",
				description: "Vui lòng đăng nhập tài khoản để lưu sản phẩm vào danh sách yêu thích của bạn.",
			});
			return;
		}
		if (!isToggling) {
			toggleWishlist(productId);
		}
	};

	return (
		<motion.button
			whileTap={{ scale: 0.85 }}
			whileHover={{ scale: 1.08 }}
			onClick={handleClick}
			disabled={isToggling}
			className={`inline-flex items-center justify-center gap-2 rounded-full p-2.5 transition-colors shadow-sm cursor-pointer ${liked
					? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
					: "bg-white/80 backdrop-blur-md text-slate-500 hover:text-rose-500 hover:bg-white border border-slate-200/80"
				} ${className}`}
			title={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
		>
			<Heart
				size={size}
				className={`transition-colors ${liked ? "fill-rose-500 text-rose-500" : "fill-none"}`}
			/>
			{showLabel && (
				<span className="text-sm font-medium">
					{liked ? "Đã yêu thích" : "Yêu thích"}
				</span>
			)}
		</motion.button>
	);
};
