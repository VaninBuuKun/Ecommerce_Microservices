import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
	Star,
	ShoppingBag,
	ChevronRight,
	Heart,
	Truck,
	Loader2,
	Store,
	MessageCircle,
	Edit,
} from "lucide-react";
import {
	useProductByIdQuery,
	ProductGallery,
	ProductOptions,
	ProductPrice,
	QuantitySelector,
	ProductDescription,
	RelatedProducts,
	ProductReviewsSection,
	WishlistButton,
} from "@/domains/catalog";

import { useSellerProfileQuery } from "@/domains/seller";
import { useAddItemToCartMutation } from "@/domains/cart";
import { toast } from "react-toastify";

export default function ProductDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const addItemToCartMutation = useAddItemToCartMutation();
	const { data: product, isLoading, isError } = useProductByIdQuery(id);

	const [activeMedia, setActiveMedia] = useState<{
		type: "image" | "video";
		url: string;
	} | null>(null);

	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});
	const [selectedVariant, setSelectedVariant] = useState<any>(null);
	const [quantity, setQuantity] = useState(1);
	const [isFavorite, setIsFavorite] = useState(false);

	// Initial default main image
	const coverImageUrl = useMemo(() => {
		if (!product) return "";
		return (
			product.thumbnailUrl ||
			product.thumbnailUrl ||
			(product.imageUrls && product.imageUrls[0]) ||
			""
		);
	}, [product]);

	// Setup defaults
	useEffect(() => {
		if (product) {
			setActiveMedia({ type: "image", url: coverImageUrl });
			setSelectedOptions({});
			setSelectedVariant(null);
			setQuantity(1);
		}
	}, [product, coverImageUrl]);

	// Find Variant matching selected options
	useEffect(() => {
		if (!product?.variants?.length) return;

		if (!product.options?.length) {
			setSelectedVariant(product.variants[0]);
			return;
		}

		const totalOptions = product.options.length;
		const selectedCount = Object.keys(selectedOptions).length;

		if (selectedCount === totalOptions && totalOptions > 0) {
			const matched = product.variants.find((variant: any) => {
				return variant.variantOptions?.every((vo: any) => {
					const parentOption = product.options?.find((o: any) =>
						o.values?.some(
							(val: any) => val.id === vo.optionValueId,
						),
					);
					if (!parentOption) return false;
					return (
						selectedOptions[parentOption.id] === vo.optionValueId
					);
				});
			});
			setSelectedVariant(matched || null);
		} else {
			setSelectedVariant(null);
		}
	}, [selectedOptions, product]);

	// Calculate prices dynamically
	const priceCalculations = useMemo(() => {
		if (!product) {
			return {
				displayPrice: 0,
				displayDiscountPrice: 0,
				minPrice: 0,
				maxPrice: 0,
				minDiscountPrice: 0,
				maxDiscountPrice: 0,
				maxDiscountPercent: 0,
				hasMultiplePrices: false,
			};
		}

		let displayPrice = product.price || 0;
		let displayDiscountPrice = product.discountPrice || displayPrice;
		let minPrice = displayPrice;
		let maxPrice = displayPrice;
		let minDiscountPrice = displayDiscountPrice;
		let maxDiscountPrice = displayDiscountPrice;
		let maxDiscountPercent = 0;

		if (product.variants && product.variants.length > 0) {
			const prices = product.variants.map((v: any) => v.price || 0);
			const discountPrices = product.variants.map(
				(v: any) => v.discountPrice || v.price || 0,
			);

			minPrice = Math.min(...prices);
			maxPrice = Math.max(...prices);
			minDiscountPrice = Math.min(...discountPrices);
			maxDiscountPrice = Math.max(...discountPrices);

			const discountPercentages = product.variants.map((v: any) => {
				const orig = v.price || 0;
				const disc = v.discountPrice || orig;
				return orig > disc
					? Math.round(((orig - disc) / orig) * 100)
					: 0;
			});
			maxDiscountPercent = Math.max(...discountPercentages, 0);

			if (selectedVariant) {
				displayPrice = selectedVariant.price || 0;
				displayDiscountPrice =
					selectedVariant.discountPrice || selectedVariant.price || 0;
				if (displayPrice > displayDiscountPrice) {
					maxDiscountPercent = Math.round(
						((displayPrice - displayDiscountPrice) / displayPrice) *
						100,
					);
				} else {
					maxDiscountPercent = 0;
				}
			}
		}

		const hasMultiplePrices =
			minDiscountPrice !== maxDiscountPrice && !selectedVariant;

		return {
			displayPrice,
			displayDiscountPrice,
			minPrice,
			maxPrice,
			minDiscountPrice,
			maxDiscountPrice,
			maxDiscountPercent,
			hasMultiplePrices,
		};
	}, [product, selectedVariant]);

	// Stock status
	const totalStock = useMemo(() => {
		if (!product) return 0;
		if (product.variants && product.variants.length > 0) {
			return product.variants.reduce(
				(sum: number, v: any) => sum + (v.availableStock || 0),
				0,
			);
		}
		return product.availableStock || 0;
	}, [product]);

	const currentStock = selectedVariant
		? selectedVariant.availableStock
		: totalStock;

	// Handle Option Click with Toggle (Deselect) & Tier-1 Image update
	const handleOptionSelect = (
		optionId: string,
		valueId: string,
		tierIndex: number,
	) => {
		if (!product) return;

		setSelectedOptions((prev) => {
			const updated = { ...prev };

			if (updated[optionId] === valueId) {
				delete updated[optionId];
			} else {
				updated[optionId] = valueId;
			}

			if (Object.keys(updated).length === 0) {
				setActiveMedia({ type: "image", url: coverImageUrl });
			} else if (tierIndex === 0 && updated[optionId]) {
				const parentOption = product.options?.find(
					(o: any) => o.id === optionId,
				);
				const chosenVal = parentOption?.values?.find(
					(v: any) => v.id === valueId,
				);
				if (chosenVal?.imageUrl) {
					setActiveMedia({ type: "image", url: chosenVal.imageUrl });
				}
			}

			return updated;
		});
	};

	const handleAddToCart = () => {
		if (!product) return;
		if (product.options?.length > 0 && !selectedVariant) {
			toast.warning("Vui lòng chọn đầy đủ Phân loại sản phẩm!");
			return;
		}
		if (quantity > currentStock) {
			toast.warning(`Không thể mua quá số lượng tồn kho khả dụng (${currentStock})!`);
			return;
		}
		const targetId = selectedVariant?.id || (product.variants && product.variants[0]?.id) || product.id;
		if (!targetId) {
			toast.error("Không tìm thấy thông tin sản phẩm!");
			return;
		}
		addItemToCartMutation.mutate({
			variantId: targetId,
			quantity,
		});
	};

	const handleBuyNow = () => {
		if (!product) return;
		if (product.options?.length > 0 && !selectedVariant) {
			toast.warning("Vui lòng chọn đầy đủ Phân loại sản phẩm!");
			return;
		}
		if (quantity > currentStock) {
			toast.warning(`Không thể mua quá số lượng tồn kho khả dụng (${currentStock})!`);
			return;
		}
		const targetId = selectedVariant?.id || (product.variants && product.variants[0]?.id) || product.id;
		if (!targetId) {
			toast.error("Không tìm thấy thông tin sản phẩm!");
			return;
		}
		addItemToCartMutation.mutate(
			{
				variantId: targetId,
				quantity,
			},
			{
				onSuccess: () => {
					navigate("/cart");
				},
			}
		);
	};

	const { data: sellerProfile } = useSellerProfileQuery();

	const isOwnProduct = useMemo(() => {
		if (!product || !sellerProfile) return false;
		return sellerProfile.shops?.some((shop: any) => Number(shop.id) === Number(product.shopId));
	}, [product, sellerProfile]);

	// 1. CHẶN VĂNG LỖI KHI ĐANG LOADING
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-brand-muted text-xs">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin sản phẩm...
			</div>
		);
	}

	// 2. CHẶN VĂNG LỖI KHI BỊ LỖI KẾT NỐI MÁY CHỦ HOẶC KHÔNG TÌM THẤY PRODUCT
	if (isError || !product) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
				<h2 className="text-xl font-bold text-red-600">
					Lỗi tải sản phẩm
				</h2>
				<p className="text-xs text-brand-muted">
					Không tìm thấy sản phẩm này hoặc có lỗi kết nối đến máy chủ.
				</p>
				<Link
					to="/"
					className="inline-block px-5 py-2 bg-brand-primary text-brand-dark rounded text-xs font-bold"
				>
					Quay lại Trang Chủ
				</Link>
			</div>
		);
	}

	// Sau bước này product chắc chắn tồn tại (Non-null Assertion)
	return (
		<div className="max-w-5xl mx-auto px-2 md:px-4 py-4 text-left font-sans">
			{/* Breadcrumbs */}
			<div className="flex items-center gap-1.5 text-xs text-brand-muted font-medium mb-4">
				<Link
					to="/"
					className="hover:text-brand-primary transition-colors"
				>
					Trang chủ
				</Link>
				<ChevronRight className="w-3.5 h-3.5" />
				{product.parentCategoryName && (
					<>
						<span className="hover:text-brand-primary transition-colors cursor-pointer">
							{product.parentCategoryName}
						</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</>
				)}
				{product.categoryName && (
					<>
						<span className="hover:text-brand-primary transition-colors cursor-pointer">
							{product.categoryName}
						</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</>
				)}
				<span className="text-brand-dark font-semibold truncate max-w-xs">
					{product.name}
				</span>
			</div>

			{/* Main Product Box */}
			<div className="bg-white rounded-2xl border border-brand-border shadow-sm p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				{/* Left Column: Gallery */}
				<ProductGallery
					product={product}
					activeMedia={activeMedia}
					setActiveMedia={setActiveMedia}
				/>

				{/* Right Column: Information & Controls */}
				<div className="flex flex-col justify-between text-left space-y-4">
					<div className="space-y-4">
						{/* Title */}
						<h1 className="text-lg md:text-xl font-black text-brand-dark leading-tight select-text">
							{product.name}
						</h1>

						{/* Ratings & Sales Metadata */}
						<div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-muted">
							<div className="flex items-center gap-1">
								<span className="text-brand-dark font-extrabold border-b border-brand-primary text-sm">
									{product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
								</span>
								<div className="flex gap-0.5 text-brand-primary">
									{Array.from({ length: 5 }).map((_, idx) => (
										<Star
											key={idx}
											className={`w-3.5 h-3.5 ${
												idx < Math.round(product.averageRating || 0)
													? "fill-brand-primary stroke-brand-primary"
													: "text-gray-300 stroke-gray-300"
											}`}
										/>
									))}
								</div>
							</div>
							<div className="w-[1px] h-3.5 bg-brand-border" />
							<div>
								<span className="text-brand-dark font-extrabold">
									{product.reviewCount || 0}
								</span>{" "}
								Đánh giá
							</div>
							<div className="w-[1px] h-3.5 bg-brand-border" />
							<div>
								<span className="text-brand-dark font-extrabold">
									{product.soldCount || 0}
								</span>{" "}
								Đã bán
							</div>
						</div>

						{/* Price Block Sub-component */}
						<ProductPrice priceCalculations={priceCalculations} />

						{/* Shipping Specs */}
						{((product.weight && product.weight > 0) ||
							(product.width && product.width > 0)) && (
							<div className="space-y-2 text-xs border-y border-brand-border/60 py-3">
								<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brand-muted font-medium">
									{product.weight > 0 && (
										<span>
											Cân nặng:{" "}
											<strong className="text-brand-dark">
												{product.weight}g
											</strong>
										</span>
									)}
									{product.width > 0 && (
										<span>
											Kích thước:{" "}
											<strong className="text-brand-dark">
												{product.width} x{" "}
												{product.length} x{" "}
												{product.height} cm
											</strong>
										</span>
									)}
								</div>
							</div>
						)}

						{/* Product Options Selector Sub-component */}
						{product.options && product.options.length > 0 && (
							<ProductOptions
								options={product.options}
								variants={product.variants}
								selectedOptions={selectedOptions}
								onOptionSelect={handleOptionSelect}
							/>
						)}

						<QuantitySelector
							quantity={quantity}
							setQuantity={setQuantity}
							currentStock={currentStock}
						/>
					</div>

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-3 pt-3 border-t border-brand-border/60">
						{(() => {
							const parseJwt = (token: string) => {
								try {
									const base64Url = token.split(".")[1];
									const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
									const jsonPayload = decodeURIComponent(
										window
											.atob(base64)
											.split("")
											.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
											.join(""),
									);
									return JSON.parse(jsonPayload);
								} catch {
									return null;
								}
							};
							const checkIsAdmin = () => {
								const token = localStorage.getItem("accessToken");
								if (!token) return false;
								const payload = parseJwt(token);
								if (!payload) return false;
								const roles = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
								if (Array.isArray(roles)) {
									return roles.includes("Admin") || roles.includes("admin");
								}
								return roles === "Admin" || roles === "admin" || payload.email === "admin@system.com";
							};

							if (checkIsAdmin()) {
								return (
									<div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold">
										Tài khoản quản trị viên đang trong chế độ quan sát sản phẩm. Không thể mua hàng.
									</div>
								);
							}

							if (isOwnProduct) {
								return (
									<Link
										to={`/seller/${product.shopId}/dashboard/products/edit/${product.id}`}
										className="h-10 px-6 bg-brand-dark hover:bg-black text-brand-primary rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-brand-border"
									>
										<Edit className="w-4 h-4" />
										Chỉnh sửa sản phẩm của bạn
									</Link>
								);
							}

							return (
								<>
									<button
										type="button"
										onClick={handleAddToCart}
										className="h-10 px-4 border border-brand-primary text-brand-primary-deep bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
									>
										<ShoppingBag className="w-4 h-4" />
										Thêm vào giỏ hàng
									</button>
									<button
										type="button"
										onClick={handleBuyNow}
										className="h-10 px-6 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg text-xs font-extrabold transition-all cursor-pointer"
									>
										Mua ngay
									</button>
									<WishlistButton productId={product.id} className="p-2 rounded-lg border border-brand-border" />

								</>
							);
						})()}
					</div>
				</div>
			</div>

			{/* Shop Information Card */}
			<div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
				<div className="flex items-center gap-4">
					<div
						onClick={() => navigate(`/shops/${product.shopId}`)}
						className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shrink-0 cursor-pointer hover:opacity-80 transition-all"
					>
						<Store className="w-8 h-8 text-brand-primary-deep" />
					</div>
					<div>
						<h3
							onClick={() => navigate(`/shops/${product.shopId}`)}
							className="font-black text-brand-dark text-sm cursor-pointer hover:underline"
						>
							{product.shopName || `Cửa hàng #${product.shopId}`}
						</h3>
						{product.shopAddress && (
							<p className="text-[10px] text-brand-muted mt-0.5 font-semibold">
								Địa chỉ: <span className="text-brand-dark">{product.shopAddress}</span>
							</p>
						)}
						{product.shopPhone && (
							<p className="text-[10px] text-brand-muted mt-0.5 font-semibold">
								Hotline: <span className="text-brand-dark">{product.shopPhone}</span>
							</p>
						)}
						<div className="flex items-center gap-4 mt-2 text-[10px] text-brand-muted font-bold">
							<span>Phản hồi chat: <strong className="text-brand-dark">99% (Rất Nhanh)</strong></span>
							<span className="w-1.5 h-1.5 rounded-full bg-brand-border" />
							<span>Người nhận: <strong className="text-brand-dark">{product.shopRecipient || "Đại diện Shop"}</strong></span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2.5 w-full md:w-auto">
					{isOwnProduct ? (
						<Link
							to={`/seller/${product.shopId}/dashboard`}
							className="flex-1 md:flex-initial h-9 px-4 border border-brand-dark text-white bg-brand-dark hover:bg-black rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
						>
							Bảng điều khiển
						</Link>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									const storeName = product.shopName || `Shop #${product.shopId}`;
									window.dispatchEvent(
										new CustomEvent("open-shop-chat", {
											detail: {
												shopId: Number(product.shopId),
												shopName: storeName,
											},
										})
									);
								}}
								className="flex-1 md:flex-initial h-9 px-4 border border-brand-primary text-brand-primary-deep bg-brand-primary/10 hover:bg-brand-primary/20 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
							>
								<MessageCircle className="w-4 h-4" />
								Chat với Người Bán
							</button>
							<Link
								to={`/shops/${product.shopId}`}
								className="flex-1 md:flex-initial h-9 px-4 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-xl text-xs font-black transition-all flex items-center justify-center"
							>
								Xem Cửa Hàng
							</Link>
						</>
					)}
				</div>
			</div>

			{/* Description Section */}
			<ProductDescription description={product.description} />

			{/* Ratings & Reviews System */}
			<ProductReviewsSection productId={product.id} />

			{/* Related Products Grid */}
			<RelatedProducts
				categoryId={product.categoryId}
				currentProductId={product.id}
			/>
		</div>
	);
}
