import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, Star, Loader2 } from "lucide-react";
import { useProductsQuery } from "../../hooks/useCatalog";

export function TodayRecommendationsSection() {
	const navigate = useNavigate();
	const [recommendPage, setRecommendPage] = useState(1);
	const BATCH_SIZE = 36;

	const { data: recommendedData, isLoading: isProductsLoading, isFetching: isProductsFetching } = useProductsQuery({
		limit: recommendPage * BATCH_SIZE,
		pageSize: recommendPage * BATCH_SIZE,
	});

	const productsList = recommendedData?.items || [];
	const totalRecommendCount = recommendedData?.totalCount || productsList.length;
	const hasMoreRecommend = totalRecommendCount > productsList.length || (productsList.length % BATCH_SIZE === 0 && productsList.length > 0);

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
		<section className="bg-white border border-brand-border/70 rounded-xl p-3.5 md:p-4 shadow-2xs space-y-4">
			<div className="flex items-center justify-between text-left border-b border-brand-border/60 pb-3">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
						<Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
					</div>
					<div>
						<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
							Gợi ý hôm nay
						</h2>
						<p className="text-[10px] text-brand-muted font-bold">
							Khám phá danh sách sản phẩm nổi bật toàn sàn
						</p>
					</div>
				</div>
			</div>

			{/* Grid 6 Columns */}
			{isProductsLoading && productsList.length === 0 ? (
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
					{productsList.map((p: any) => {
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
											"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300"
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
				</div>
			)}

			{/* SIMPLE CLEAN "XEM THÊM" BUTTON */}
			<div className="pt-4 border-t border-brand-border/60 flex items-center justify-center">
				{hasMoreRecommend ? (
					<button
						type="button"
						onClick={() => setRecommendPage((prev) => prev + 1)}
						disabled={isProductsFetching}
						className="px-8 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
					>
						{isProductsFetching ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin text-slate-500" />
								<span>Đang tải...</span>
							</>
						) : (
							<span>Xem thêm</span>
						)}
					</button>
				) : productsList.length > 0 ? (
					<p className="text-xs font-bold text-brand-muted py-2 px-4">
						Đã hiển thị tất cả sản phẩm
					</p>
				) : null}
			</div>
		</section>
	);
}
