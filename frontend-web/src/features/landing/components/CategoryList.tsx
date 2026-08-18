import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategoryStore } from "../store";
import { useCategories } from "../hooks/useCategories";
import type { Category } from "../types";
import CategoryItem from "./CategoryItem";

export default function CategoryList() {
	const categoryRef = useRef<HTMLDivElement>(null);

	// 1. Lấy dữ liệu danh mục từ API thông qua TanStack Query
	const { data: categories = [], isLoading, error } = useCategories();

	// 2. Lấy hàm set state từ Zustand store
	const setSelectedCategory = useCategoryStore(
		(state) => state.setSelectedCategory,
	);

	const scrollContainer = (
		ref: React.RefObject<HTMLDivElement | null>,
		direction: "left" | "right",
	) => {
		if (ref.current) {
			const scrollAmount = direction === "left" ? -400 : 400;
			ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
		}
	};

	// Xử lý trạng thái đang tải hoặc lỗi
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
				<p className="text-red-500">
					Không thể tải danh mục từ hệ thống.
				</p>
			</section>
		);
	}

	// Chia danh sách thành các cặp (mỗi cột gồm 2 item: 1 trên, 1 dưới)
	// Nếu lẻ thì bỏ bớt 1 item cuối để giữ sự cân bằng 2 hàng hoàn hảo
	const displayCategories = categories.length % 2 === 0 ? categories : categories.slice(0, -1);
	const groupedCategories: Category[][] = [];
	for (let i = 0; i < displayCategories.length; i += 2) {
		groupedCategories.push(displayCategories.slice(i, i + 2));
	}

	return (
		<section className="py-20 px-6 max-w-6xl mx-auto w-full">
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
						onClick={() => scrollContainer(categoryRef, "left")}
						className="p-2 border border-brand-border rounded-full hover:bg-brand-primary transition cursor-pointer"
					>
						<ChevronLeft className="w-5 h-5 text-brand-dark" />
					</button>
					<button
						onClick={() => scrollContainer(categoryRef, "right")}
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
				{groupedCategories.map((pair, index) => (
					<div
						key={index}
						className="flex flex-col gap-4 flex-shrink-0 w-[120px] snap-start"
					>
						{pair.map((c) => (
							<CategoryItem
								key={c.id}
								category={c}
								onClick={() => {
									// Lưu category được chọn vào Zustand store toàn cục
									setSelectedCategory(c);
								}}
							/>
						))}
					</div>
				))}
			</div>
		</section>
	);
}
