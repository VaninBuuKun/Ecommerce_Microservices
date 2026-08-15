import React from "react";
import { Ticket, X, Loader2 } from "lucide-react";

interface CheckoutSummaryProps {
	platformVoucher: string;
	handleRemovePlatformVoucher: () => void;
	setShowPlatformVoucherModal: (show: boolean) => void;
	calcResult: any;
	selectedItems: any[];
	checkoutMutation: any;
	calculateTotalMutation: any;
	handlePlaceOrder: () => void;
}

export function CheckoutSummary({
	platformVoucher,
	handleRemovePlatformVoucher,
	setShowPlatformVoucherModal,
	calcResult,
	selectedItems,
	checkoutMutation,
	calculateTotalMutation,
	handlePlaceOrder,
}: CheckoutSummaryProps) {
	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm text-left space-y-4 sticky top-6">
			<h3 className="font-extrabold text-brand-dark text-sm border-b border-brand-border pb-3">
				Tổng kết thanh toán
			</h3>

			{/* Platform Voucher interactive button */}
			<div className="pb-3 border-b border-brand-border/60">
				<div className="flex items-center justify-between text-xs font-bold text-brand-dark mb-2">
					<span className="flex items-center gap-1">
						<Ticket className="w-4 h-4 text-brand-primary" />
						Voucher Toàn Sàn
					</span>
				</div>

				{platformVoucher ? (
					<div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-dark mt-1">
						<div className="flex items-center gap-1.5">
							<span>{platformVoucher}</span>
							{calcResult?.platformDiscount > 0 && (
								<span className="text-[10px] text-red-500 font-bold">(-{calcResult.platformDiscount.toLocaleString("vi-VN")}đ)</span>
							)}
						</div>
						<button
							onClick={handleRemovePlatformVoucher}
							className="text-brand-muted hover:text-red-500 font-bold bg-transparent border-none p-0 cursor-pointer"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				) : (
					<button
						onClick={() => setShowPlatformVoucherModal(true)}
						className="w-full text-left h-8 px-3 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
					>
						Chọn mã giảm giá toàn sàn
					</button>
				)}
			</div>

			<div className="space-y-2.5 text-xs text-brand-dark">
				<div className="flex justify-between font-semibold">
					<span className="text-brand-muted">Tổng tiền hàng</span>
					<span>
						{(calcResult?.subTotal || selectedItems.reduce((sum, i) => {
							const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
							return sum + activePrice * i.quantity;
						}, 0)).toLocaleString("vi-VN")}đ
					</span>
				</div>
				<div className="flex justify-between font-semibold">
					<span className="text-brand-muted">Tổng phí vận chuyển</span>
					<span>{(calcResult?.totalShippingFee || 0).toLocaleString("vi-VN")}đ</span>
				</div>

				{/* Chi tiết giảm giá từng loại */}
				{(() => {
					const sumShopDiscount = calcResult?.shopGroups?.reduce((sum: number, g: any) => sum + (g.shopDiscount || 0), 0) || 0;
					return sumShopDiscount > 0 ? (
						<div className="flex justify-between font-semibold text-green-600">
							<span>Giảm giá từ Shop</span>
							<span>-{sumShopDiscount.toLocaleString("vi-VN")}đ</span>
						</div>
					) : null;
				})()}

				{/* Voucher Sàn */}
				{calcResult?.platformDiscount > 0 && (
					<div className="flex justify-between font-semibold text-green-600">
						<span>Giảm giá từ Sàn</span>
						<span>-{(calcResult?.platformDiscount || 0).toLocaleString("vi-VN")}đ</span>
					</div>
				)}

				{/* Hiển thị Tổng giảm giá */}
				{calcResult?.totalDiscount > 0 && (
					<div className="flex justify-between font-bold text-green-600 border-t border-dashed border-brand-border/60 pt-2">
						<span>Tổng giảm giá</span>
						<span>-{(calcResult?.totalDiscount || 0).toLocaleString("vi-VN")}đ</span>
					</div>
				)}
			</div>

			<div className="border-t border-brand-border pt-4 flex items-baseline justify-between">
				<span className="text-xs font-black text-brand-dark">Tổng thanh toán:</span>
				<span className="text-xl font-black text-red-500">
					{(calcResult?.grandTotal || selectedItems.reduce((sum, i) => {
						const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
						return sum + activePrice * i.quantity;
					}, 0)).toLocaleString("vi-VN")}đ
				</span>
			</div>

			<button
				onClick={handlePlaceOrder}
				disabled={checkoutMutation.isPending || calculateTotalMutation.isPending}
				className="w-full h-11 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border-none mt-2"
			>
				{checkoutMutation.isPending ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Đang xử lý đặt hàng...
					</>
				) : (
					"Đặt hàng"
				)}
			</button>
		</div>
	);
}
