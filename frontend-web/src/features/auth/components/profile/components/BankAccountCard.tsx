import { Loader2, PlusCircle } from "lucide-react";

interface BankAccountCardProps {
	banksLoading: boolean;
	defaultAccount: any;
	extraAccountsCount: number;
	onManageBankClick: () => void;
}

export function BankAccountCard({ banksLoading, defaultAccount, extraAccountsCount, onManageBankClick }: BankAccountCardProps) {
	return (
		<div className="border border-brand-border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between min-h-40">
			<div className="space-y-3">
				<div className="flex justify-between items-center">
					<h4 className="text-xs font-black text-brand-dark uppercase tracking-wider">Tài khoản mặc định</h4>
					{extraAccountsCount > 0 && (
						<button
							onClick={onManageBankClick}
							className="text-[10px] font-black text-brand-primary-deep hover:underline cursor-pointer bg-transparent border-none p-0"
						>
							Xem thêm {extraAccountsCount} tài khoản khác
						</button>
					)}
					{extraAccountsCount === 0 && (
						<button
							onClick={onManageBankClick}
							className="text-[10px] font-black text-brand-muted hover:text-brand-dark hover:underline cursor-pointer flex items-center gap-0.5 bg-transparent border-none p-0"
						>
							<PlusCircle className="w-3 h-3" /> Quản lý ngân hàng
						</button>
					)}
				</div>

				{banksLoading ? (
					<div className="flex items-center gap-1.5 text-xs text-brand-muted py-2">
						<Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải ngân hàng...
					</div>
				) : defaultAccount ? (
					<div className="space-y-2 text-xs">
						<div className="flex justify-between py-1.5 border-b border-slate-100">
							<span className="text-brand-muted font-bold">Ngân hàng</span>
							<span className="font-black text-brand-dark uppercase">{defaultAccount.bankName}</span>
						</div>
						<div className="flex justify-between py-1.5 border-b border-slate-100">
							<span className="text-brand-muted font-bold">Số tài khoản</span>
							<span className="font-extrabold text-brand-dark font-mono">{defaultAccount.bankAccountNumber}</span>
						</div>
						<div className="flex justify-between py-1.5">
							<span className="text-brand-muted font-bold">Chủ tài khoản</span>
							<span className="font-black text-brand-dark uppercase">{defaultAccount.bankAccountHolder}</span>
						</div>
					</div>
				) : (
					<p className="text-xs text-brand-muted py-3">Chưa có tài khoản ngân hàng liên kết mặc định.</p>
				)}
			</div>

			<div className="text-[10px] text-brand-muted font-bold pt-2 border-t border-slate-100">
				Nhấn vào xem thêm để quản lý hoặc liên kết nhiều tài khoản ngân hàng khác.
			</div>
		</div>
	);
}
