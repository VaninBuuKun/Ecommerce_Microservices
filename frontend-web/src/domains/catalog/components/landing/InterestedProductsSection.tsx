import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useProductsQuery } from "../../hooks/useCatalog";

export function InterestedProductsSection() {
	const navigate = useNavigate();
	const [interestedSlide, setInterestedSlide] = useState(0);

	const { data: topProductsData } = useProductsQuery({
		limit: 18,
		pageSize: 18,
	});

	const allInterested = topProductsData?.items ? [...topProductsData.items].reverse() : [];
	const SLIDE_ITEMS_PER_PAGE = 6;
	const totalInterestedSlides = Math.ceil(allInterested.length / SLIDE_ITEMS_PER_PAGE) || 1;

	const currentInterested = allInterested.slice(
		interestedSlide * SLIDE_ITEMS_PER_PAGE,
		(interestedSlide + 1) * SLIDE_ITEMS_PER_PAGE,
	);

	const renderPriceBlock = (price: number, discountPrice?: number) => {
		const hasDiscount = discountPrice && discountPrice > 0 && discountPrice < price;
		const activePrice = hasDiscount ? discountPrice : price;

		return (
			<div className="pt-1 space-y-0.5">
				<div className="flex items-center gap-1.5">
					<span className="font-extrabold text-red-600 text-sm leading-none">
						{activePrice.toLocaleString("vi-VN")}đ
					</span>
				</div>
				{hasDiscount && (
					<div className="text-[11px] text-gray-400 font-normal line-through leading-tight">
						{price.toLocaleString("vi-VN")}đ
					</div>
				)}
			</div>
		);
	};

	return (
		<section className="bg-white border border-brand-border/70 rounded-xl p-3.5 md:p-4 shadow-2xs space-y-3.5 relative">
			<div className="flex items-center gap-2 text-left border-b border-brand-border/60 pb-2.5">
				<div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
					<Heart className="w-4 h-4 fill-blue-500 text-blue-500" />
				</div>
				<div>
					<h2 className="text-xs font-black text-brand-dark uppercase tracking-wide">
						Sản phẩm bạn quan tâm
					</h2>
					<p className="text-[10px] text-brand-muted font-bold">
						Gợi ý dựa trên xu hướng tìm kiếm phổ biến
					</p>
				</div>
			</div>

			<div className="relative group/slider">
				{interestedSlide > 0 && (
					<button
						onClick={() => setInterestedSlide((prev) => prev - 1)}
						className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 text-brand-dark flex items-center justify-center shadow-md hover:bg-slate-50 transition-all cursor-pointer border-none"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
				)}

				<AnimatePresence mode="wait">
					<motion.div
						key={interestedSlide}
						initial={{ opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						transition={{ duration: 0.25 }}
						className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left"
					>
						{currentInterested.map((p: any) => {
							const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
							const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
							return (
								<motion.div
									whileHover={{ y: -3 }}
									key={p.id}
									onClick={() => navigate(`/products/${p.id}`)}
									className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
								>
									{hasDiscount && (
										<div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
											-{discountPercent}%
										</div>
									)}

									<div className="aspect-square w-full relative overflow-hidden bg-slate-50 border-b border-brand-border/40">
										<img
											src={
												p.thumbnailUrl ||
												"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300"
											}
											alt={p.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									</div>

									<div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
										<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
											{p.name}
										</h3>
										<div className="space-y-1 border-t border-brand-border/40 pt-1.5">
											<div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
												<Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
												<span>{p.averageRating ? p.averageRating.toFixed(1) : "5.0"}</span>
												<span className="text-brand-muted text-[9px] font-normal">
													({p.reviewCount || 0})
												</span>
											</div>
											{renderPriceBlock(p.price, p.discountPrice)}
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</AnimatePresence>

				{interestedSlide < totalInterestedSlides - 1 && (
					<button
						onClick={() => setInterestedSlide((prev) => prev + 1)}
						className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 text-brand-dark flex items-center justify-center shadow-md hover:bg-slate-50 transition-all cursor-pointer border-none"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				)}
			</div>
		</section>
	);
}
