import { X, Ticket } from "lucide-react";
import { useAvailableVouchersQuery } from "../hooks/useCheckoutQueries";
import { renderDiscountLabel } from "./VoucherHelpers";

interface PlatformVoucherModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedVoucherCode?: string;
	onApply: (code: string) => void;
	subTotal: number;
}

export function PlatformVoucherModal({
	isOpen,
	onClose,
	selectedVoucherCode,
	onApply,
	subTotal,
}: PlatformVoucherModalProps) {
	const { data: vouchers, isLoading } = useAvailableVouchersQuery(null, isOpen);
	const platformVouchers = (vouchers || []).filter(
		(v: any) => v.scope === 0 || v.scope === "Platform"
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
			<div className="bg-white border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
				>
					<X className="w-5 h-5" />
				</button>

				<h2 className="text-base font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
					<Ticket className="w-5 h-5 text-brand-primary" />
					Voucher Khuyến Mãi Toàn Sàn
				</h2>

				<div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
					{isLoading ? (
						<p className="text-xs text-brand-muted font-bold text-center py-4">Đang tải mã giảm giá...</p>
					) : platformVouchers.length > 0 ? (
						platformVouchers.map((voucher: any) => {
							const isCurrent = selectedVoucherCode === voucher.code;
							return (
								<div
									key={voucher.id}
									className={`p-3.5 rounded-xl border flex justify-between items-center gap-2.5 transition-all ${isCurrent ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-white"
										}`}
								>
									<div className="text-left space-y-1">
										<span className="bg-brand-primary text-brand-dark text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide border border-brand-primary/20">
											Platform
										</span>
										<div className="text-xs font-black text-brand-dark mt-1">{voucher.code}</div>
										<div className="text-[10px] text-brand-dark font-bold leading-normal">
											Ưu đãi: {renderDiscountLabel(voucher, subTotal)}
										</div>
										<div className="text-[10px] text-brand-muted font-semibold">
											Đơn tối thiểu: {voucher.minOrderValue?.toLocaleString("vi-VN")}đ
										</div>
									</div>
									<button
										onClick={() => onApply(voucher.code)}
										disabled={isCurrent}
										className="h-7 px-3 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-[10px] rounded-lg transition-colors border-none cursor-pointer disabled:opacity-60"
									>
										{isCurrent ? "Đang áp dụng" : "Áp Dụng"}
									</button>
								</div>
							);
						})
					) : (
						<p className="text-xs text-brand-muted font-bold py-4 text-center">Không tìm thấy voucher toàn sàn khả dụng nào.</p>
					)}
				</div>

				<div className="pt-3 border-t border-brand-border/60">
					<button
						onClick={onClose}
						className="w-full h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-lg transition-colors cursor-pointer bg-white"
					>
						Đóng lại
					</button>
				</div>
			</div>
		</div>
	);
}
