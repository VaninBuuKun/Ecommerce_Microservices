import { useState } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Loader2 } from "lucide-react";

export function WalletTab() {
	const [balance] = useState(1500000);
	const [isLoading] = useState(false);

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border flex justify-between items-center">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Ví người dùng
					</h2>
					<p className="text-xs text-brand-muted">
						Quản lý số dư, nạp tiền và xem lịch sử biến động số dư.
					</p>
				</div>
				<button className="px-4 py-2 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border-none shadow-sm">
					<Plus className="w-4 h-4" />
					Nạp tiền vào ví
				</button>
			</div>

			<div className="p-6 rounded-2xl bg-gradient-to-br from-brand-dark to-slate-900 text-white shadow-xl flex flex-col justify-between h-44 relative overflow-hidden">
				<div className="flex justify-between items-start z-10">
					<div className="space-y-1">
						<span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Ví Điện Tử BuuPay</span>
						<span className="text-2xl font-black text-brand-primary">{balance.toLocaleString("vi-VN")}đ</span>
					</div>
					<Wallet className="w-8 h-8 text-brand-primary opacity-80" />
				</div>
				<div className="text-[10px] text-slate-400 font-mono z-10">
					Trạng thái: <span className="text-emerald-400 font-bold">Đã kích hoạt</span>
				</div>
			</div>
		</div>
	);
}
