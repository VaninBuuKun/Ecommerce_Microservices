import { ShieldCheck } from "lucide-react";

interface WalletBalanceCardProps {
	wallet: any;
	onWithdrawClick: () => void;
}

export function WalletBalanceCard({ wallet, onWithdrawClick }: WalletBalanceCardProps) {
	return (
		<div className="border border-brand-border bg-gradient-to-br from-brand-dark to-slate-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-40 relative overflow-hidden">
			<div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-brand-primary/10 rounded-full blur-2xl" />
			<div className="flex justify-between items-start">
				<div className="space-y-1">
					<p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/80">Ví điện tử cá nhân</p>
					<p className="text-[11px] font-bold text-slate-300">ID: #{wallet.id.split("-")[0]}</p>
				</div>
				<ShieldCheck className="w-6 h-6 text-brand-primary" />
			</div>

			<div className="space-y-1 pt-4 flex justify-between items-end">
				<div>
					<p className="text-[10px] font-bold text-slate-400">Số dư khả dụng</p>
					<p className="text-2xl font-black text-brand-primary font-mono">
						{Number(wallet.balance).toLocaleString("vi-VN")}đ
					</p>
				</div>
				{!wallet.isLocked && (
					<button 
						onClick={onWithdrawClick}
						className="px-3.5 py-1.5 bg-brand-primary text-brand-dark rounded-xl text-xs font-black hover:bg-brand-primary-deep transition-all cursor-pointer border-none shadow-sm"
					>
						Rút tiền
					</button>
				)}
			</div>

			<div className="flex justify-between items-center border-t border-white/10 pt-3 mt-3 text-[10px] font-bold text-slate-400">
				<span>Trạng thái: 
					<span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] uppercase ${wallet.isLocked ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
						{wallet.isLocked ? "Đang khóa" : "Hoạt động"}
					</span>
				</span>
				<span>Kích hoạt: {new Date(wallet.createdDate || Date.now()).toLocaleDateString("vi-VN")}</span>
			</div>
		</div>
	);
}
