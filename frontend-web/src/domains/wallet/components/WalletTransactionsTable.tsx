import { Loader2 } from "lucide-react";

interface WalletTransactionsTableProps {
	txLoading: boolean;
	paginatedTx: any[];
	totalTx: number;
	txPage: number;
	pageSize: number;
	setTxPage: (page: number) => void;
}

export function WalletTransactionsTable({
	txLoading,
	paginatedTx,
	totalTx,
	txPage,
	pageSize,
	setTxPage,
}: WalletTransactionsTableProps) {
	return (
		<div className="space-y-3 animate-in fade-in duration-200">
			<div className="border border-brand-border rounded-2xl bg-white overflow-hidden shadow-sm">
				{txLoading ? (
					<div className="flex justify-center items-center py-10 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tải danh sách giao dịch...
					</div>
				) : paginatedTx.length === 0 ? (
					<div className="text-center py-12 text-brand-muted font-semibold text-xs">
						Chưa có giao dịch phát sinh nào trên ví của bạn.
					</div>
				) : (
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
								<th className="p-3 w-1/4">Mã giao dịch</th>
								<th className="p-3 w-1/4">Thời gian</th>
								<th className="p-3 w-2/5">Mô tả</th>
								<th className="p-3 text-right">Số tiền</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border text-xs">
							{paginatedTx.map((tx: any, idx: number) => {
								const isDebit = tx.type === "Debit";
								return (
									<tr key={idx} className="hover:bg-brand-light-soft/10">
										<td className="p-3 font-mono font-bold text-brand-dark">#{tx.id.split("-")[0]}</td>
										<td className="p-3 text-brand-muted">{new Date(tx.createdDate).toLocaleString("vi-VN")}</td>
										<td className="p-3 font-bold text-brand-dark">{tx.description}</td>
										<td className={`p-3 text-right font-extrabold ${isDebit ? "text-red-600" : "text-emerald-600"}`}>
											{isDebit ? "-" : "+"}{Number(tx.amount).toLocaleString("vi-VN")}đ
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>

			{/* Phân trang Transactions */}
			{totalTx > pageSize && (
				<div className="flex justify-between items-center pt-2">
					<span className="text-[10px] text-brand-muted font-bold">
						Hiển thị {paginatedTx.length} / {totalTx} giao dịch
					</span>
					<div className="flex items-center gap-1 text-xs font-black">
						<button
							disabled={txPage === 1}
							onClick={() => setTxPage(txPage - 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Trước
						</button>
						{Array.from({ length: Math.ceil(totalTx / pageSize) }).map((_, i) => (
							<button
								key={i}
								onClick={() => setTxPage(i + 1)}
								className={`w-7 h-7 rounded-lg transition-all cursor-pointer border-none ${
									txPage === i + 1 ? "bg-brand-dark text-white font-mono" : "bg-transparent text-brand-muted hover:bg-brand-light-soft"
								}`}
							>
								{i + 1}
							</button>
						))}
						<button
							disabled={txPage >= Math.ceil(totalTx / pageSize)}
							onClick={() => setTxPage(txPage + 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Sau
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
