import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategoriesQuery } from "../../hooks/useCatalog";
import CategoryItem from "./CategoryItem";
import CategorySkeleton from "./CategorySkeleton";

export function CategoryList() {
	const { data: categories = [], isLoading } = useCategoriesQuery();
	const scrollRef = useRef<HTMLDivElement>(null);

	const scroll = (direction: "left" | "right") => {
		if (scrollRef.current) {
			const { scrollLeft, clientWidth } = scrollRef.current;
			const scrollAmount = clientWidth * 0.75;
			scrollRef.current.scrollTo({
				left:
					direction === "left"
						? scrollLeft - scrollAmount
						: scrollLeft + scrollAmount,
				behavior: "smooth",
			});
		}
	};

	return (
		<section className="py-8 bg-brand-light-soft/50 border-b border-brand-border/60">
			<div className="max-w-6xl mx-auto px-6 w-full">
				<div className="flex items-center justify-between mb-4 text-left">
					<div>
						<span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">
							// KHÁM PHÁ
						</span>
						<h2 className="text-xl font-bold text-brand-dark tracking-tight">
							Danh Mục Nổi Bật
						</h2>
					</div>

					<div className="flex items-center gap-1.5">
						<button
							onClick={() => scroll("left")}
							className="p-1.5 rounded-full border border-brand-border bg-white text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
							aria-label="Cuộn sang trái"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<button
							onClick={() => scroll("right")}
							className="p-1.5 rounded-full border border-brand-border bg-white text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
							aria-label="Cuộn sang phải"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div
					ref={scrollRef}
					className="flex items-stretch gap-3 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
				>
					{isLoading ? (
						<CategorySkeleton count={6} />
					) : (
						categories.map((category: any) => (
							<CategoryItem
								key={category.id}
								category={category}
							/>
						))
					)}
				</div>
			</div>
		</section>
	);
}
