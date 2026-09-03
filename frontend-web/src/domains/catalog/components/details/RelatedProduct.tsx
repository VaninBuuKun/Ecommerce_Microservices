import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductsQuery } from "@/domains/catalog";

interface RelatedProductsProps {
	categoryId?: number | null;
	currentProductId?: string | null;
}

export function RelatedProducts({
	categoryId,
	currentProductId,
}: RelatedProductsProps) {
	const { data: productsData, isLoading } = useProductsQuery({
		categoryId: categoryId || undefined,
		limit: 10,
	});

	const products = productsData?.items || productsData || [];
	const relatedList = Array.isArray(products)
		? products.filter((p: any) => p?.id !== currentProductId).slice(0, 4)
		: [];

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

	if (isLoading) {
		return (
			<div className="bg-white rounded-xl border border-brand-border/70 shadow-2xs p-4 text-left">
				<div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-48 bg-gray-100 rounded-lg animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (relatedList.length === 0) return null;

	return (
		<div className="bg-white rounded-xl border border-brand-border/70 shadow-2xs p-4 md:p-5 text-left space-y-3.5">
			<h2 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2.5">
				Sản phẩm tương tự
			</h2>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{relatedList.map((item: any) => {
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
							className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
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
											{activePrice.toLocaleString("vi-VN")}đ
										</span>
										<span className="text-[10px] text-brand-muted font-medium whitespace-nowrap">
											Đã bán {soldCount}
										</span>
									</div>

									{/* Strikethrough original price with fixed height container to ensure uniform card alignment */}
									<div className="h-4 flex items-center">
										{hasDiscount ? (
											<span className="text-[11px] text-gray-400 font-normal line-through leading-tight">
												{item.price.toLocaleString("vi-VN")}đ
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
