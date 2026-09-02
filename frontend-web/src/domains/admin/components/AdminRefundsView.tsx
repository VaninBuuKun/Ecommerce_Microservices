import { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import { Loader2, RefreshCw, Undo2 } from "lucide-react";
import { Pagination } from "@/shared/components/Pagination";

export function AdminRefundsView() {
	const [refunds, setRefunds] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const fetchRefunds = async () => {
		try {
			setLoading(true);
			const response = await api.get("/refunds/my-requests"); 
			const items = response.data?.value || response.data || [];
			setRefunds(Array.isArray(items) ? items : []);
		} catch (err) {
			console.error("Lỗi khi tải danh sách hoàn tiền", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRefunds();
	}, []);

	const totalCount = refunds.length;
	const totalPages = Math.ceil(totalCount / pageSize) || 1;
	const paginatedRefunds = refunds.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Yêu cầu hoàn trả & hoàn tiền
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Danh sách các yêu cầu khiếu nại hoàn trả hàng của khách hàng gửi cho shop
					</p>
				</div>
				<button
					onClick={fetchRefunds}
					className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
					title="Làm mới"
				>
					<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-primary" : ""}`} />
				</button>
			</div>

			{/* Table Card */}
			<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-xs">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách khiếu nại...
					</div>
				) : refunds.length === 0 ? (
					<div className="text-center py-16 text-brand-muted space-y-2">
						<Undo2 className="w-10 h-10 mx-auto text-brand-muted/50" />
						<p className="font-bold text-xs">Không có yêu cầu hoàn tiền nào trên hệ thống.</p>
					</div>
				) : (
					<div>
						<div className="overflow-x-auto">
							<table className="w-full text-xs text-left border-collapse">
								<thead>
									<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
										<th className="py-2.5 px-3.5 w-1/4">Mã đơn con</th>
										<th className="py-2.5 px-3.5 w-2/5">Lý do hoàn tiền</th>
										<th className="py-2.5 px-3.5 text-right w-1/5">Số tiền</th>
										<th className="py-2.5 px-3.5 text-center w-1/6">Trạng thái</th>
										<th className="py-2.5 px-3.5 text-center w-1/12">Hành động</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border/60">
									{paginatedRefunds.map((r: any) => (
										<tr key={r.id} className="hover:bg-brand-light-soft/20 transition-colors">
											<td className="py-2.5 px-3.5 font-mono font-bold text-brand-dark">#{r.subOrderId}</td>
											<td className="py-2.5 px-3.5 text-brand-dark font-semibold">{r.reason}</td>
											<td className="py-2.5 px-3.5 text-right font-black text-brand-dark">{Number(r.refundAmount).toLocaleString("vi-VN")}đ</td>
											<td className="py-2.5 px-3.5 text-center">
												<span
													className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
														r.status === "Pending"
															? "bg-amber-50 text-amber-700 border border-amber-200"
															: r.status === "Approved"
															? "bg-emerald-50 text-emerald-700 border border-emerald-200"
															: "bg-red-50 text-red-700 border border-red-200"
													}`}
												>
													{r.status === "Pending" ? "Chờ duyệt" : r.status === "Approved" ? "Chấp nhận" : "Từ chối"}
												</span>
											</td>
											<td className="py-2.5 px-3.5 text-center text-brand-muted font-semibold">-</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Unified Pagination Footer */}
						<div className="px-4 py-2 border-t border-brand-border bg-brand-light-soft/20 text-xs">
							<Pagination
								currentPage={page}
								totalPages={totalPages}
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
	);
}
export default AdminRefundsView;
