import React from "react";
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
		<div className="space-y-4">
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

				// Tổng tiền thực tế của từng Shop sau khi cộng phí ship và trừ voucher của Shop đó
				const shopGrandTotal = Math.max(0, shopSubTotal + shippingFee - shopDiscount);

				const appliedVoucherCode = shopVouchers[group.shopId];

				return (
					<div
						key={group.shopId}
						className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm text-left"
					>
						{/* Shop Header */}
						<div className="flex items-center gap-2 px-4 py-3 bg-brand-light-soft/20 border-b border-brand-border">
							<Store className="w-4 h-4 text-brand-primary" />
							<span className="font-extrabold text-xs text-brand-dark">
								{group.shopName || `Cửa hàng #${group.shopId}`}
							</span>
						</div>

						{/* Item list */}
						<div className="divide-y divide-brand-border/60">
							{groupSelectedItems.map((item: any) => (
								<div key={item.productVariantId} className="flex gap-3 p-4">
									<img
										src={item.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
										alt={item.productName}
										className="w-14 h-14 object-cover rounded-lg border border-brand-border flex-shrink-0"
									/>
									<div className="flex-1 min-w-0 text-left">
										<h4 className="font-extrabold text-brand-dark text-xs truncate">
											{item.productName}
										</h4>
										{item.variantName && (
											<span className="inline-block text-[9px] font-bold text-brand-muted bg-brand-light-soft px-1.5 py-0.5 rounded-sm mt-1">
												Phân loại: {item.variantName}
											</span>
										)}
										<div className="flex justify-between items-baseline mt-2">
											<span className="text-[10px] text-brand-muted font-bold">
												Số lượng: {item.quantity}
											</span>
											<div className="flex items-baseline gap-1.5">
												{item.discountPrice && item.discountPrice < item.unitPrice ? (
													<>
														<span className="font-extrabold text-brand-primary-deep text-xs">
															{(item.discountPrice * item.quantity).toLocaleString("vi-VN")}đ
														</span>
														<span className="text-[9px] text-brand-muted line-through font-bold">
															{(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
														</span>
													</>
												) : (
													<span className="font-extrabold text-brand-dark text-xs">
														{(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Interactive Shop Voucher modal row */}
						<div className="px-4 py-3.5 bg-brand-light-soft/10 border-t border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2 flex-1">
								<Ticket className="w-4 h-4 text-brand-primary flex-shrink-0" />
								<span className="text-[11px] font-bold text-brand-dark mr-1">Voucher của Shop:</span>

								{appliedVoucherCode ? (
									<div className="flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/30 px-2.5 py-1 rounded-lg text-xs font-bold text-brand-dark">
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
										className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
									>
										Chọn voucher từ shop
									</button>
								)}
							</div>
						</div>

						{/* Shipping & Shop Total Row */}
						<div className="p-4 bg-brand-light-soft/10 border-t border-brand-border/60 text-left space-y-3">
							<div className="flex items-center justify-between border-b border-dashed border-brand-border/80 pb-3">
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
