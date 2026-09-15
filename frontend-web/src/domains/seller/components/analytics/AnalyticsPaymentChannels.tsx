import { CreditCard, Wallet } from "lucide-react";

export function AnalyticsPaymentChannels() {
	return (
		<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs">
			<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2 mb-3">
				Kênh Thanh Toán Hệ Thống Hỗ Trợ
			</h3>
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
					<div className="p-2 bg-white rounded-md border border-brand-border text-emerald-600">
						<CreditCard className="w-4 h-4" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block">COD (Tiền mặt)</span>
						<span className="text-xs font-extrabold text-brand-dark">Thanh toán khi nhận hàng</span>
					</div>
				</div>
				<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
					<div className="p-2 bg-white rounded-md border border-brand-border text-pink-600">
						<Wallet className="w-4 h-4" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block">Ví MoMo</span>
						<span className="text-xs font-extrabold text-brand-dark">Cổng thanh toán MoMo</span>
					</div>
				</div>
				<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
					<div className="p-2 bg-white rounded-md border border-brand-border text-blue-600">
						<CreditCard className="w-4 h-4" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block">VNPAY-QR</span>
						<span className="text-xs font-extrabold text-brand-dark">Quét mã QR qua VNPay</span>
					</div>
				</div>
				<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
					<div className="p-2 bg-white rounded-md border border-brand-border text-purple-600">
						<Wallet className="w-4 h-4" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block">Ví Shop</span>
						<span className="text-xs font-extrabold text-brand-dark">Số dư ví & Quyết toán</span>
					</div>
				</div>
			</div>
		</div>
	);
}
