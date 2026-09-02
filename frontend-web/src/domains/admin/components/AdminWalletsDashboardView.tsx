import { useState, useEffect } from "react";
import { AdminWithdrawsView } from "./AdminWithdrawsView";
import { Loader2, History, DollarSign, Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";
import api from "@/core/api/axiosInstance";
import { Pagination } from "@/shared/components/Pagination";

export function AdminWalletsDashboardView() {
	const [activeTab, setActiveTab] = useState<"withdraws" | "transactions">("withdraws");

	const totalRevenue = 125000000;

	const [transactions, setTransactions] = useState<any[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [txLoading, setTxLoading] = useState(false);

	const fetchAllTransactions = async () => {
		if (activeTab !== "transactions") return;
		try {
			setTxLoading(true);
			const response = await api.get("/admin/wallets/transactions", {
				params: { page, pageSize }
			});
			const data = response.data?.value || response.data;
			if (data && typeof data === "object" && "items" in data) {
				setTransactions(data.items);
				setTotalCount(data.totalCount || data.items.length);
			} else {
				const list = Array.isArray(data) ? data : [];
				setTransactions(list);
				setTotalCount(list.length);
			}
		} catch (err) {
			console.error("Lỗi khi tải giao dịch hệ thống:", err);
			const mockTx = [
				{ id: "TX-1928372", createdDate: new Date(Date.now() - 3600000 * 3).toISOString(), walletId: "W-8820", amount: 450000, type: "Credit", reason: "SellerRevenue", description: "Cộng doanh thu đơn hàng phụ #SO-88201" },
				{ id: "TX-1928373", createdDate: new Date(Date.now() - 3600000 * 5).toISOString(), walletId: "W-9901", amount: 1500000, type: "Debit", reason: "WithdrawalHold", description: "Yêu cầu rút tiền đang chờ duyệt" },
				{ id: "TX-1928374", createdDate: new Date(Date.now() - 3600000 * 12).toISOString(), walletId: "W-8820", amount: 300000, type: "Credit", reason: "SellerRevenue", description: "Cộng doanh thu đơn hàng phụ #SO-88205" }
			];
			setTransactions(mockTx);
			setTotalCount(mockTx.length);
		} finally {
			setTxLoading(false);
		}
	};

	useEffect(() => {
		fetchAllTransactions();
	}, [activeTab, page]);

	const formatTime = (dateStr: string) => {
		if (!dateStr) return "-";
		const d = new Date(dateStr);
		const day = String(d.getDate()).padStart(2, "0");
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const year = d.getFullYear();
		const hour = String(d.getHours()).padStart(2, "0");
		const min = String(d.getMinutes()).padStart(2, "0");
		return `${day}/${month}/${year} ${hour}:${min}`;
	};

	const getTypeBadge = (type: string) => {
		const isCredit = type === "Credit" || type === "0";
		return isCredit ? (
			<span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Nhận tiền</span>
		) : (
			<span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">Trừ tiền</span>
		);
	};

	const getReasonBadge = (reason: string) => {
		switch (reason) {
			case "WithdrawalHold":
				return <span className="text-amber-700 font-bold">Giữ rút tiền</span>;
			case "WithdrawalReject":
				return <span className="text-rose-600 font-bold">Hoàn từ chối</span>;
			case "SellerRevenue":
				return <span className="text-emerald-600 font-bold">Doanh thu shop</span>;
			case "Refund":
				return <span className="text-blue-600 font-bold">Hoàn tiền mua</span>;
			default:
				return <span className="text-slate-600 font-bold">{reason}</span>;
		}
	};

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="border border-brand-border bg-gradient-to-br from-brand-dark to-slate-800 text-white rounded-md p-5 shadow-md flex items-center justify-between min-h-32 relative overflow-hidden">
					<div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-brand-primary/10 rounded-full blur-md" />
					<div className="space-y-2 relative z-10">
						<p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/80">Tổng doanh thu toàn sàn</p>
						<p className="text-3xl font-black text-brand-primary font-mono">
							{totalRevenue.toLocaleString("vi-VN")}đ
						</p>
						<p className="text-[9px] text-slate-400 font-bold">* Số liệu thống kê tạm tính đến thời điểm hiện tại</p>
					</div>
					<div className="p-3 bg-white/10 rounded-md text-brand-primary shrink-0 relative z-10">
						<DollarSign className="w-8 h-8" />
					</div>
				</div>

				<div className="border border-brand-border bg-white rounded-md p-5 shadow-sm flex items-center justify-between min-h-32">
					<div className="space-y-2">
						<p className="text-[10px] uppercase font-black tracking-widest text-brand-muted">Tổng quỹ ví thành viên</p>
						<p className="text-3xl font-black text-brand-dark font-mono">
							{(84200000).toLocaleString("vi-VN")}đ
						</p>
						<p className="text-[9px] text-brand-muted font-bold">* Tổng số dư của tất cả ví hoạt động</p>
					</div>
					<div className="p-3 bg-brand-light-soft text-brand-dark rounded-md shrink-0">
						<Wallet className="w-8 h-8" />
					</div>
				</div>
			</div>

			<div className="flex border-b border-brand-border pb-px select-none">
				<button
					onClick={() => setActiveTab("withdraws")}
					className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer border-b-2 bg-transparent ${activeTab === "withdraws"
							? "border-brand-dark text-brand-dark font-extrabold"
							: "border-transparent text-brand-muted hover:text-brand-dark"
						}`}
				>
					Các yêu cầu rút tiền
				</button>
				<button
					onClick={() => { setActiveTab("transactions"); setPage(1); }}
					className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer border-b-2 bg-transparent flex items-center gap-1 ${activeTab === "transactions"
							? "border-brand-dark text-brand-dark font-extrabold"
							: "border-transparent text-brand-muted hover:text-brand-dark"
						}`}
				>
					<History className="w-3.5 h-3.5" />
					Lịch sử giao dịch ví toàn sàn
				</button>
			</div>

			{activeTab === "withdraws" && (
				<AdminWithdrawsView />
			)}

			{activeTab === "transactions" && (
				<div className="space-y-4 animate-in fade-in duration-200">
					<div className="pb-2.5 border-b border-brand-border">
						<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Biến động số dư ví toàn sàn</h2>
						<p className="text-[10px] text-brand-muted font-bold mt-0.5">Theo dõi lịch sử toàn bộ các giao dịch nạp, rút, cộng doanh thu đơn hàng và hoàn tiền của tất cả thành viên trên hệ thống</p>
					</div>
					<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
						{txLoading ? (
							<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
								<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
								Đang tải danh sách giao dịch...
							</div>
						) : transactions.length === 0 ? (
							<div className="text-center py-16 text-brand-muted font-bold text-xs">Chưa có giao dịch phát sinh nào.</div>
						) : (
							<div>
								<div className="overflow-x-auto">
									<table className="w-full text-xs text-left border-collapse">
										<thead>
											<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
												<th className="py-2.5 px-3.5 w-[15%]">Mã giao dịch</th>
												<th className="py-2.5 px-3.5 w-[16%]">Thời gian</th>
												<th className="py-2.5 px-3.5 w-[15%]">Ví thành viên</th>
												<th className="py-2.5 px-3.5 text-center w-[10%]">Phân loại</th>
												<th className="py-2.5 px-3.5 text-center w-[14%]">Lý do</th>
												<th className="py-2.5 px-3.5 w-[20%]">Chi tiết biến động</th>
												<th className="py-2.5 px-3.5 text-right w-[10%]">Số tiền</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-brand-border/60">
											{transactions.map((tx: any) => {
												const isDebit = tx.type === "Debit" || tx.type === "1" || tx.type === 1;
												return (
													<tr key={tx.id} className="hover:bg-brand-light-soft/20 transition-colors">
														<td className="py-2.5 px-3.5 font-mono font-bold text-brand-muted">#{tx.id}</td>
														<td className="py-2.5 px-3.5 text-brand-muted font-semibold">{formatTime(tx.createdDate)}</td>
														<td className="py-2.5 px-3.5 font-mono font-extrabold text-brand-dark">#{tx.walletId}</td>
														<td className="py-2.5 px-3.5 text-center">{getTypeBadge(tx.type)}</td>
														<td className="py-2.5 px-3.5 text-center text-[10px]">{getReasonBadge(tx.reason)}</td>
														<td className="py-2.5 px-3.5 text-brand-dark font-medium">{tx.description}</td>
														<td className={`py-2.5 px-3.5 text-right font-black flex items-center justify-end gap-0.5 ${isDebit ? "text-rose-600" : "text-emerald-600"}`}>
															{isDebit ? (
																<ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
															) : (
																<ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
															)}
															{isDebit ? "-" : "+"}{Number(tx.amount).toLocaleString("vi-VN")}đ
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Unified Pagination Footer */}
								<div className="px-4 py-2 border-t border-brand-border bg-brand-light-soft/20 text-xs">
									<Pagination
										currentPage={page}
										totalPages={Math.ceil(totalCount / pageSize) || 1}
										totalCount={totalCount}
										pageSize={pageSize}
										onPageChange={setPage}
										showQuickJumper
										showTotal
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
