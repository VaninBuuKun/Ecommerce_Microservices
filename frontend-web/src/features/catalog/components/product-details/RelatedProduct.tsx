import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductsQuery } from "../../hooks";

interface RelatedProductsProps {
	categoryId?: string | null;
	currentProductId?: string | number | null;
}

export function RelatedProducts({
	categoryId,
	currentProductId,
}: RelatedProductsProps) {
	// Fetch danh sách sản phẩm cùng Category từ API
	const { data: productsData, isLoading } = useProductsQuery({
		categoryId: categoryId || undefined,
	});

	// Chống null cho danh sách sản phẩm & Lọc bỏ sản phẩm hiện tại
	const products = productsData?.items || productsData || [];
	const relatedList = Array.isArray(products)
		? products.filter((p: any) => p?.id !== currentProductId).slice(0, 4)
		: [];

	if (isLoading) {
		return (
			<div className="bg-white rounded-2xl border border-brand-border shadow-sm p-4 text-left">
				<div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-4" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-48 bg-gray-100 rounded-xl animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	if (relatedList.length === 0) return null;

	return (
		<div className="bg-white rounded-2xl border border-brand-border shadow-sm p-4 md:p-5 text-left">
			<h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 border-b border-brand-border pb-2">
				Sản phẩm liên quan
			</h2>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
				{relatedList.map((item: any) => {
					const price = item?.discountPrice || item?.price || 0;
					const originalPrice = item?.price || 0;
					const hasDiscount =
						item?.discountPrice &&
						item.discountPrice < originalPrice;

					const thumb =
						item?.thumbnailUrl ||
						item?.mainImageUrl ||
						(item?.imageUrls && item.imageUrls[0]) ||
						"https://via.placeholder.com/150";

					return (
						<Link
							key={item.id}
							to={`/product/${item.id}`}
							className="group border border-brand-border/60 hover:border-brand-primary rounded-xl p-2.5 transition-all bg-white hover:shadow-md flex flex-col justify-between"
						>
							<div>
								{/* Image Box */}
								<div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2 relative">
									<img
										src={thumb}
										alt={item?.name || "Product"}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										loading="lazy"
									/>
									{hasDiscount && (
										<span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
											-
											{Math.round(
												((originalPrice - price) /
													originalPrice) *
													100,
											)}
											%
										</span>
									)}
								</div>

								{/* Title */}
								<h3 className="text-xs font-semibold text-brand-dark line-clamp-2 group-hover:text-brand-primary-deep transition-colors mb-1">
									{item?.name || "Sản phẩm chưa có tên"}
								</h3>
							</div>

							{/* Price & Rating */}
							<div className="mt-2 pt-2 border-t border-brand-border/40">
								<div className="flex items-center gap-1 text-[11px] font-bold text-brand-dark mb-0.5">
									<span>
										{price.toLocaleString("vi-VN")}đ
									</span>
									{hasDiscount && (
										<span className="text-[10px] text-brand-muted line-through font-normal">
											{originalPrice.toLocaleString(
												"vi-VN",
											)}
											đ
										</span>
									)}
								</div>

								<div className="flex items-center gap-1 text-[10px] text-brand-muted">
									<Star className="w-3 h-3 fill-brand-primary stroke-brand-primary" />
									<span>{item?.averageRating || 5.0}</span>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
