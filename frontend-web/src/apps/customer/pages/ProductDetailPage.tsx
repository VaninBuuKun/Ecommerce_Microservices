import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
	PackageX,
	EyeOff,
	AlertCircle,
	Compass,
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
	ProductImageModal,
} from "@/domains/catalog";

import { useSellerProfileQuery, usePublicShopQuery } from "@/domains/seller";
import { useAddItemToCartMutation, useBuyNowOrReorder } from "@/domains/cart";
import { useChatStore } from "@/domains/notification";
import { useAuthStore, useAuthModalStore } from "@/domains/auth";
import { CommentOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

export default function ProductDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const addItemToCartMutation = useAddItemToCartMutation();
	const { openChatWithShop } = useChatStore();
	const accessToken = useAuthStore((s) => s.accessToken);
	const { openAuthModal } = useAuthModalStore();
	const { data: product, isLoading, isError } = useProductByIdQuery(id);
	const { data: shop } = usePublicShopQuery(product?.shopId ? Number(product.shopId) : undefined);

	const fullShopAddress = useMemo(() => {
		if (shop) {
			const parts = [
				shop.addressLine,
				shop.ward,
				shop.district,
				shop.province,
			].filter(Boolean);
			if (parts.length > 0) return parts.join(", ");
		}
		if (product?.shopAddress) return product.shopAddress;
		return "Chưa cập nhật";
	}, [shop, product?.shopAddress]);

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
			(product.imageUrls && product.imageUrls[0]) ||
			""
		);
	}, [product]);

	// Danh sách ảnh cho ProductImageModal (Thumbnail luôn ở đầu)
	const modalImages = useMemo(() => {
		if (!product) return [];
		const list: { url: string; label: string; isThumbnail?: boolean }[] = [];
		const seenUrls = new Set<string>();

		if (product.thumbnailUrl) {
			list.push({
				url: product.thumbnailUrl,
				label: "Ảnh đại diện",
				isThumbnail: true,
			});
			seenUrls.add(product.thumbnailUrl);
		}

		if (product.imageUrls && Array.isArray(product.imageUrls)) {
			product.imageUrls.forEach((url, idx) => {
				if (url && !seenUrls.has(url)) {
					list.push({
						url,
						label: `Ảnh chi tiết ${idx + 1}`,
					});
					seenUrls.add(url);
				}
			});
		}

		if (product.options && Array.isArray(product.options)) {
			product.options.forEach((opt: any) => {
				if (opt.values && Array.isArray(opt.values)) {
					opt.values.forEach((val: any) => {
						if (val.imageUrl && !seenUrls.has(val.imageUrl)) {
							list.push({
								url: val.imageUrl,
								label: `${opt.name || "Phân loại"}: ${val.value || ""}`,
							});
							seenUrls.add(val.imageUrl);
						}
					});
				}
			});
		}

		return list;
	}, [product]);

	const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
	const [imageViewerIndex, setImageViewerIndex] = useState(0);

	const handleOpenImageViewer = (targetIdx?: number) => {
		if (modalImages.length === 0) return;
		let index = 0;
		if (typeof targetIdx === "number" && targetIdx >= 0) {
			index = Math.min(targetIdx, modalImages.length - 1);
		} else if (activeMedia?.url) {
			const found = modalImages.findIndex((img) => img.url === activeMedia.url);
			if (found !== -1) index = found;
		}
		setImageViewerIndex(index);
		setIsImageViewerOpen(true);
	};

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
		if (!product || !product.variants || product.variants.length === 0) {
			setSelectedVariant(null);
			return;
		}

		const numSelected = Object.keys(selectedOptions).length;
		const totalOptions = product.options?.length || 0;

		if (numSelected !== totalOptions) {
			setSelectedVariant(null);
			return;
		}

		const matched = product.variants.find((variant: any) => {
			return variant.variantOptions?.every((vo: any) => {
				const valObj = product.options
					?.flatMap((o: any) => o.values)
					.find((v: any) => String(v.id) === String(vo.optionValueId));

				if (!valObj) return false;

				const parentOpt = product.options?.find((o: any) =>
					o.values.some((v: any) => String(v.id) === String(valObj.id)),
				);

				return parentOpt
					? selectedOptions[String(parentOpt.id)] === String(valObj.id)
					: false;
			});
		});

		setSelectedVariant(matched || null);
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
					(o: any) => String(o.id) === String(optionId),
				);
				const chosenVal = parentOption?.values?.find(
					(v: any) => String(v.id) === String(valueId),
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
		if (!accessToken) {
			openAuthModal({
				title: "Thêm vào giỏ hàng",
				description: "Vui lòng đăng nhập tài khoản để thêm sản phẩm vào giỏ hàng và thanh toán.",
			});
			return;
		}
		const hasOptions = Boolean(product.options && product.options.length > 0);
		if (hasOptions && !selectedVariant) {
			toast.warning("Vui lòng chọn đầy đủ Phân loại sản phẩm!");
			return;
		}
		if (quantity > currentStock) {
			toast.warning(`Không thể mua quá số lượng tồn kho khả dụng (${currentStock})!`);
			return;
		}
		const activeVariant = hasOptions ? selectedVariant : (product.variants?.[0] || null);
		const variantId = activeVariant ? String(activeVariant.id) : "";

		if (!variantId) {
			toast.warning("Vui lòng chọn phân loại sản phẩm hợp lệ!");
			return;
		}

		addItemToCartMutation.mutate(
			{
				variantId,
				quantity,
			},
			{
				onSuccess: () => {
					toast.success("Đã thêm sản phẩm vào giỏ hàng!");
				},
				onError: (err: any) => {
					const msg = err.response?.data?.message || err.response?.data || "Không thể thêm sản phẩm vào giỏ hàng";
					toast.error(msg);
				},
			}
		);
	};

	const { buyNowOrReorder } = useBuyNowOrReorder();
	const [isBuyingNow, setIsBuyingNow] = useState(false);

	const handleBuyNow = async () => {
		if (!product) return;
		if (!accessToken) {
			openAuthModal({
				title: "Mua hàng ngay",
				description: "Vui lòng đăng nhập tài khoản để tiến hành đặt mua sản phẩm.",
			});
			return;
		}
		const hasOptions = Boolean(product.options && product.options.length > 0);
		if (hasOptions && !selectedVariant) {
			toast.warning("Vui lòng chọn đầy đủ Phân loại sản phẩm!");
			return;
		}
		if (quantity > currentStock) {
			toast.warning(`Không thể mua quá số lượng tồn kho khả dụng (${currentStock})!`);
			return;
		}
		const activeVariant = hasOptions ? selectedVariant : (product.variants?.[0] || null);
		const variantId = activeVariant ? String(activeVariant.id) : "";

		if (!variantId) {
			toast.warning("Vui lòng chọn phân loại sản phẩm hợp lệ!");
			return;
		}

		try {
			setIsBuyingNow(true);
			await buyNowOrReorder({
				variantIds: [variantId],
			});
			navigate("/cart");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Không thể xử lý đơn hàng";
			toast.error(msg);
		} finally {
			setIsBuyingNow(false);
		}
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

	// 2. CHẶN VĂNG LỖI KHI BỊ LỖI KẾT NỐI MÁY CHỦ HOẶC KHÔNG TÌM THẤY PRODUCT (ĐÃ BỊ XÓA)
	if (isError || !product) {
		return createPortal(
			<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] font-sans">
				<div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
					<div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
						<PackageX className="w-8 h-8" />
					</div>
					<div className="space-y-1.5">
						<h2 className="text-lg font-bold text-slate-900 tracking-tight">
							Sản phẩm không tồn tại
						</h2>
						<p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
							Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã được Người bán gỡ bỏ vĩnh viễn khỏi hệ thống BuuStore.
						</p>
					</div>
					<div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
						<button
							type="button"
							onClick={() => navigate("/explore")}
							className="px-5 py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border-none flex items-center justify-center gap-1.5"
						>
							<Compass className="w-4 h-4" />
							Khám phá sản phẩm khác
						</button>
						<button
							type="button"
							onClick={() => navigate("/")}
							className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
						>
							Về trang chủ
						</button>
					</div>
				</div>
			</div>,
			document.body
		);
	}

	// 3. SẢN PHẨM BỊ ẨN / TẠM NGỪNG KINH DOANH VÀ NGƯỜI XEM KHÔNG PHẢI CHỦ SHOP
	const isInactive = product.status === "Inactive" || String(product.status) === "2";
	if (isInactive && !isOwnProduct) {
		return createPortal(
			<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10000] font-sans">
				<div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
					<div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
						<EyeOff className="w-8 h-8" />
					</div>
					<div className="space-y-1.5">
						<h2 className="text-lg font-bold text-slate-900 tracking-tight">
							Sản phẩm tạm ngừng kinh doanh
						</h2>
						<p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
							Sản phẩm <strong>"{product.name}"</strong> hiện đang được Người bán tạm ẩn hoặc tạm ngừng kinh doanh, hiện tại không còn hỗ trợ đặt hàng.
						</p>
					</div>
					<div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
						{product.shopId && (
							<button
								type="button"
								onClick={() => navigate(`/shops/${product.shopId}`)}
								className="px-4 py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border-none flex items-center justify-center gap-1.5"
							>
								<Store className="w-4 h-4" />
								Ghé thăm cửa hàng
							</button>
						)}
						<button
							type="button"
							onClick={() => navigate("/explore")}
							className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5"
						>
							<Compass className="w-4 h-4" />
							Xem sản phẩm khác
						</button>
					</div>
				</div>
			</div>,
			document.body
		);
	}

	// Sau bước này product chắc chắn tồn tại (Non-null Assertion)
	return (
		<div className="max-w-5xl mx-auto px-2 md:px-4 py-4 text-left font-sans">
			{/* Banner cảnh báo dành riêng cho Người bán khi sản phẩm đang bị Ẩn */}
			{isInactive && isOwnProduct && (
				<div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
					<div className="flex items-start sm:items-center gap-2.5">
						<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
						<div>
							<p className="font-bold text-slate-900">
								Sản phẩm này hiện đang BỊ ẨN đối với người mua
							</p>
							<p className="text-amber-800 text-[11px] leading-relaxed">
								Người mua sẽ nhận được thông báo tạm ngừng kinh doanh và không thể đặt hàng. Bạn có thể bật lại trạng thái Hoạt động trong Kênh Người Bán.
							</p>
						</div>
					</div>
					<Link
						to={`/seller/${product.shopId}/dashboard/products`}
						className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
					>
						<Store className="w-3.5 h-3.5" />
						Quản lý sản phẩm
					</Link>
				</div>
			)}

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
						<span
							onClick={() => {
								const pId = product.parentCategoryId || "";
								navigate(`/explore?parentCategoryId=${pId}`);
							}}
							className="hover:text-brand-primary transition-colors cursor-pointer"
						>
							{product.parentCategoryName}
						</span>
						<ChevronRight className="w-3.5 h-3.5" />
					</>
				)}
				{product.categoryName && (
					<>
						<span
							onClick={() => {
								const pId = product.parentCategoryId ? `parentCategoryId=${product.parentCategoryId}&` : "";
								const cId = product.categoryId || "";
								navigate(`/explore?${pId}subCategoryId=${cId}`);
							}}
							className="hover:text-brand-primary transition-colors cursor-pointer"
						>
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
			<div className="bg-white rounded-md border border-brand-border shadow-sm p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				{/* Left Column: Gallery */}
				<ProductGallery
					product={product}
					activeMedia={activeMedia}
					setActiveMedia={setActiveMedia}
					onOpenImageViewer={handleOpenImageViewer}
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
									{product.sold || product.soldCount || 0}
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
											Khối lượng:{" "}
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
									<div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-bold">
										Tài khoản quản trị viên đang trong chế độ quan sát sản phẩm. Không thể mua hàng.
									</div>
								);
							}

							if (isOwnProduct) {
								return (
									<Link
										to={`/seller/${product.shopId}/dashboard/products/edit/${product.id}`}
										className="h-10 px-6 bg-brand-dark hover:bg-black text-brand-primary rounded-md text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-brand-border"
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
										className="h-10 px-4 border border-brand-primary text-brand-primary-deep bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
									>
										<ShoppingBag className="w-4 h-4" />
										Thêm vào giỏ hàng
									</button>
									<button
										type="button"
										onClick={handleBuyNow}
										className="h-10 px-6 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-md text-xs font-extrabold transition-all cursor-pointer"
									>
										Mua ngay
									</button>
									<WishlistButton productId={product.id} className="p-2 rounded-md border border-brand-border" />

								</>
							);
						})()}
					</div>
				</div>
			</div>

			{/* Shop Information Card */}
			<div className="bg-white rounded-md border border-brand-border shadow-sm p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
				<div className="flex items-center gap-4">
					<div
						onClick={() => navigate(`/shops/${product.shopId}`)}
						className="w-16 h-16 rounded-md overflow-hidden bg-brand-light-soft border border-brand-border shrink-0 flex items-center justify-center cursor-pointer hover:opacity-85 transition-all shadow-2xs"
					>
						{shop?.logoUrl ? (
							<img src={shop.logoUrl} alt={shop.name || product.shopName} className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full flex items-center justify-center font-black text-brand-primary-deep text-xl uppercase bg-brand-primary/10">
								{(product.shopName || "S").charAt(0)}
							</div>
						)}
					</div>
					<div>
						<h3
							onClick={() => navigate(`/shops/${product.shopId}`)}
							className="font-black text-brand-dark text-sm cursor-pointer hover:underline"
						>
							{shop?.name || product.shopName || `Cửa hàng #${product.shopId}`}
						</h3>
						<p className="text-[11px] text-brand-muted mt-1 font-semibold">
							Địa chỉ: <span className="text-brand-dark font-medium">{fullShopAddress}</span>
						</p>
						<p className="text-[11px] text-brand-muted mt-0.5 font-semibold">
							Số điện thoại liên hệ: <span className="text-brand-dark font-bold">{shop?.phone || product.shopPhone || "Chưa cập nhật"}</span>
						</p>
						<div className="flex items-center gap-2 mt-2 text-[11px] text-brand-muted font-bold">
							<span>Người đại diện: <strong className="text-brand-dark">{shop?.recipientName || product.shopRecipient || "Đại diện Shop"}</strong></span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2.5 w-full md:w-auto">
					{isOwnProduct ? (
						<Link
							to={`/seller/${product.shopId}/dashboard`}
							className="flex-1 md:flex-initial h-9 px-4 border border-brand-dark text-white bg-brand-dark hover:bg-black rounded-md text-xs font-black transition-all flex items-center justify-center gap-1.5"
						>
							Bảng điều khiển
						</Link>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									if (!accessToken) {
										openAuthModal({
											title: "Trò chuyện với người bán",
											description: "Vui lòng đăng nhập tài khoản để kết nối và nhắn tin trực tiếp với cửa hàng.",
										});
										return;
									}
									const storeName = shop?.name || product.shopName || `Shop #${product.shopId}`;
									const storeAvatar = shop?.logoUrl || "";
									openChatWithShop(Number(product.shopId), storeName, storeAvatar);
								}}
								className="flex-1 md:flex-initial h-9 px-4 border border-brand-primary text-brand-primary-deep bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
							>
								<CommentOutlined className="text-sm" />
								Chat với Người Bán
							</button>
							<Link
								to={`/shops/${product.shopId}`}
								className="flex-1 md:flex-initial h-9 px-4 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-xs font-black transition-all flex items-center justify-center"
							>
								Xem Cửa Hàng
							</Link>
						</>
					)}
				</div>
			</div>

			{/* Description Section */}
			<ProductDescription description={product.description} attributesJson={product.attributesJson} />

			{/* Ratings & Reviews System */}
			<ProductReviewsSection productId={product.id} />

			{/* Related Products Grid */}
			<RelatedProducts
				categoryId={product.categoryId}
				currentProductId={product.id}
			/>

			{/* Custom Product Image Viewer Modal */}
			<ProductImageModal
				isOpen={isImageViewerOpen}
				onClose={() => setIsImageViewerOpen(false)}
				productTitle={product.name}
				images={modalImages}
				initialIndex={imageViewerIndex}
				onSelectImage={(item) => {
					setActiveMedia({ type: "image", url: item.url });
				}}
			/>
		</div>
	);
}
