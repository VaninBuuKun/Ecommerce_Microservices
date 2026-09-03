import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {Sparkles, Star, ChevronLeft, ChevronRight, Tag} from "lucide-react";
import { useNewArrivalsQuery } from "../../hooks/useCatalog";

export function NewArrivalsSection() {
	const navigate = useNavigate();
	const [slide, setSlide] = useState(0);

	const { data } = useNewArrivalsQuery(18);
	const allProducts = data?.items || [];

	const SLIDE_ITEMS = 6;
	const totalSlides = Math.ceil(allProducts.length / SLIDE_ITEMS) || 1;
	const currentItems = allProducts.slice(slide * SLIDE_ITEMS, (slide + 1) * SLIDE_ITEMS);

	const renderStars = (rating: number = 5) => {
		const score = rating > 0 ? rating : 5;
		const rounded = Math.round(score);
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((s) => (
					<Star
						key={s}
						className={`w-2.5 h-2.5 ${
							s <= rounded
								? "fill-amber-400 text-amber-400 stroke-amber-400"
								: "fill-gray-200 text-gray-200 stroke-gray-200"
						}`}
					/>
				))}
			</div>
		);
	};

	return (
		<section className="bg-white border border-brand-border/70 rounded-xl p-3.5 md:p-4 shadow-2xs space-y-3.5 relative">
			<div className="flex items-center gap-2 text-left border-b border-brand-border/60 pb-2.5">
				<div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
					<Tag className="w-4 h-4 fill-emerald-400 text-emerald-500"/>
				</div>
				<div>
					<h2 className="text-xs font-black text-brand-dark uppercase tracking-wide">
						Hàng mới về
					</h2>
					<p className="text-[10px] text-brand-muted font-bold">
						Cập nhật mới nhất — vừa lên kệ hôm nay
					</p>
				</div>
			</div>

			<div className="relative">
				{slide > 0 && (
					<button
						onClick={() => setSlide((prev) => prev - 1)}
						className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 text-brand-dark flex items-center justify-center shadow-md hover:bg-slate-50 transition-all cursor-pointer border-none"
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
				)}

				<AnimatePresence mode="wait">
					<motion.div
						key={slide}
						initial={{ opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						transition={{ duration: 0.25 }}
						className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left"
					>
						{currentItems.map((p: any) => {
							const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
							const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
							const activePrice = hasDiscount ? p.discountPrice : p.price;
							const soldCount = p.sold || p.soldQuantity || 0;

							return (
								<motion.div
									whileHover={{ y: -3 }}
									key={p.id}
									onClick={() => navigate(`/products/${p.id}`)}
									className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
								>
									{/* NEW badge */}
									<div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
										MỚI
									</div>

									{hasDiscount && (
										<div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
											-{discountPercent}%
										</div>
									)}

									<div className="aspect-square w-full relative overflow-hidden bg-slate-50 border-b border-brand-border/40">
										<img
											src={
												p.thumbnailUrl ||
												"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300"
											}
											alt={p.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									</div>

									<div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
										<div className="space-y-1">
											<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
												{p.name}
											</h3>
											<div className="flex items-center gap-1">
												{renderStars(p.averageRating)}
												<span className="text-brand-muted text-[9px] font-normal">
													({p.reviewCount || 0})
												</span>
											</div>
										</div>

										<div className="border-t border-brand-border/40 pt-1.5 space-y-0.5">
											<div className="flex items-baseline justify-between gap-1">
												<span className="font-extrabold text-red-600 text-sm leading-none">
													{activePrice.toLocaleString("vi-VN")}đ
												</span>
												<span className="text-[10px] text-brand-muted font-medium whitespace-nowrap">
													Đã bán {soldCount}
												</span>
											</div>
											<div className="h-4 flex items-center">
												{hasDiscount ? (
													<span className="text-[11px] text-gray-400 font-normal line-through leading-tight">
														{p.price.toLocaleString("vi-VN")}đ
													</span>
												) : (
													<span className="invisible text-[11px] leading-tight select-none">0đ</span>
												)}
											</div>
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</AnimatePresence>

				{slide < totalSlides - 1 && (
					<button
						onClick={() => setSlide((prev) => prev + 1)}
						className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 text-brand-dark flex items-center justify-center shadow-md hover:bg-slate-50 transition-all cursor-pointer border-none"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				)}
			</div>
		</section>
	);
}
