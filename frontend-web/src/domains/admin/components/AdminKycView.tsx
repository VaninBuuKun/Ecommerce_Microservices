import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldAlert, CheckCircle, XCircle, Eye, Loader2, RefreshCw, AlertCircle, FileText, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { useAdminKycsQuery, useApproveKycMutation, useRejectKycMutation } from "../hooks/useAdmin";
import { Pagination } from "@/shared/components/Pagination";

export function AdminKycView() {
	const [statusFilter, setStatusFilter] = useState<string>("Submitted");
	const [page, setPage] = useState(1);
	const pageSize = 8;
	const [searchQuery, setSearchQuery] = useState("");

	const { data: kycsData, isLoading, isError, refetch } = useAdminKycsQuery({
		page,
		pageSize,
		status: statusFilter !== "ALL" ? statusFilter : undefined,
	});

	const approveKycMutation = useApproveKycMutation();
	const rejectKycMutation = useRejectKycMutation();

	// Modal States for Preview & Rejection
	const [previewKyc, setPreviewKyc] = useState<any>(null);
	const [rejectTargetKyc, setRejectTargetKyc] = useState<any>(null);
	const [rejectReason, setRejectReason] = useState("");

	const rawItems = kycsData?.items || (Array.isArray(kycsData) ? kycsData : []);
	const totalCount = kycsData?.totalCount ?? rawItems.length;
	const totalPages = kycsData?.totalPages ?? (Math.ceil(totalCount / pageSize) || 1);

	// Client search filter on current page items
	const paginatedKycs = rawItems.filter((item: any) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase().trim();
		return (
			item.identityCardNumber?.toLowerCase().includes(query) ||
			item.idCardNumber?.toLowerCase().includes(query) ||
			String(item.userId)?.includes(query)
		);
	});

	const handleApprove = async (kycId: number) => {
		if (!window.confirm("Bạn có chắc chắn muốn PHÊ DUYỆT hồ sơ KYC này?")) return;
		try {
			await approveKycMutation.mutateAsync(kycId);
			toast.success("Phê duyệt hồ sơ KYC thành công!");
			if (previewKyc?.id === kycId) setPreviewKyc(null);
		} catch (err: any) {
			toast.error(`Phê duyệt thất bại: ${err?.response?.data || err.message}`);
		}
	};

	const handleConfirmReject = async () => {
		if (!rejectTargetKyc) return;
		if (!rejectReason.trim()) {
			toast.warning("Vui lòng nhập lý do từ chối!");
			return;
		}

		try {
			await rejectKycMutation.mutateAsync({
				kycId: rejectTargetKyc.id,
				reason: rejectReason.trim(),
			});
			toast.info("Đã từ chối hồ sơ KYC thành công.");
			setRejectTargetKyc(null);
			setRejectReason("");
			if (previewKyc?.id === rejectTargetKyc.id) setPreviewKyc(null);
		} catch (err: any) {
			toast.error(`Từ chối thất bại: ${err?.response?.data || err.message}`);
		}
	};

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
						<ShieldAlert className="w-4 h-4 text-brand-primary-deep" />
						Quản lý hồ sơ định danh KYC
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Xét duyệt các hồ sơ định danh cá nhân (CCCD/CMND) do người bán đăng ký
					</p>
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="relative flex-1 sm:w-60">
						<input
							type="text"
							placeholder="Tìm theo số CCCD, Mã người dùng..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark bg-white"
						/>
						<FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
					</div>
					<button
						onClick={() => refetch()}
						title="Làm mới"
						className="p-1.5 text-brand-muted hover:text-brand-dark rounded-lg hover:bg-brand-light-soft transition-colors cursor-pointer border border-brand-border bg-white shrink-0"
					>
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Status Filter Tabs */}
			<div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-brand-border w-fit text-xs font-bold">
				{[
					{ label: "Chờ duyệt", value: "Submitted" },
					{ label: "Đã phê duyệt", value: "Verified" },
					{ label: "Từ chối", value: "Rejected" },
					{ label: "Tất cả", value: "ALL" },
				].map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => {
							setStatusFilter(tab.value);
							setPage(1);
						}}
						className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
							statusFilter === tab.value
								? "bg-brand-dark text-white shadow-xs"
								: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Main Table */}
			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-semibold text-brand-dark border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-brand-muted uppercase text-[10px] tracking-wider font-extrabold select-none">
								<th className="py-3 px-4">Mã hồ sơ</th>
								<th className="py-3 px-4">Mã User</th>
								<th className="py-3 px-4">Số CCCD</th>
								<th className="py-3 px-4">Trạng thái</th>
								<th className="py-3 px-4">Hình ảnh CCCD</th>
								<th className="py-3 px-4 text-center">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border/60">
							{isLoading ? (
								<tr>
									<td colSpan={6} className="py-16 text-center text-brand-muted">
										<div className="flex items-center justify-center gap-2">
											<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
											Đang tải danh sách hồ sơ KYC...
										</div>
									</td>
								</tr>
							) : isError ? (
								<tr>
									<td colSpan={6} className="py-16 text-center text-red-500 font-bold">
										Không thể tải danh sách KYC. Vui lòng thử lại sau.
									</td>
								</tr>
							) : paginatedKycs.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-16 text-center text-brand-muted font-bold">
										Không có hồ sơ KYC nào đang chờ duyệt.
									</td>
								</tr>
							) : (
								paginatedKycs.map((item: any) => {
									const idNumber = item.identityCardNumber || item.idCardNumber || "—";
									const frontUrl = item.identityCardFrontUrl || item.idCardFrontUrl;
									const backUrl = item.identityCardBackUrl || item.idCardBackUrl;

									return (
										<tr key={item.id} className="hover:bg-brand-light-soft/20 transition-colors">
											<td className="py-3 px-4 font-mono font-bold">#{item.id}</td>
											<td className="py-3 px-4 font-bold text-brand-primary-deep">
												User #{item.userId}
											</td>
											<td className="py-3 px-4 font-extrabold tracking-wide">
												{idNumber}
											</td>
											<td className="py-3 px-4">
												<span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold rounded uppercase">
													{item.status || "Submitted"}
												</span>
											</td>
											<td className="py-3 px-4">
												<div className="flex items-center gap-2">
													{frontUrl && (
														<img
															src={frontUrl}
															alt="Mặt trước"
															className="w-10 h-7 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
															onClick={() => setPreviewKyc(item)}
														/>
													)}
													{backUrl && (
														<img
															src={backUrl}
															alt="Mặt sau"
															className="w-10 h-7 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
															onClick={() => setPreviewKyc(item)}
														/>
													)}
												</div>
											</td>
											<td className="py-3 px-4 text-center">
												<div className="flex items-center justify-center gap-1.5">
													<button
														onClick={() => setPreviewKyc(item)}
														title="Xem chi tiết"
														className="p-1.5 bg-brand-light-soft text-brand-dark hover:bg-brand-border rounded font-bold transition-colors cursor-pointer border-none flex items-center justify-center"
													>
														<Eye className="w-3.5 h-3.5" />
													</button>
													<button
														onClick={() => handleApprove(item.id)}
														disabled={approveKycMutation.isPending}
														title="Duyệt hồ sơ"
														className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded font-bold transition-colors cursor-pointer border-none flex items-center justify-center"
													>
														<CheckCircle className="w-3.5 h-3.5" />
													</button>
													<button
														onClick={() => {
															setRejectTargetKyc(item);
															setRejectReason("");
														}}
														disabled={rejectKycMutation.isPending}
														title="Từ chối"
														className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold transition-colors cursor-pointer border-none flex items-center justify-center"
													>
														<XCircle className="w-3.5 h-3.5" />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Unified Pagination */}
				{totalPages > 1 && (
					<div className="p-4 border-t border-brand-border/60 bg-white flex justify-center items-center">
						<Pagination
							currentPage={page}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</div>
				)}
			</div>

			{/* Modal Preview Giấy Tờ KYC */}
			{previewKyc &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
						<div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-left font-sans animate-in zoom-in-95 duration-200">
							<div className="flex justify-between items-center pb-3 border-b border-brand-border">
								<h3 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
									<ShieldAlert className="w-4 h-4 text-brand-primary" />
									Chi tiết hồ sơ KYC #{previewKyc.id} (User #{previewKyc.userId})
								</h3>
								<button
									onClick={() => setPreviewKyc(null)}
									className="text-brand-muted hover:text-brand-dark font-bold text-base cursor-pointer border-none bg-transparent"
								>
									✕
								</button>
							</div>

							<div className="grid grid-cols-2 gap-4 text-xs">
								<div>
									<span className="font-bold text-brand-muted uppercase text-[10px] block mb-1">
										Số CCCD/CMND
									</span>
									<span className="font-extrabold text-brand-dark text-sm">
										{previewKyc.identityCardNumber || previewKyc.idCardNumber || "—"}
									</span>
								</div>
								<div>
									<span className="font-bold text-brand-muted uppercase text-[10px] block mb-1">
										Trạng thái hiện tại
									</span>
									<span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded uppercase border border-blue-200 inline-block">
										{previewKyc.status || "Submitted"}
									</span>
								</div>
							</div>

							{/* Photos */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
								<div className="space-y-1.5">
									<span className="text-[11px] font-bold text-brand-dark block">
										Ảnh mặt trước CCCD:
									</span>
									<div className="border border-brand-border rounded-xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
										{previewKyc.identityCardFrontUrl || previewKyc.idCardFrontUrl ? (
											<img
												src={previewKyc.identityCardFrontUrl || previewKyc.idCardFrontUrl}
												alt="Front"
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-gray-400 text-xs font-bold">Chưa có ảnh</span>
										)}
									</div>
								</div>

								<div className="space-y-1.5">
									<span className="text-[11px] font-bold text-brand-dark block">
										Ảnh mặt sau CCCD:
									</span>
									<div className="border border-brand-border rounded-xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
										{previewKyc.identityCardBackUrl || previewKyc.idCardBackUrl ? (
											<img
												src={previewKyc.identityCardBackUrl || previewKyc.idCardBackUrl}
												alt="Back"
												className="w-full h-full object-cover"
											/>
										) : (
											<span className="text-gray-400 text-xs font-bold">Chưa có ảnh</span>
										)}
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setPreviewKyc(null)}
									className="px-4 py-2 border border-brand-border rounded-xl font-bold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
								>
									Đóng
								</button>
								<button
									type="button"
									onClick={() => {
										setRejectTargetKyc(previewKyc);
										setRejectReason("");
									}}
									className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors cursor-pointer border-none flex items-center gap-1.5"
								>
									<XCircle className="w-4 h-4" />
									Từ chối hồ sơ
								</button>
								<button
									type="button"
									onClick={() => handleApprove(previewKyc.id)}
									className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-colors cursor-pointer border-none flex items-center gap-1.5"
								>
									<CheckCircle className="w-4 h-4" />
									Duyệt hồ sơ ngay
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* Modal Nhập Lý Do Từ Chối */}
			{rejectTargetKyc &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
						<div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left font-sans animate-in zoom-in-95 duration-200">
							<div className="flex items-center gap-2 text-red-600">
								<AlertCircle className="w-5 h-5" />
								<h3 className="text-sm font-black uppercase tracking-wide">
									Từ chối hồ sơ KYC #{rejectTargetKyc.id}
								</h3>
							</div>

							<p className="text-xs text-brand-muted leading-relaxed">
								Vui lòng nhập lý do cụ thể để gửi phản hồi cho người bán biết lý do hồ sơ KYC không được chấp nhận.
							</p>

							<div>
								<label className="block text-[11px] font-bold text-brand-dark mb-1">
									Lý do từ chối <span className="text-red-500">*</span>
								</label>
								<textarea
									rows={3}
									value={rejectReason}
									onChange={(e) => setRejectReason(e.target.value)}
									placeholder="Ví dụ: Ảnh chụp CCCD bị mờ, không nhìn rõ số định danh..."
									className="w-full p-3 border border-brand-border rounded-xl text-xs focus:outline-none focus:border-red-500 font-medium"
								/>
							</div>

							<div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setRejectTargetKyc(null)}
									className="px-4 py-2 border border-brand-border rounded-xl font-bold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button
									type="button"
									onClick={handleConfirmReject}
									disabled={rejectKycMutation.isPending}
									className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors cursor-pointer border-none flex items-center gap-1.5"
								>
									{rejectKycMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}
		</div>
	);
}
