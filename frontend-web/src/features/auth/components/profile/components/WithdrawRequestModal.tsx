import React from "react";
import { X, CreditCard, AlertTriangle, Loader2 } from "lucide-react";

interface WithdrawRequestModalProps {
	onClose: () => void;
	defaultAccount: any;
	onSubmit: (e: React.FormEvent) => void;
	withdrawAmount: string;
	setWithdrawAmount: (val: string) => void;
	withdrawError: string;
	walletBalance: number;
	mutationPending: boolean;
	onAddBankRedirect: () => void;
}

export function WithdrawRequestModal({
	onClose,
	defaultAccount,
	onSubmit,
	withdrawAmount,
	setWithdrawAmount,
	withdrawError,
	walletBalance,
	mutationPending,
	onAddBankRedirect,
}: WithdrawRequestModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
			<div className="bg-white rounded-2xl max-w-md w-full border border-brand-border p-6 shadow-2xl space-y-4 text-left">
				<div className="flex justify-between items-center border-b border-brand-border pb-3">
					<h3 className="font-black text-brand-dark text-sm uppercase flex items-center gap-1.5">
						<CreditCard className="w-4 h-4 text-brand-primary" />
						Yêu cầu rút tiền từ Ví
					</h3>
					<button 
						onClick={onClose}
						className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm border-none bg-transparent"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{defaultAccount ? (
					<form onSubmit={onSubmit} className="space-y-4 text-xs">
						<div className="bg-brand-light-soft/50 border border-brand-border rounded-xl p-3.5 space-y-2">
							<p className="text-[10px] font-extrabold text-brand-muted uppercase">Tài khoản nhận tiền mặc định:</p>
							<div className="font-bold text-brand-dark">
								<p className="text-xs uppercase">{defaultAccount.bankName}</p>
								<p className="font-mono text-[11px] text-brand-muted mt-0.5">Số tài khoản: {defaultAccount.bankAccountNumber}</p>
								<p className="text-[11px] text-brand-muted mt-0.5">Chủ tài khoản: {defaultAccount.bankAccountHolder}</p>
							</div>
						</div>

						<div className="space-y-1">
							<label className="font-extrabold text-[10px] text-brand-muted uppercase">Số tiền muốn rút (VND)</label>
							<input 
								type="number"
								required
								min="1000"
								step="1000"
								placeholder="Ví dụ: 100000"
								value={withdrawAmount}
								onChange={(e) => setWithdrawAmount(e.target.value)}
								className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold text-brand-dark text-xs bg-white"
							/>
							<div className="flex justify-between text-[9px] text-brand-muted font-bold mt-1">
								<span>* Số tiền tối thiểu 1.000đ</span>
								<span>Khả dụng: {Number(walletBalance).toLocaleString("vi-VN")}đ</span>
							</div>
						</div>

						{withdrawError && (
							<p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
								{withdrawError}
							</p>
						)}

						<div className="flex justify-end gap-2.5 pt-3 border-t border-brand-border">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-none"
							>
								Hủy
							</button>
							<button
								type="submit"
								disabled={mutationPending}
								className="px-5 py-2 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white font-black rounded-xl cursor-pointer border-none transition-all disabled:opacity-50 flex items-center gap-1.5"
							>
								{mutationPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Xác nhận rút
							</button>
						</div>
					</form>
				) : (
					<div className="space-y-4 py-3 text-center">
						<div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 mx-auto">
							<AlertTriangle className="w-6 h-6" />
						</div>
						<div className="space-y-1">
							<p className="text-xs font-black text-brand-dark">Chưa liên kết tài khoản ngân hàng</p>
							<p className="text-[10px] text-brand-muted leading-relaxed px-4">
								Bạn phải liên kết ít nhất một tài khoản ngân hàng để làm nơi nhận tiền trước khi tạo yêu cầu rút tiền.
							</p>
						</div>
						<button
							onClick={onAddBankRedirect}
							className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl cursor-pointer border-none shadow-xs"
						>
							Liên kết ngân hàng ngay
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
