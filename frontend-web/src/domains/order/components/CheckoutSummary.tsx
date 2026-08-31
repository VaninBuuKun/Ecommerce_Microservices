import { Ticket, X, Loader2, AlertCircle, RefreshCw, MapPin } from "lucide-react";

interface CheckoutSummaryProps {
	platformVoucher: string;
	handleRemovePlatformVoucher: () => void;
	setShowPlatformVoucherModal: (show: boolean) => void;
	calcResult: any;
	selectedItems: any[];
	checkoutMutation: any;
	calculateTotalMutation: any;
	handlePlaceOrder: () => void;
	hasSelectedAddress: boolean;
	onRetryCalculate?: () => void;
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
	hasSelectedAddress,
	onRetryCalculate,
}: CheckoutSummaryProps) {
	const isCalculating = calculateTotalMutation.isPending;
	const isCalcError = calculateTotalMutation.isError;

	const fallbackSubTotal = selectedItems.reduce((sum, i) => {
		const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
		return sum + activePrice * i.quantity;
	}, 0);

	return (
		<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs text-left space-y-3.5 sticky top-4">
			<h3 className="font-extrabold text-brand-dark text-sm border-b border-brand-border pb-2.5">
				Tổng kết thanh toán
			</h3>

			{/* Platform Voucher interactive button */}
			<div className="pb-2.5 border-b border-brand-border/60">
				<div className="flex items-center justify-between text-xs font-bold text-brand-dark mb-1.5">
					<span className="flex items-center gap-1">
						<Ticket className="w-4 h-4 text-brand-primary" />
						Voucher Toàn Sàn
					</span>
				</div>

				{platformVoucher ? (
					<div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-md text-xs font-bold text-brand-dark mt-1">
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
						className="w-full text-left h-7 px-2.5 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
					>
						Chọn mã giảm giá toàn sàn
					</button>
				)}
			</div>

			{/* Hiển thị Thông báo lỗi nếu API tính toán bị lỗi */}
			{isCalcError && (
				<div className="p-2.5 bg-red-50 border border-red-200 rounded-md space-y-1.5 text-left">
					<div className="flex items-start gap-2 text-red-700">
						<AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
						<p className="text-[11px] font-bold leading-tight">
							Không thể tính phí vận chuyển và khuyến mãi.
						</p>
					</div>
					{onRetryCalculate && (
						<button
							onClick={onRetryCalculate}
							disabled={isCalculating}
							className="w-full py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold rounded-md transition-colors flex items-center justify-center gap-1 border-none cursor-pointer"
						>
							<RefreshCw className={`w-3 h-3 ${isCalculating ? "animate-spin" : ""}`} />
							Thử tính lại chi phí
						</button>
					)}
				</div>
			)}

			<div className="space-y-2 text-xs text-brand-dark">
				{/* Tổng tiền hàng */}
				<div className="flex justify-between font-semibold">
					<span className="text-brand-muted">Tổng tiền hàng</span>
					<span>
						{(calcResult?.subTotal || fallbackSubTotal).toLocaleString("vi-VN")}đ
					</span>
				</div>

				{/* Phí vận chuyển */}
				<div className="flex justify-between font-semibold items-center text-[11px]">
					<span className="text-brand-muted">Tổng phí vận chuyển</span>
					{isCalculating ? (
						<span className="text-brand-muted flex items-center gap-1 text-[10px]">
							<Loader2 className="w-3 h-3 animate-spin text-brand-primary" /> Đang tính...
						</span>
					) : !hasSelectedAddress ? (
						<span className="text-amber-600 font-bold text-[10px]">Chưa chọn địa chỉ</span>
					) : isCalcError ? (
						<span className="text-red-500 font-bold text-[10px]">Chưa xác định</span>
					) : (
						<span>{(calcResult?.totalShippingFee || 0).toLocaleString("vi-VN")}đ</span>
					)}
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
					<div className="flex justify-between font-bold text-green-600 border-t border-dashed border-brand-border/60 pt-1.5">
						<span>Tổng giảm giá</span>
						<span>-{(calcResult?.totalDiscount || 0).toLocaleString("vi-VN")}đ</span>
					</div>
				)}
			</div>

			{/* Tổng thanh toán */}
			<div className="border-t border-brand-border pt-3 flex items-baseline justify-between">
				<span className="text-xs font-black text-brand-dark">Tổng thanh toán:</span>
				{isCalculating ? (
					<span className="text-xs font-bold text-brand-muted flex items-center gap-1">
						<Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" /> Đang cập nhật...
					</span>
				) : !hasSelectedAddress ? (
					<span className="text-xs font-bold text-amber-600">Cần chọn địa chỉ</span>
				) : (
					<span className="text-lg font-black text-red-500">
						{(calcResult?.grandTotal || fallbackSubTotal).toLocaleString("vi-VN")}đ
					</span>
				)}
			</div>

			{/* Cảnh báo chưa có địa chỉ */}
			{!hasSelectedAddress && (
				<div className="p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-1.5 text-amber-800 text-[10px] font-bold">
					<MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
					Vui lòng chọn địa chỉ nhận hàng để hoàn tất đặt hàng.
				</div>
			)}

			<button
				onClick={handlePlaceOrder}
				disabled={
					!hasSelectedAddress ||
					isCalculating ||
					isCalcError ||
					!calcResult ||
					checkoutMutation.isPending
				}
				className="w-full h-10 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{checkoutMutation.isPending ? (
					<>
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
						Đang xử lý đặt hàng...
					</>
				) : (
					"Đặt hàng"
				)}
			</button>
		</div>
	);
}