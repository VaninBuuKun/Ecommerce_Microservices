import { Store, Ticket, X } from "lucide-react";

interface OrderItemsListProps {
	shopGroups: any[];
	calcResult: any;
	shopVouchers: Record<number, string>;
	setActiveShopVoucherModal: (shopId: number | null) => void;
	handleRemoveShopVoucher: (shopId: number) => void;
}

export function OrderItemsList({
	shopGroups,
	calcResult,
	shopVouchers,
	setActiveShopVoucherModal,
	handleRemoveShopVoucher,
}: OrderItemsListProps) {
	return (
		<div className="space-y-3.5 font-sans text-left">
			{shopGroups.map((group) => {
				const groupSelectedItems = (group.items || []).filter((i: any) => i.isSelected);
				if (groupSelectedItems.length === 0) return null;

				const calcGroup = calcResult?.shopGroups?.find(
					(g: any) => g.shopId === group.shopId
				);
				const shippingFee = calcGroup?.shippingFee ?? 0;
				const shopDiscount = calcGroup?.shopDiscount ?? 0;

				const shopSubTotal = groupSelectedItems.reduce((sum: number, item: any) => {
					const activePrice = item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.unitPrice
						? item.discountPrice
						: item.unitPrice;
					return sum + activePrice * item.quantity;
				}, 0);

				const shopGrandTotal = Math.max(0, shopSubTotal + shippingFee - shopDiscount);
				const appliedVoucherCode = shopVouchers[group.shopId];

				return (
					<div
						key={group.shopId}
						className="bg-white border border-brand-border rounded-md overflow-hidden shadow-xs text-left"
					>
						{/* Shop header */}
						<div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-soft/20 border-b border-brand-border">
							<Store className="w-4 h-4 text-brand-primary" />
							<span className="font-extrabold text-xs text-brand-dark">
								{group.shopName || `Cửa hàng #${group.shopId}`}
							</span>
						</div>

						{/* Items Table Header */}
						<div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2 bg-gray-50/50 border-b border-brand-border/60 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
							<div className="col-span-6">Sản phẩm</div>
							<div className="col-span-2 text-right">Đơn giá</div>
							<div className="col-span-2 text-center">Số lượng</div>
							<div className="col-span-2 text-right">Thành tiền</div>
						</div>

						{/* Items list */}
						<div className="divide-y divide-brand-border/50">
							{group.items.map((item: any) => (
								<div key={item.productVariantId} className="p-3 sm:p-3.5 hover:bg-gray-50/30 transition-colors">
									<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
										{/* Product info (6 cols) */}
										<div className="sm:col-span-6 flex gap-3 items-center">
											{item.thumbnailUrl ? (
												<img
													src={item.thumbnailUrl}
													alt={item.productName}
													className="w-12 h-12 object-cover rounded-md border border-brand-border/80 flex-shrink-0 shadow-xs"
												/>
											) : (
												<div className="w-12 h-12 rounded-md bg-brand-light-soft border border-brand-border/80 flex items-center justify-center flex-shrink-0 text-brand-muted text-[10px] font-bold">
													No img
												</div>
											)}
											<div className="min-w-0 flex-1 text-left space-y-0.5">
												<h4 className="font-extrabold text-brand-dark text-xs truncate" title={item.productName}>
													{item.productName}
												</h4>
												{item.variantName && (
													<span className="inline-block text-[9px] font-bold text-brand-muted bg-brand-light-soft px-1.5 py-0.5 rounded-sm">
														Phân loại: {item.variantName}
													</span>
												)}
											</div>
										</div>

										{/* Unit Price (2 cols) */}
										<div className="sm:col-span-2 flex sm:flex-col sm:items-end justify-between sm:justify-center">
											<span className="text-[10px] text-brand-muted font-bold sm:hidden">Đơn giá:</span>
											<div className="text-right">
												<span className="font-bold text-brand-dark text-xs">
													{(item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.unitPrice ? item.discountPrice : item.unitPrice).toLocaleString("vi-VN")}đ
												</span>
												{item.discountPrice && item.discountPrice < item.unitPrice && (
													<span className="text-[10px] text-gray-400 line-through block font-medium">
														{item.unitPrice.toLocaleString("vi-VN")}đ
													</span>
												)}
											</div>
										</div>

										{/* Quantity (2 cols) */}
										<div className="sm:col-span-2 flex sm:justify-center justify-between items-center">
											<span className="text-[10px] text-brand-muted font-bold sm:hidden">Số lượng:</span>
											<span className="text-xs font-bold text-brand-dark bg-gray-100 px-2 py-0.5 rounded">
												x{item.quantity}
											</span>
										</div>

										{/* Subtotal (2 cols) */}
										<div className="sm:col-span-2 flex sm:justify-end justify-between items-center text-right">
											<span className="text-[10px] text-brand-muted font-bold sm:hidden">Thành tiền:</span>
											<span className="font-black text-brand-primary-deep text-xs">
												{((item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.unitPrice ? item.discountPrice : item.unitPrice) * item.quantity).toLocaleString("vi-VN")}đ
											</span>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Interactive Shop Voucher row */}
						<div className="px-4 py-2.5 bg-brand-light-soft/10 border-t border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2 flex-1">
								<Ticket className="w-4 h-4 text-brand-primary flex-shrink-0" />
								<span className="text-[11px] font-bold text-brand-dark mr-1">Voucher của Shop:</span>

								{appliedVoucherCode ? (
									<div className="flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/30 px-2 py-0.5 rounded-md text-xs font-bold text-brand-dark">
										<span>{appliedVoucherCode}</span>
										{shopDiscount > 0 && (
											<span className="text-[10px] text-red-500 font-bold">(-{shopDiscount.toLocaleString("vi-VN")}đ)</span>
										)}
										<button
											onClick={() => handleRemoveShopVoucher(group.shopId)}
											className="text-brand-muted hover:text-red-500 font-bold bg-transparent border-none p-0 cursor-pointer text-xs ml-1"
										>
											<X className="w-3.5 h-3.5 inline" />
										</button>
									</div>
								) : (
									<button
										onClick={() => setActiveShopVoucherModal(group.shopId)}
										className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
									>
										Chọn voucher từ shop
									</button>
								)}
							</div>
						</div>

						{/* Shipping & Shop Total Row */}
						<div className="p-3 bg-brand-light-soft/10 border-t border-brand-border/60 text-left space-y-2">
							<div className="flex items-center justify-between border-b border-dashed border-brand-border/80 pb-2">
								<div>
									<span className="text-xs font-extrabold text-brand-dark block">
										Phương thức vận chuyển
									</span>
									<span className="text-[10px] text-brand-muted font-bold block mt-0.5">
										Giao hàng nhanh (GHN)
									</span>
								</div>
								<div className="text-right">
									<span className="text-xs font-black text-brand-dark">
										{shippingFee.toLocaleString("vi-VN")}đ
									</span>
								</div>
							</div>

							<div className="flex justify-between items-center pt-0.5">
								<span className="text-[10px] font-bold text-brand-muted">
									Tạm tính Shop ({groupSelectedItems.length} sản phẩm):
								</span>
								<span className="text-sm font-black text-red-500">
									{shopGrandTotal.toLocaleString("vi-VN")}đ
								</span>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}