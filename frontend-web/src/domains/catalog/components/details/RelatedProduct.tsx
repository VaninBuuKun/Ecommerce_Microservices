import { Star, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
import { useSimilarProductsQuery, useProductsQuery } from "@/domains/catalog";

interface RelatedProductsProps {
	categoryId?: number | null;
	currentProductId?: string | null;
}

export function RelatedProducts({
	categoryId,
	currentProductId,
}: RelatedProductsProps) {
	// 1. Fetch AI/Content-based Similar Products from Recommendation Service
	const {
		data: recommendationData,
		isLoading: isRecoLoading,
	} = useSimilarProductsQuery(currentProductId || undefined, 8);

	// 2. Fallback query to Catalog if Recommendation service has no data yet
	const { data: fallbackData, isLoading: isFallbackLoading } = useProductsQuery({
		categoryId: categoryId || undefined,
		limit: 8,
	});

	const recoItems = recommendationData?.items || [];
	const fallbackItems = fallbackData?.items || fallbackData || [];

	const filteredFallback = Array.isArray(fallbackItems)
		? fallbackItems.filter((p: any) => String(p?.id) !== String(currentProductId)).slice(0, 8)
		: [];

	// Prefer recommendation service items; otherwise use catalog fallback
	const finalProducts = recoItems.length > 0 ? recoItems : filteredFallback;
	const isLoading = isRecoLoading && finalProducts.length === 0;

	const renderStars = (rating: number = 5) => {
		const score = rating > 0 ? rating : 5;
		const rounded = Math.round(score);
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((s) => (
					<Star
						key={s}
						className={`w-2.5 h-2.5 ${s <= rounded
							? "fill-amber-400 text-amber-400 stroke-amber-400"
							: "fill-gray-200 text-gray-200 stroke-gray-200"
							}`}
					/>
				))}
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className="bg-white rounded-md border border-brand-border/70 shadow-sm p-4 text-left mb-6">
				<div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-48 bg-gray-100 rounded-md animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (finalProducts.length === 0) return null;

	return (
		<div className="bg-white rounded-md border border-brand-border/70 shadow-sm p-4 md:p-5 text-left space-y-3.5 mb-6">
			<div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5">
				<div className="flex items-center gap-1.5">
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wider">
						SẢN PHẨM TƯƠNG TỰ
					</h2>
				</div>
				{recoItems.length > 0 && (
					<span className="text-[11px] font-extrabold bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 text-purple-700 border border-purple-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
						<BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
						Gợi ý thông minh
					</span>
				)}
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{finalProducts.map((item: any) => {
					const hasDiscount = item?.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price;
					const discountPercent = hasDiscount ? Math.round(((item.price - item.discountPrice) / item.price) * 100) : 0;
					const activePrice = hasDiscount ? item.discountPrice : item.price;
					const soldCount = item?.sold || item?.soldQuantity || 0;

					const thumb =
						item?.thumbnailUrl ||
						item?.mainImageUrl ||
						(item?.imageUrls && item.imageUrls[0]) ||
						"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300";

					return (
						<Link
							key={item.id}
							to={`/products/${item.id}`}
							className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-md overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
						>
							{hasDiscount && (
								<div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
									-{discountPercent}%
								</div>
							)}

							<div className="aspect-square w-full relative overflow-hidden bg-slate-50 border-b border-brand-border/40">
								<img
									src={thumb}
									alt={item?.name || "Product"}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									loading="lazy"
								/>
							</div>

							<div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
								<div className="space-y-1">
									<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
										{item?.name || "Sản phẩm chưa có tên"}
									</h3>

									{/* Rating Stars under Name */}
									<div className="flex items-center gap-1">
										{renderStars(item?.averageRating)}
										<span className="text-brand-muted text-[9px] font-normal">
											({item?.reviewCount || 0})
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

									{/* Strikethrough original price with fixed height container to ensure uniform card alignment */}
									<div className="h-4 flex items-center">
										{hasDiscount ? (
											<span className="text-[11px] text-gray-400 font-normal line-through leading-tight">
												{Number(item.price).toLocaleString("vi-VN")}đ
											</span>
										) : (
											<span className="invisible text-[11px] leading-tight select-none">0đ</span>
										)}
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
