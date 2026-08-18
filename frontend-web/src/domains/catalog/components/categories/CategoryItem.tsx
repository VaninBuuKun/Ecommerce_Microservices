import { Link } from "react-router-dom";

export default function CategoryItem({ category }: { category: any }) {
	return (
		<Link
			to={`/categories/${category.id}`}
			className="group flex-shrink-0 w-36 p-3 bg-white rounded-lg border border-brand-border hover:border-brand-primary hover:shadow-md transition-all flex flex-col items-center text-center space-y-2 select-none"
		>
			<div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center overflow-hidden border border-brand-border group-hover:scale-105 transition-transform">
				<img
					src={
						category.imageUrl ||
						"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=100"
					}
					alt={category.name}
					className="w-full h-full object-cover"
				/>
			</div>
			<span className="text-xs font-bold text-brand-dark group-hover:text-brand-primary transition-colors line-clamp-1">
				{category.name}
			</span>
		</Link>
	);
}
