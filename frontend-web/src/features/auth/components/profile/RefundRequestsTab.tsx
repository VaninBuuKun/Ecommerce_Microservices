import React, { useState } from "react";
import { useMyRefundsQuery, useCancelRefundMutation } from "../../../order/hooks/useCheckoutQueries";
import { Loader2, AlertTriangle, RefreshCw, Trash2, ArrowLeftRight } from "lucide-react";
import { toast } from "react-toastify";

export function RefundRequestsTab() {
	const { data: refunds, isLoading, error, refetch } = useMyRefundsQuery();
	const cancelRefundMutation = useCancelRefundMutation();

	const [cancelingId, setCancelingId] = useState<string | null>(null);

	const handleCancelRefund = (id: string) => {
		cancelRefundMutation.mutate(id, {
			onSuccess: () => {
				toast.success("Rút yêu cầu hoàn tiền thành công! Đơn hàng đã được khôi phục về trạng thái Đang giao.");
				setCancelingId(null);
			},
			onError: (err: any) => {
				toast.error(err?.response?.data || "Không thể rút yêu cầu hoàn tiền.");
			}
		});
	};

	const getRefundStatusBadge = (status: string) => {
		switch (status) {
			case "Pending":
				return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-bold text-[10px] uppercase">Chờ duyệt</span>;
			case "Approved":
				return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold text-[10px] uppercase">Đã hoàn tiền</span>;
			case "Rejected":
				return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px] uppercase">Đã từ chối</span>;
			default:
				return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-bold text-[10px] uppercase">{status}</span>;
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách yêu cầu hoàn tiền...
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12 text-red-600 font-bold text-xs space-y-3">
				<p>Đã xảy ra lỗi khi tải danh sách yêu cầu hoàn tiền.</p>
				<button onClick={() => refetch()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-brand-dark cursor-pointer font-bold inline-flex items-center gap-1.5">
					<RefreshCw className="w-3.5 h-3.5" /> Tải lại
				</button>
			</div>
		);
	}

	if (!refunds || refunds.length === 0) {
		return (
			<div className="text-center py-16 text-brand-muted font-semibold text-xs space-y-2">
				<ArrowLeftRight className="w-8 h-8 mx-auto text-brand-border/60" />
				<p>Bạn chưa gửi yêu cầu hoàn tiền / trả hàng nào.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 text-left font-sans">
			<div className="flex justify-between items-center border-b border-brand-border pb-3">
				<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">
					Lịch sử yêu cầu hoàn tiền
				</h3>
				<button onClick={() => refetch()} className="p-1.5 text-brand-muted hover:text-brand-dark rounded cursor-pointer transition-all">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-2xl bg-white overflow-hidden shadow-sm">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
							<th className="p-3 w-1/4">Mã đơn con</th>
							<th className="p-3 w-1/5">Ngày yêu cầu</th>
							<th className="p-3 w-1/4">Lý do hoàn trả</th>
							<th className="p-3 text-right w-1/6">Số tiền</th>
							<th className="p-3 text-center w-1/6">Trạng thái</th>
							<th className="p-3 text-center w-1/12">Thao tác</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-border text-xs">
						{refunds.map((refund: any) => (
							<tr key={refund.id} className="hover:bg-brand-light-soft/10">
								<td className="p-3 font-mono font-bold text-brand-dark">
									#{refund.subOrderId.split("-")[0]}
								</td>
								<td className="p-3 text-brand-muted">
									{new Date(refund.createdDate).toLocaleDateString("vi-VN")}
								</td>
								<td className="p-3 font-medium text-brand-dark">
									{refund.reason}
								</td>
								<td className="p-3 text-right font-black text-brand-dark">
									{Number(refund.refundAmount).toLocaleString("vi-VN")}đ
								</td>
								<td className="p-3 text-center">
									{getRefundStatusBadge(refund.status)}
								</td>
								<td className="p-3 text-center">
									{refund.status === "Pending" ? (
										<button
											type="button"
											onClick={() => setCancelingId(refund.id)}
											className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-all inline-flex items-center justify-center"
											title="Rút yêu cầu hoàn tiền"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									) : (
										<span className="text-brand-muted text-[10px] font-semibold">-</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Modal xác nhận rút yêu cầu hoàn tiền */}
			{cancelingId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-xl max-w-md w-full border border-brand-border p-5 shadow-xl space-y-4">
						<div className="flex gap-2.5 items-start text-red-600">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<h3 className="font-black text-brand-dark text-sm uppercase">Xác nhận rút yêu cầu hoàn tiền</h3>
						</div>
						<div className="text-brand-muted text-xs leading-relaxed space-y-2 font-medium">
							<p>
								Hành động này sẽ xóa hoàn toàn yêu cầu hoàn tiền hiện tại và khôi phục lại đơn hàng của bạn về trạng thái giao hàng bình thường.
							</p>
							<p className="font-bold text-brand-dark">
								Bạn có chắc chắn muốn rút yêu cầu này không?
							</p>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setCancelingId(null)}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-xs cursor-pointer"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={() => handleCancelRefund(cancelingId)}
								disabled={cancelRefundMutation.isPending}
								className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-xs cursor-pointer disabled:opacity-50"
							>
								{cancelRefundMutation.isPending ? "Đang xử lý..." : "Đồng ý rút yêu cầu"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
