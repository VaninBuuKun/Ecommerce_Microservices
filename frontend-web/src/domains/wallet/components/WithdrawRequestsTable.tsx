import React, { useState } from "react";
import { Loader2, X, Eye, Image } from "lucide-react";

interface WithdrawRequestsTableProps {
	withdrawsLoading: boolean;
	paginatedWithdraws: any[];
	totalWithdraws: number;
	withdrawPage: number;
	pageSize: number;
	setWithdrawPage: (page: number) => void;
	getWithdrawStatusBadge: (status: string) => React.ReactNode;
}

export function WithdrawRequestsTable({
	withdrawsLoading,
	paginatedWithdraws,
	totalWithdraws,
	withdrawPage,
	pageSize,
	setWithdrawPage,
	getWithdrawStatusBadge,
}: WithdrawRequestsTableProps) {
	// State for viewing admin feedback details
	const [selectedItem, setSelectedItem] = useState<any>(null);

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

	return (
		<div className="space-y-3 animate-in fade-in duration-200">
			<div className="border border-brand-border rounded-2xl bg-white overflow-hidden shadow-sm">
				{withdrawsLoading ? (
					<div className="flex justify-center items-center py-12 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tải yêu cầu rút tiền...
					</div>
				) : paginatedWithdraws.length === 0 ? (
					<div className="text-center py-12 text-brand-muted font-semibold text-xs">
						Bạn chưa gửi yêu cầu rút tiền nào trên hệ thống.
					</div>
				) : (
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-[12%]">Mã yêu cầu</th>
								<th className="p-3 w-[15%]">Thời gian tạo</th>
								<th className="p-3 w-[16%] text-right">Số tiền rút</th>
								<th className="p-3 w-[28%]">Ngân hàng nhận</th>
								<th className="p-3 text-center w-[17%]">Trạng thái</th>
								<th className="p-3 text-center w-[12%]">Thao tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border text-xs">
							{paginatedWithdraws.map((w: any, idx: number) => (
								<tr key={idx} className="hover:bg-brand-light-soft/10">
									<td className="p-3 font-mono font-bold text-brand-muted">#{w.id.split("-")[0]}</td>
									<td className="p-3 text-brand-muted font-semibold">{formatTime(w.createdDate || w.createdAt)}</td>
									<td className="p-3 text-right font-black text-brand-dark">{Number(w.amount).toLocaleString("vi-VN")}đ</td>
									<td className="p-3">
										<p className="font-extrabold text-brand-dark uppercase">{w.bankName}</p>
										<p className="text-[10px] text-brand-muted font-medium mt-0.5">
											{w.bankAccountNumber} • <span className="uppercase font-bold text-brand-dark">{w.bankAccountHolder}</span>
										</p>
									</td>
									<td className="p-3 text-center">{getWithdrawStatusBadge(w.status)}</td>
									<td className="p-3 text-center">
										{w.status !== "Pending" ? (
											<button
												onClick={() => setSelectedItem(w)}
												className="p-1 text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft rounded-lg cursor-pointer transition-all border-none bg-transparent inline-flex items-center justify-center"
												title="Xem phản hồi của Admin"
											>
												<Eye className="w-4 h-4" />
											</button>
										) : (
											<span className="text-[10px] text-brand-muted italic font-bold">-</span>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Phân trang Withdrawals */}
			{totalWithdraws > pageSize && (
				<div className="flex justify-between items-center pt-2">
					<span className="text-[10px] text-brand-muted font-bold">
						Hiển thị {paginatedWithdraws.length} / {totalWithdraws} yêu cầu
					</span>
					<div className="flex items-center gap-1 text-xs font-black">
						<button
							disabled={withdrawPage === 1}
							onClick={() => setWithdrawPage(withdrawPage - 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Trước
						</button>
						{Array.from({ length: Math.ceil(totalWithdraws / pageSize) }).map((_, i) => (
							<button
								key={i}
								onClick={() => setWithdrawPage(i + 1)}
								className={`w-7 h-7 rounded-lg transition-all cursor-pointer border-none ${
									withdrawPage === i + 1 ? "bg-brand-dark text-white font-mono" : "bg-transparent text-brand-muted hover:bg-brand-light-soft"
								}`}
							>
								{i + 1}
							</button>
						))}
						<button
							disabled={withdrawPage >= Math.ceil(totalWithdraws / pageSize)}
							onClick={() => setWithdrawPage(withdrawPage + 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Sau
						</button>
					</div>
				</div>
			)}

			{/* ADMIN FEEDBACK DETAIL MODAL */}
			{selectedItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-2xl max-w-sm w-full border border-brand-border p-5 shadow-2xl space-y-4 text-left">
						<div className="flex justify-between items-center border-b border-brand-border pb-3">
							<h3 className="font-black text-brand-dark text-xs uppercase tracking-wide flex items-center gap-1.5">
								Phản hồi từ Ban Quản Trị
							</h3>
							<button 
								onClick={() => setSelectedItem(null)}
								className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm border-none bg-transparent"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-3.5 text-xs text-brand-dark font-bold">
							<div className="space-y-1">
								<span className="text-[10px] text-brand-muted uppercase block">Ghi chú của Admin:</span>
								<p className="bg-brand-light-soft/50 border border-brand-border rounded-xl p-3 text-xs text-brand-dark font-medium leading-relaxed italic">
									{selectedItem.adminNote || "Không có ghi chú phản hồi nào."}
								</p>
							</div>

							<div className="space-y-1">
								<span className="text-[10px] text-brand-muted uppercase block">Minh chứng chuyển khoản:</span>
								{selectedItem.proofImageUrl ? (
									<div className="space-y-2 mt-1">
										<a 
											href={selectedItem.proofImageUrl} 
											target="_blank" 
											rel="noreferrer" 
											className="block max-w-[150px] border border-brand-border rounded-xl overflow-hidden shadow-xs hover:opacity-90 transition-all"
										>
											<img 
												src={selectedItem.proofImageUrl} 
												alt="Minh chứng chuyển khoản" 
												className="w-full h-auto object-cover" 
											/>
										</a>
										<p className="text-[9px] text-brand-muted font-medium flex items-center gap-1">
											<Image className="w-3.5 h-3.5 text-brand-muted" /> Click vào ảnh để phóng to
										</p>
									</div>
								) : (
									<p className="text-brand-muted font-medium italic pl-1">Không có ảnh minh chứng đính kèm.</p>
								)}
							</div>
						</div>

						<div className="pt-2 flex justify-end">
							<button
								onClick={() => setSelectedItem(null)}
								className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-none text-xs"
							>
								Đóng
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
