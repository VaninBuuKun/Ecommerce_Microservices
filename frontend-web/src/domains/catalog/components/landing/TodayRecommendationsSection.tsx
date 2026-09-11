import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Sparkles, ShoppingBag, Star, Loader2 } from "lucide-react";
import { useInfinitePersonalizedRecommendationsQuery } from "../../hooks/useRecommendations";

export function TodayRecommendationsSection() {
	const navigate = useNavigate();
	const containerRef = useRef<HTMLDivElement>(null);
	// Lazy load: Trigger network fetch when user scrolls and section enters viewport by 40px
	const isInView = useInView(containerRef, { once: true, margin: "-40px" });

	// Progressive chunk pagination (Infinite Query) - cố định 18 items / trang, tối đa 6 trang (108 items)
	const {
		data,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	} = useInfinitePersonalizedRecommendationsQuery({
		enabled: isInView,
	});

	// Flatten paginated candidate pages into a unified list
	const productsList = data?.pages.flatMap((page) => page.items) || [];
	const firstPageStrategy = data?.pages[0]?.strategy || "";
	const isPersonalized = firstPageStrategy.toLowerCase().includes("personalized");
	const isWaitingForFetch = !isInView || isLoading;

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
		<motion.section
			ref={containerRef}
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.45, ease: "easeOut" }}
			className="bg-white border border-brand-border/70 rounded-xl p-3.5 md:p-4 shadow-2xs space-y-4"
		>
			<div className="flex items-center justify-between text-left border-b border-brand-border/60 pb-3">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
						<Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
								Gợi ý hôm nay
							</h2>
							{isPersonalized && (
								<span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
									Cá nhân hóa
								</span>
							)}
						</div>
						<p className="text-[10px] text-brand-muted font-bold">
							Khám phá danh sách sản phẩm nổi bật dành riêng cho bạn
						</p>
					</div>
				</div>
			</div>

			{/* Loading Skeleton */}
			{isWaitingForFetch && productsList.length === 0 ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
					{Array.from({ length: 12 }).map((_, idx) => (
						<div
							key={idx}
							className="h-60 bg-slate-100 rounded-lg animate-pulse"
						/>
					))}
				</div>
			) : productsList.length === 0 ? (
				<div className="py-12 text-center text-xs font-bold text-brand-muted space-y-2">
					<ShoppingBag className="w-8 h-8 mx-auto opacity-40 text-brand-muted" />
					<p>Hiện chưa có sản phẩm nào được hiển thị.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left">
					{productsList.map((p) => {
						const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
						const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
						const activePrice = hasDiscount ? p.discountPrice : p.price;
						const soldCount = p.sold || 0;

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
											"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300"
										}
										alt={p.name}
										loading="lazy"
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>

								<div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
									<div className="space-y-1">
										<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
											{p.name}
										</h3>

										{/* Rating Stars under Name */}
										<div className="flex items-center gap-1">
											{renderStars(p.averageRating)}
											<span className="text-brand-muted text-[9px] font-normal">
												({p.reviewCount || 0})
											</span>
										</div>
									</div>

									{/* Divider & Price / Sold Section */}
									<div className="border-t border-brand-border/40 pt-1.5 space-y-0.5">
										<div className="flex items-baseline justify-between gap-1">
											<span className="font-extrabold text-red-600 text-sm leading-none">
												{Number(activePrice).toLocaleString("vi-VN")}đ
											</span>
											<span className="text-[10px] text-brand-muted font-medium whitespace-nowrap">
												Đã bán {soldCount}
											</span>
										</div>

										{/* Strikethrough original price */}
										<div className="h-4 flex items-center">
											{hasDiscount ? (
												<span className="text-[11px] text-gray-400 font-normal line-through leading-tight">
													{Number(p.price).toLocaleString("vi-VN")}đ
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
				</div>
			)}

			{/* PROGRESSIVE CHUNK "XEM THÊM" BUTTON */}
			<div className="pt-4 border-t border-brand-border/60 flex items-center justify-center">
				{hasNextPage ? (
					<button
						type="button"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						className="px-8 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 hover:border-slate-400 active:scale-95"
					>
						{isFetchingNextPage ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin text-slate-500" />
								<span>Đang tải thêm 18 sản phẩm...</span>
							</>
						) : (
							<span>Xem thêm</span>
						)}
					</button>
				) : productsList.length > 0 ? (
					<p className="text-xs font-bold text-brand-muted py-2 px-4">
						Đã hiển thị tất cả sản phẩm gợi ý hôm nay ({productsList.length} sản phẩm)
					</p>
				) : null}
			</div>
		</motion.section>
	);
}
