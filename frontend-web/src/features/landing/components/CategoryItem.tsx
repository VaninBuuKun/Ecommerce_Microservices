import { motion } from "framer-motion";
import type { Category } from "../types";

interface CategoryItemProps {
	category: Category;
	onClick?: () => void;
}

export default function CategoryItem({ category, onClick }: CategoryItemProps) {
	return (
		<motion.div
			whileHover={{ y: -2 }}
			onClick={onClick}
			className="snap-start group cursor-pointer w-[120px]"
		>
			<div className="aspect-square rounded-full overflow-hidden mb-2 border border-brand-border p-1 bg-white">
				<img
					src={category.iconUrl}
					alt={category.name}
					className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
				/>
			</div>
			<p className="text-xs text-center font-medium text-brand-dark group-hover:text-brand-primary transition-colors line-clamp-1">
				{category.name}
			</p>
		</motion.div>
	);
}
