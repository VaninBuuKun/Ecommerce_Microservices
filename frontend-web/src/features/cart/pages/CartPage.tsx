import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
	ShoppingCart,
	ArrowLeft,
	ArrowRight,
	Trash2,
	Plus,
	Minus,
	CheckSquare,
	Square,
	Loader2,
	Trash,
	Store,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUpdateQuantityMutation } from "../hooks/useUpdateQuantityMutation";
import { useRemoveItemMutation } from "../hooks/useRemoveItemMutation";
import { useUpdateSelectStateMutation } from "../hooks/useUpdateSelectStateMutation";
import { useClearCartMutation } from "../hooks/useClearCartMutation";
import { useCartQuery } from "../hooks/useCartQuery";

export default function CartPage() {
	const navigate = useNavigate();
	const { data: cart, isLoading, isError } = useCartQuery();

	const updateQuantityMutation = useUpdateQuantityMutation();
	const removeItemMutation = useRemoveItemMutation();
	const updateSelectStateMutation = useUpdateSelectStateMutation();
	const clearCartMutation = useClearCartMutation();

	// Local quantities state to debounce server sync
	const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
	const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	// Synchronize local quantities when cart query updates
	useEffect(() => {
		if (cart?.shopGroups) {
			const items = cart.shopGroups.flatMap((group) => group.items || []);
			setLocalQuantities((prev) => {
				const next = { ...prev };
				items.forEach((item) => {
					// Only update if there is no active debounce running for the item
					if (debounceTimers.current[item.productVariantId] === undefined) {
						next[item.productVariantId] = item.quantity;
					}
				});
				return next;
			});
		}
	}, [cart]);

	// Clean up timers on unmount
	useEffect(() => {
		return () => {
			Object.values(debounceTimers.current).forEach(clearTimeout);
		};
	}, []);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-brand-muted text-xs">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải giỏ hàng của bạn...
			</div>
		);
	}

	if (isError || !cart) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
				<h2 className="text-xl font-bold text-red-600">Lỗi tải giỏ hàng</h2>
				<p className="text-xs text-brand-muted">
					Không thể kết nối đến máy chủ. Vui lòng tải lại trang.
				</p>
				<button
					onClick={() => window.location.reload()}
					className="px-5 py-2 bg-brand-primary text-brand-dark rounded text-xs font-bold border-none cursor-pointer"
				>
					Tải lại trang
				</button>
			</div>
		);
	}

	const shopGroups = cart.shopGroups || [];
	const allItems = shopGroups.flatMap((group) => group.items || []);
	const selectedItems = allItems.filter((item) => item.isSelected);
	const allSelected = allItems.length > 0 && allItems.every((item) => item.isSelected);

	// Compute subtotal using the local quantities to make checkout summary instantly reactive
	const subTotal = selectedItems.reduce(
		(sum, item) => sum + item.unitPrice * (localQuantities[item.productVariantId] ?? item.quantity),
		0,
	);

	const handleQuantityChange = (productVariantId: string, currentQty: number, change: number, maxStock: number) => {
		const targetQty = (localQuantities[productVariantId] ?? currentQty) + change;

		// 1. Giới hạn không vượt quá availableStocks
		if (targetQty > maxStock) {
			toast.warning(`Chỉ còn tối đa ${maxStock} sản phẩm trong kho!`);
			return;
		}

		// 2. Không cho giảm xuống dưới 1, đề xuất xóa
		if (targetQty < 1) {
			if (window.confirm("Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?")) {
				removeItemMutation.mutate(productVariantId);
				setLocalQuantities((prev) => {
					const next = { ...prev };
					delete next[productVariantId];
					return next;
				});
			}
			return;
		}

		// 3. Cập nhật local state ngay lập tức
		setLocalQuantities((prev) => ({
			...prev,
			[productVariantId]: targetQty,
		}));

		// 4. Debounce 300ms gọi API
		if (debounceTimers.current[productVariantId]) {
			clearTimeout(debounceTimers.current[productVariantId]);
		}

		debounceTimers.current[productVariantId] = setTimeout(() => {
			updateQuantityMutation.mutate({ productId: productVariantId, quantity: targetQty });
			delete debounceTimers.current[productVariantId];
		}, 300);
	};

	const handleToggleSelect = (variantId: string, currentSelected: boolean) => {
		updateSelectStateMutation.mutate({ variantId, isSelected: !currentSelected });
	};

	const handleToggleAll = () => {
		const targetState = !allSelected;
		allItems.forEach((item) => {
			if (item.isSelected !== targetState) {
				updateSelectStateMutation.mutate({ variantId: item.productVariantId, isSelected: targetState });
			}
		});
	};

	const handleClearCart = () => {
		if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
			clearCartMutation.mutate();
		}
	};

	return (
		<div className="py-10 px-4 md:px-6 max-w-5xl mx-auto w-full select-none text-left font-sans">
			{/* Breadcrumbs / Back button */}
			<div className="flex items-center gap-2 mb-6">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary transition-colors font-medium"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Tiếp tục mua sắm
				</Link>
			</div>

			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
				<h1 className="text-2xl font-black text-brand-dark flex items-center gap-2.5">
					<ShoppingCart className="w-6 h-6 text-brand-primary" />
					Giỏ hàng của bạn
					<span className="text-xs font-bold text-brand-muted bg-brand-border/40 px-2 py-0.5 rounded-full">
						{allItems.length} sản phẩm
					</span>
				</h1>

				{allItems.length > 0 && (
					<button
						onClick={handleClearCart}
						className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer font-bold transition-colors"
					>
						<Trash className="w-3.5 h-3.5" />
						Xóa tất cả
					</button>
				)}
			</div>

			{allItems.length === 0 ? (
				<div className="bg-white border border-brand-border rounded-2xl p-16 text-center space-y-5 max-w-md mx-auto">
					<div className="w-16 h-16 bg-brand-light-soft rounded-full flex items-center justify-center mx-auto text-brand-muted">
						<ShoppingCart className="w-8 h-8" />
					</div>
					<div className="space-y-1">
						<h3 className="font-bold text-brand-dark text-base">Giỏ hàng trống</h3>
						<p className="text-xs text-brand-muted leading-relaxed">
							Bạn chưa thêm sản phẩm nào vào giỏ hàng của mình. Khám phá các ưu đãi hot ngay hôm nay!
						</p>
					</div>
					<Link
						to="/"
						className="inline-flex items-center justify-center h-9 px-6 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-xs rounded-lg transition-colors"
					>
						Mua sắm ngay
					</Link>
				</div>
			) : (
				<div className="flex flex-col lg:flex-row gap-6 items-start">
					{/* Left Side: Items List Grouped by Shop */}
					<div className="flex-1 w-full space-y-4">
						{/* Bulk Action Header */}
						<div className="flex items-center justify-between p-3.5 bg-white border border-brand-border rounded-xl">
							<button
								onClick={handleToggleAll}
								className="flex items-center gap-2 text-xs font-bold text-brand-dark border-none bg-transparent cursor-pointer"
							>
								{allSelected ? (
									<CheckSquare className="w-4 h-4 text-brand-primary" />
								) : (
									<Square className="w-4 h-4 text-brand-muted" />
								)}
								Chọn tất cả ({allItems.length} sản phẩm)
							</button>

							<span className="text-[11px] font-bold text-brand-muted">
								Đã chọn: {selectedItems.length}
							</span>
						</div>

						{/* Shop groups */}
						<div className="space-y-5">
							{shopGroups.map((group) => (
								<div
									key={group.shopId}
									className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm"
								>
									{/* Shop Name Header */}
									<div className="flex items-center gap-2 px-4 py-3 bg-brand-light-soft/20 border-b border-brand-border">
										<Store className="w-4 h-4 text-brand-primary" />
										<span className="font-extrabold text-xs text-brand-dark">
											{group.shopName || `Shop #${group.shopId}`}
										</span>
									</div>

									{/* Group items */}
									<div className="divide-y divide-brand-border/60">
										{group.items.map((item) => (
											<div
												key={item.productVariantId}
												className={`flex items-start gap-3 p-4 bg-white transition-all ${item.isSelected ? "bg-brand-primary/5" : ""
													}`}
											>
												{/* Selection Checkbox */}
												<button
													onClick={() => handleToggleSelect(item.productVariantId, item.isSelected)}
													className="mt-4 border-none bg-transparent cursor-pointer p-0 text-brand-dark flex-shrink-0"
												>
													{item.isSelected ? (
														<CheckSquare className="w-4 h-4 text-brand-primary" />
													) : (
														<Square className="w-4 h-4 text-brand-muted" />
													)}
												</button>

												{/* Product Thumbnail */}
												<img
													src={item.thumbnailUrl}
													alt={item.productName}
													className="w-16 h-16 object-cover rounded-lg border border-brand-border flex-shrink-0"
												/>

												{/* Details */}
												<div className="flex-1 min-w-0 space-y-1.5">
													<div className="space-y-0.5 text-left">
														<h3 className="font-extrabold text-brand-dark text-xs truncate hover:text-brand-primary transition-colors">
															{item.productName}
														</h3>
														{item.variantName && (
															<span className="inline-block text-[10px] font-bold text-brand-muted bg-brand-light-soft px-1.5 py-0.5 rounded-sm">
																Phân loại: {item.variantName}
															</span>
														)}
													</div>

													{/* Price Display */}
													<div className="flex items-baseline gap-1.5">
														<span className="font-extrabold text-brand-dark text-xs">
															{item.unitPrice.toLocaleString("vi-VN")}đ
														</span>
													</div>
												</div>

												{/* Quantity and Delete Controls */}
												<div className="flex flex-col items-end justify-between self-stretch pl-2">
													<button
														onClick={() => removeItemMutation.mutate(item.productVariantId)}
														className="p-1 text-brand-muted hover:text-red-500 rounded bg-transparent border-none cursor-pointer transition-colors"
														title="Xóa sản phẩm"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>

													<div className="flex items-center border border-brand-border rounded-lg overflow-hidden h-7 bg-brand-light-soft/30">
														<button
															onClick={() => handleQuantityChange(item.productVariantId, item.quantity, -1, item.availableStocks)}
															className="px-2 h-full flex items-center justify-center border-none bg-transparent hover:bg-brand-border/20 cursor-pointer text-brand-muted transition-colors"
														>
															<Minus className="w-2.5 h-2.5" />
														</button>
														<span className="w-8 text-center text-xs font-bold text-brand-dark">
															{localQuantities[item.productVariantId] ?? item.quantity}
														</span>
														<button
															onClick={() => handleQuantityChange(item.productVariantId, item.quantity, 1, item.availableStocks)}
															className="px-2 h-full flex items-center justify-center border-none bg-transparent hover:bg-brand-border/20 cursor-pointer text-brand-muted transition-colors"
															disabled={(localQuantities[item.productVariantId] ?? item.quantity) >= item.availableStocks}
														>
															<Plus className="w-2.5 h-2.5" />
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right Side: Order Summary Card */}
					<div className="w-full lg:w-80 p-5 bg-white border border-brand-border rounded-xl space-y-5 lg:sticky lg:top-24">
						<h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider pb-3 border-b border-brand-border">
							Chi tiết thanh toán
						</h2>

						<div className="space-y-3.5 text-xs font-semibold text-brand-muted">
							<div className="flex justify-between">
								<span>Tạm tính ({selectedItems.length} sản phẩm)</span>
								<span className="text-brand-dark font-bold">
									{subTotal.toLocaleString("vi-VN")}đ
								</span>
							</div>
							<div className="flex justify-between">
								<span>Phí giao hàng</span>
								<span className="text-green-600 font-bold">Miễn phí</span>
							</div>
						</div>

						<div className="border-t border-brand-border pt-4 flex justify-between font-black text-brand-dark">
							<span className="text-xs uppercase tracking-wider">Tổng thanh toán</span>
							<span className="text-brand-primary-deep text-lg">
								{subTotal.toLocaleString("vi-VN")}đ
							</span>
						</div>

						<button
							disabled={selectedItems.length === 0}
							onClick={() => navigate("/checkout")}
							className="w-full h-10 inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-deep disabled:opacity-50 disabled:cursor-not-allowed text-brand-dark font-extrabold rounded-lg transition-colors border-none cursor-pointer text-xs"
						>
							Tiến hành đặt hàng
							<ArrowRight className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
