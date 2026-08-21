import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategoriesQuery } from "../../hooks/useCatalog";
import { motion } from "framer-motion";

export function CategoryList() {
	const categoryRef = useRef<HTMLDivElement>(null);
	const { data: categories = [], isLoading, error } = useCategoriesQuery();

	const scrollContainer = (direction: "left" | "right") => {
		if (categoryRef.current) {
			const scrollAmount = direction === "left" ? -400 : 400;
			categoryRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
		}
	};

	if (isLoading) {
		return (
			<section className="py-20 px-6 max-w-6xl mx-auto w-full text-center">
				<p className="text-gray-500">Đang tải danh mục...</p>
			</section>
		);
	}

	if (error) {
		return (
			<section className="py-20 px-6 max-w-6xl mx-auto w-full text-center">
				<p className="text-red-500">Không thể tải danh mục từ hệ thống.</p>
			</section>
		);
	}

	const displayCategories = categories.length % 2 === 0 ? categories : categories.slice(0, -1);
	const groupedCategories: any[][] = [];
	for (let i = 0; i < displayCategories.length; i += 2) {
		groupedCategories.push(displayCategories.slice(i, i + 2));
	}

	return (
		<section className="py-20 px-6 max-w-6xl mx-auto w-full font-sans">
			<div className="flex flex-col md:flex-row md:items-end justify-between mb-8 text-left">
				<div>
					<span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-2">
						// CATEGORIES
					</span>
					<h2 className="text-3xl font-bold text-brand-dark tracking-tight">
						Danh Mục Buu Store
					</h2>
				</div>
				<div className="flex gap-2 mt-4 md:mt-0">
					<button
						onClick={() => scrollContainer("left")}
						className="p-2 border border-brand-border rounded-full hover:bg-brand-primary transition cursor-pointer"
					>
						<ChevronLeft className="w-5 h-5 text-brand-dark" />
					</button>
					<button
						onClick={() => scrollContainer("right")}
						className="p-2 border border-brand-border rounded-full hover:bg-brand-primary transition cursor-pointer"
					>
						<ChevronRight className="w-5 h-5 text-brand-dark" />
					</button>
				</div>
			</div>

			{/* Container lướt ngang theo từng cột cặp đôi */}
			<div
				ref={categoryRef}
				className="flex gap-4 overflow-x-auto hide-scrollbar snap-x scroll-smooth pb-4"
			>
				{groupedCategories.map((pair: any[], index: number) => (
					<div
						key={index}
						className="flex flex-col gap-4 flex-shrink-0 w-[120px] snap-start"
					>
						{pair.map((c: any) => (
							<motion.div
								whileHover={{ y: -2 }}
								key={c.id}
								className="snap-start group cursor-pointer w-[120px] text-center"
							>
								<div className="aspect-square rounded-full overflow-hidden mb-2 border border-brand-border p-1 bg-white">
									<img
										src={c.iconUrl || c.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=100"}
										alt={c.name}
										className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
									/>
								</div>
								<p className="text-xs text-center font-medium text-brand-dark group-hover:text-brand-primary transition-colors line-clamp-1">
									{c.name}
								</p>
							</motion.div>
						))}
					</div>
				))}
			</div>
		</section>
	);
}
