import { createPortal } from "react-dom";
import { X, Store } from "lucide-react";
import { useAvailableVouchersQuery } from "../hooks/useOrders";
import { renderDiscountLabel } from "./VoucherHelpers";

interface ShopVoucherModalProps {
	shopId: number;
	isOpen: boolean;
	onClose: () => void;
	selectedVoucherCode?: string;
	onApply: (shopId: number, code: string) => void;
	subTotal: number;
}

export function ShopVoucherModal({
	shopId,
	isOpen,
	onClose,
	selectedVoucherCode,
	onApply,
	subTotal,
}: ShopVoucherModalProps) {
	const { data: vouchers, isLoading } = useAvailableVouchersQuery(shopId, isOpen);
	const shopVouchers = vouchers || [];

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
			<div className="bg-white border border-brand-border rounded-md max-w-md w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200 font-sans">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
				>
					<X className="w-5 h-5" />
				</button>

				<h2 className="text-base font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
					<Store className="w-5 h-5 text-brand-primary" />
					Voucher Khuyến Mãi của Cửa Hàng
				</h2>

				<div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
					{isLoading ? (
						<p className="text-xs text-brand-muted font-bold text-center py-4">Đang tải mã giảm giá...</p>
					) : shopVouchers.length > 0 ? (
						shopVouchers.map((voucher: any) => {
							const isCurrent = selectedVoucherCode === voucher.code;
							const isEligible = !voucher.minOrderValue || subTotal >= voucher.minOrderValue;
							const missingAmount = (voucher.minOrderValue || 0) - subTotal;

							return (
								<div
									key={voucher.id}
									className={`p-3.5 rounded-md border flex justify-between items-center gap-2.5 transition-all ${
										isCurrent ? "border-brand-primary bg-brand-primary/5" : !isEligible ? "border-slate-200 bg-slate-50 opacity-70" : "border-brand-border bg-white"
									}`}
								>
									<div className="text-left space-y-1">
										<span className="bg-brand-light-soft text-brand-dark text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wide border border-brand-border">
											Shop Voucher
										</span>
										<div className="text-xs font-black text-brand-dark mt-1">{voucher.code}</div>
										<div className="text-[10px] text-brand-dark font-bold leading-normal">
											Ưu đãi: {renderDiscountLabel(voucher, subTotal)}
										</div>
										<div className="text-[10px] text-brand-muted font-semibold">
											Đơn tối thiểu: {voucher.minOrderValue?.toLocaleString("vi-VN")}đ
										</div>
										{!isEligible && (
											<div className="text-[9px] font-extrabold text-red-500">
												Cần mua thêm {missingAmount.toLocaleString("vi-VN")}đ của shop để sử dụng
											</div>
										)}
									</div>
									<button
										onClick={() => onApply(shopId, voucher.code)}
										disabled={isCurrent || !isEligible}
										className="h-7 px-3 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-[10px] rounded-md transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isCurrent ? "Đang áp dụng" : !isEligible ? "Chưa đủ Đ/K" : "Áp Dụng"}
									</button>
								</div>
							);
						})
					) : (
						<p className="text-xs text-brand-muted font-bold py-4 text-center">Không tìm thấy voucher khả dụng nào từ shop này.</p>
					)}
				</div>

				<div className="pt-3 border-t border-brand-border/60">
					<button
						onClick={onClose}
						className="w-full h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-md transition-colors cursor-pointer bg-white"
					>
						Đóng lại
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
}