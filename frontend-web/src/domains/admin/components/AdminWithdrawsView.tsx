import { useState, useEffect } from "react";
import { X, Check, Loader2, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/core/api/axiosInstance";
import { UploadImage } from "@/shared";

export function AdminWithdrawsView() {
	const [withdraws, setWithdraws] = useState<any[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState<string>("All");

	const [selectedItem, setSelectedItem] = useState<any>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const [showRejectForm, setShowRejectForm] = useState(false);
	const [showPaidForm, setShowPaidForm] = useState(false);
	const [adminNote, setAdminNote] = useState("");
	const [proofImageUrl, setProofImageUrl] = useState("");
	const [actionPending, setActionPending] = useState(false);

	const fetchWithdrawals = async () => {
		try {
			setLoading(true);
			const statusParam = filterStatus === "All" ? undefined : filterStatus;
			const response = await api.get("/admin/withdrawals", {
				params: {
					status: statusParam,
					page,
					pageSize
				}
			});
			const data = response.data?.value || response.data;
			if (data && typeof data === "object" && "items" in data) {
				setWithdraws(data.items);
				setTotalCount(data.totalCount || data.items.length);
			} else {
				const list = Array.isArray(data) ? data : [];
				setWithdraws(list);
				setTotalCount(list.length);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách rút tiền:", err);
			const mockData = [
				{ id: "W-84729104", createdDate: new Date(Date.now() - 3600000 * 2).toISOString(), userId: 2, fullName: "Tường Vân", bankName: "Vietcombank", bankAccountNumber: "1028372839", bankAccountHolder: "DUONG TUONG VAN", amount: 1500000, status: "Pending", adminNote: "", proofImageUrl: "" },
				{ id: "W-73928192", createdDate: new Date(Date.now() - 3600000 * 24).toISOString(), userId: 5, fullName: "Minh Thư", bankName: "Techcombank", bankAccountNumber: "1902837281", bankAccountHolder: "HOANG MINH THU", amount: 450000, status: "Approved", adminNote: "", proofImageUrl: "" },
				{ id: "W-62810382", createdDate: new Date(Date.now() - 3600000 * 48).toISOString(), userId: 12, fullName: "Hải Đăng", bankName: "MB Bank", bankAccountNumber: "9902837283", bankAccountHolder: "NGUYEN HAI DANG", amount: 2000000, status: "Paid", adminNote: "Đã chuyển qua SmartBanking", proofImageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=300" }
			];
			const statusParam = filterStatus === "All" ? undefined : filterStatus;
			const filtered = mockData.filter(x => !statusParam || x.status === statusParam);
			setWithdraws(filtered);
			setTotalCount(filtered.length);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchWithdrawals();
	}, [filterStatus, page]);

	const handleReviewWithdraw = (item: any) => {
		setSelectedItem(item);
		setIsDetailOpen(true);
		setShowRejectForm(false);
		setShowPaidForm(false);
		setAdminNote("");
		setProofImageUrl("");
	};

	const handleApprove = async () => {
		if (!selectedItem) return;
		setActionPending(true);
		try {
			await api.put(`/admin/withdrawals/${selectedItem.id}/approve`);
			toast.success("Đã phê duyệt yêu cầu rút tiền thành công!");
			const updatedItem = { ...selectedItem, status: "Approved" };
			setSelectedItem(updatedItem);
			fetchWithdrawals();
		} catch (err: any) {
			toast.error(err.response?.data || "Phê duyệt thất bại. Vui lòng thử lại!");
		} finally {
			setActionPending(false);
		}
	};

	const handleRejectSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedItem) return;
		if (!adminNote.trim()) {
			toast.error("Vui lòng nhập lý do từ chối!");
			return;
		}

		setActionPending(true);
		try {
			await api.put(`/admin/withdrawals/${selectedItem.id}/reject`, {
				adminNote: adminNote.trim()
			});
			toast.warn("Đã từ chối yêu cầu rút tiền.");
			setIsDetailOpen(false);
			setSelectedItem(null);
			fetchWithdrawals();
		} catch (err: any) {
			toast.error(err.response?.data || "Từ chối thất bại.");
		} finally {
			setActionPending(false);
			setShowRejectForm(false);
		}
	};

	const handlePaidSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedItem) return;

		setActionPending(true);
		try {
			await api.put(`/admin/withdrawals/${selectedItem.id}/complete`, {
				adminNote: adminNote.trim() || undefined,
				proofImageUrl: proofImageUrl.trim() || undefined
			});
			toast.success("Xác nhận chuyển khoản rút tiền thành công!");
			setIsDetailOpen(false);
			setSelectedItem(null);
			fetchWithdrawals();
		} catch (err: any) {
			toast.error(err.response?.data || "Xác nhận chuyển khoản thất bại.");
		} finally {
			setActionPending(false);
			setShowPaidForm(false);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "Pending":
				return <span className="px-2 py-0.5 rounded-[5px] text-[9px] font-black uppercase bg-yellow-50 text-yellow-700 border border-yellow-200">Đang chờ</span>;
			case "Approved":
				return <span className="px-2 py-0.5 rounded-[5px] text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">Đã duyệt</span>;
			case "Paid":
			case "Completed":
				return <span className="px-2 py-0.5 rounded-[5px] text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Đã trả tiền</span>;
			case "Rejected":
				return <span className="px-2 py-0.5 rounded-[5px] text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">Từ chối</span>;
			default:
				return <span className="px-2 py-0.5 rounded-[5px] text-[9px] font-black uppercase bg-gray-50 text-gray-600 border border-gray-200">{status}</span>;
		}
	};

	const openUserTab = (userId: any) => {
		window.open(`/users/${userId}`, "_blank");
	};

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Yêu cầu rút tiền từ ví</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Duyệt các yêu cầu rút doanh thu về tài khoản ngân hàng của người bán</p>
				</div>
				<div className="flex items-center gap-2">
					<select 
						value={filterStatus}
						onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
						className="px-2.5 h-8 border border-brand-border rounded-lg bg-white font-bold text-xs focus:outline-none focus:border-brand-primary"
					>
						<option value="All">Tất cả trạng thái</option>
						<option value="Pending">Đang chờ (Pending)</option>
						<option value="Approved">Đã duyệt (Approved)</option>
						<option value="Paid">Đã trả (Paid)</option>
						<option value="Rejected">Từ chối (Rejected)</option>
					</select>
					<button onClick={fetchWithdrawals} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent">
						<RefreshCw className="w-4 h-4 animate-hover" />
					</button>
				</div>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách...
					</div>
				) : withdraws.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có yêu cầu rút tiền nào tương ứng.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-[15%]">Mã yêu cầu</th>
								<th className="p-3 w-[22%]">Thành viên rút</th>
								<th className="p-3 w-[15%] text-right">Số tiền</th>
								<th className="p-3 w-[23%]">Tài khoản ngân hàng</th>
								<th className="p-3 text-center w-[12%]">Trạng thái</th>
								<th className="p-3 text-center w-[13%]">Thao tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{withdraws.map((w: any) => (
								<tr key={w.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-mono font-bold text-brand-muted">#{w.id.split("-")[0]}</td>
									<td className="p-3">
										<button 
											onClick={() => openUserTab(w.userId)}
											className="font-black text-brand-dark hover:text-brand-primary-deep text-left underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
										>
											{w.fullName} <ExternalLink className="w-3 h-3 text-brand-muted" />
										</button>
										<p className="text-[9px] text-brand-muted font-bold mt-0.5">User ID: {w.userId}</p>
									</td>
									<td className="p-3 text-right font-black text-brand-dark">{Number(w.amount).toLocaleString("vi-VN")}đ</td>
									<td className="p-3">
										<p className="font-extrabold text-brand-dark uppercase">{w.bankName}</p>
										<p className="text-[9.5px] text-brand-muted font-medium mt-0.5">
											{w.bankAccountNumber} • <span className="uppercase font-bold text-brand-dark">{w.bankAccountHolder}</span>
										</p>
									</td>
									<td className="p-3 text-center">{getStatusBadge(w.status)}</td>
									<td className="p-3 text-center">
										<button 
											onClick={() => handleReviewWithdraw(w)}
											className="px-2.5 py-1 bg-brand-light-soft text-brand-dark hover:bg-brand-primary hover:text-brand-dark rounded-lg text-[9px] font-black transition-all cursor-pointer border-none"
										>
											Xem chi tiết
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{totalCount > pageSize && (
				<div className="flex justify-between items-center pt-2">
					<span className="text-[10px] text-brand-muted font-bold">
						Hiển thị {withdraws.length} / {totalCount} yêu cầu rút
					</span>
					<div className="flex items-center gap-1.5 text-xs font-black">
						<button
							disabled={page === 1}
							onClick={() => setPage(p => p - 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Trước
						</button>
						{Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, idx) => (
							<button
								key={idx}
								onClick={() => setPage(idx + 1)}
								className={`w-7 h-7 rounded-lg transition-all cursor-pointer border-none ${
									page === idx + 1 ? "bg-brand-dark text-white font-mono" : "bg-transparent text-brand-muted hover:bg-brand-light-soft"
								}`}
							>
								{idx + 1}
							</button>
						))}
						<button
							disabled={page >= Math.ceil(totalCount / pageSize)}
							onClick={() => setPage(p => p + 1)}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-lg hover:bg-brand-light-soft disabled:opacity-40 transition-all cursor-pointer"
						>
							Sau
						</button>
					</div>
				</div>
			)}

			{isDetailOpen && selectedItem && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-2xl w-full max-w-md shadow-2xl p-6 text-left space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center border-b border-brand-border pb-3">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">
								Chi tiết yêu cầu rút tiền
							</h3>
							<button 
								onClick={() => { setIsDetailOpen(false); setSelectedItem(null); }}
								className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm border-none bg-transparent"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-3 text-xs font-bold text-brand-dark">
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Mã yêu cầu</span>
								<span className="font-mono">#{selectedItem.id}</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Thành viên</span>
								<button 
									onClick={() => openUserTab(selectedItem.userId)}
									className="font-black text-brand-dark hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
								>
									{selectedItem.fullName} (ID: {selectedItem.userId}) <ExternalLink className="w-3 h-3 text-brand-muted" />
								</button>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Số tiền rút</span>
								<span className="text-brand-primary-deep text-sm font-black">{Number(selectedItem.amount).toLocaleString("vi-VN")}đ</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Ngân hàng nhận</span>
								<span className="uppercase">{selectedItem.bankName}</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Số tài khoản</span>
								<span className="font-mono text-brand-muted">{selectedItem.bankAccountNumber}</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Chủ tài khoản</span>
								<span className="uppercase">{selectedItem.bankAccountHolder}</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-brand-muted font-bold">Thời gian tạo</span>
								<span className="text-brand-muted font-semibold">{new Date(selectedItem.createdDate).toLocaleString("vi-VN")}</span>
							</div>
							{selectedItem.adminNote && (
								<div className="flex justify-between py-1 border-b border-slate-100">
									<span className="text-brand-muted font-bold">Ghi chú của Admin</span>
									<span className="text-brand-muted font-semibold italic">{selectedItem.adminNote}</span>
								</div>
							)}
							{selectedItem.proofImageUrl && (
								<div className="space-y-1.5 py-1 border-b border-slate-100">
									<span className="text-brand-muted font-bold block">Minh chứng chuyển khoản:</span>
									<a href={selectedItem.proofImageUrl} target="_blank" rel="noreferrer" className="block max-w-[120px] rounded-lg overflow-hidden border border-brand-border shadow-xs hover:opacity-90">
										<img src={selectedItem.proofImageUrl} alt="Proof of payment" className="w-full h-auto object-cover" />
									</a>
								</div>
							)}
							<div className="flex justify-between py-1">
								<span className="text-brand-muted font-bold">Trạng thái</span>
								<span>{getStatusBadge(selectedItem.status)}</span>
							</div>
						</div>

						{showRejectForm && (
							<form onSubmit={handleRejectSubmit} className="border border-red-200 bg-red-50/30 p-3.5 rounded-xl space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
								<div className="flex items-center gap-1.5 text-red-700 font-extrabold text-[11px] uppercase">
									<AlertTriangle className="w-4 h-4 text-red-600" />
									Nhập lý do từ chối yêu cầu
								</div>
								<textarea
									required
									placeholder="Ví dụ: Số tài khoản ngân hàng không hợp lệ, tên không khớp..."
									value={adminNote}
									onChange={(e) => setAdminNote(e.target.value)}
									rows={3}
									className="w-full border border-brand-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white font-medium text-brand-dark"
								/>
								<div className="flex justify-end gap-2 text-xs pt-1">
									<button type="button" onClick={() => setShowRejectForm(false)} className="px-3 py-1 bg-white hover:bg-slate-100 rounded-lg font-bold border border-brand-border cursor-pointer">Hủy</button>
									<button type="submit" disabled={actionPending} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black cursor-pointer border-none flex items-center gap-1">
										{actionPending && <Loader2 className="w-3 animate-spin" />}
										Xác nhận từ chối
									</button>
								</div>
							</form>
						)}

						{showPaidForm && (
							<form onSubmit={handlePaidSubmit} className="border border-emerald-200 bg-emerald-50/20 p-3.5 rounded-xl space-y-3 animate-in slide-in-from-bottom-2 duration-200">
								<div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] uppercase">
									<Check className="w-4 h-4 text-emerald-600" />
									Xác nhận thanh toán rút tiền
								</div>
								
								<div className="space-y-1">
									<label className="block text-[9px] font-black uppercase text-brand-muted">Ghi chú giao dịch (Tùy chọn)</label>
									<input 
										type="text" 
										placeholder="Ví dụ: Đã chuyển khoản qua App Vietcombank..."
										value={adminNote}
										onChange={(e) => setAdminNote(e.target.value)}
										className="w-full px-2.5 h-8 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark"
									/>
								</div>

								<div className="space-y-1">
									<label className="block text-[9px] font-black uppercase text-brand-muted">Minh chứng thanh toán (Tải ảnh lên)</label>
									<UploadImage 
										value={proofImageUrl} 
										onChange={setProofImageUrl} 
										className="w-24 h-24 rounded-lg mt-1" 
									/>
								</div>

								<div className="flex justify-end gap-2 text-xs pt-1">
									<button type="button" onClick={() => setShowPaidForm(false)} className="px-3 py-1 bg-white hover:bg-slate-100 rounded-lg font-bold border border-brand-border cursor-pointer">Hủy</button>
									<button type="submit" disabled={actionPending} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black cursor-pointer border-none flex items-center gap-1">
										{actionPending && <Loader2 className="w-3 animate-spin" />}
										Xác nhận hoàn thành
									</button>
								</div>
							</form>
						)}

						{!showRejectForm && !showPaidForm && (
							<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
								{selectedItem.status === "Pending" && (
									<>
										<button 
											onClick={() => { setShowRejectForm(true); setAdminNote(""); }}
											className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl cursor-pointer border-none text-xs transition-colors"
										>
											Từ chối duyệt
										</button>
										<button 
											onClick={handleApprove}
											disabled={actionPending}
											className="px-4 py-2 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white font-black rounded-xl cursor-pointer border-none text-xs transition-all shadow-sm flex items-center gap-1"
										>
											{actionPending && <Loader2 className="w-3 h-3 animate-spin" />}
											Phê duyệt (Approve)
										</button>
									</>
								)}

								{selectedItem.status === "Approved" && (
									<>
										<button 
											onClick={() => { setShowRejectForm(true); setAdminNote(""); }}
											className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl cursor-pointer border-none text-xs transition-colors"
										>
											Từ chối duyệt
										</button>
										<button 
											onClick={() => { setShowPaidForm(true); setAdminNote(""); setProofImageUrl(""); }}
											className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer border-none text-xs transition-all shadow-md flex items-center gap-1.5"
										>
											<Check className="w-4 h-4" />
											Đã thanh toán (Mark as Paid)
										</button>
									</>
								)}

								{(selectedItem.status === "Paid" || selectedItem.status === "Completed" || selectedItem.status === "Rejected") && (
									<button 
										onClick={() => { setIsDetailOpen(false); setSelectedItem(null); }}
										className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer border-none text-xs transition-colors"
									>
										Đóng lại
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
