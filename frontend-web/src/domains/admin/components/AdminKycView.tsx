import { useState } from "react";
import { createPortal } from "react-dom";
import {
	useAdminKycsQuery,
	useApproveKycMutation,
	useRejectKycMutation,
} from "@/domains/admin";
import {
	CheckCircle,
	XCircle,
	Eye,
	RefreshCw,
	Loader2,
	AlertCircle,
	X,
	FileText,
	User,
	CreditCard,
	Calendar,
	Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { Pagination } from "@/shared/components/Pagination";

export function AdminKycView() {
	const [statusFilter, setStatusFilter] = useState<string>("Submitted");
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data: kycsData,
		isLoading,
		isError,
		refetch,
		isFetching,
	} = useAdminKycsQuery({
		pageNumber: page,
		pageSize: pageSize,
		status: statusFilter === "ALL" ? undefined : statusFilter,
	});

	const approveKycMutation = useApproveKycMutation();
	const rejectKycMutation = useRejectKycMutation();

	// Modal states
	const [previewKyc, setPreviewKyc] = useState<any | null>(null);
	const [rejectTargetKyc, setRejectTargetKyc] = useState<any | null>(null);
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
			item.fullName?.toLowerCase().includes(query) ||
			String(item.ownerUserId || item.userId)?.includes(query)
		);
	});

	const handleApprove = async (kycId: number) => {
		if (!window.confirm("Bạn có chắc chắn muốn PHÊ DUYỆT hồ sơ KYC này?")) return;
		try {
			await approveKycMutation.mutateAsync(kycId);
			toast.success("Phê duyệt hồ sơ KYC thành công!");
			if (previewKyc?.id === kycId) setPreviewKyc(null);
			refetch();
		} catch (err: any) {
			toast.error(`Phê duyệt thất bại: ${err?.response?.data || err.message}`);
		}
	};

	const handleConfirmReject = async () => {
		if (!rejectTargetKyc) return;
		if (!rejectReason.trim()) {
			toast.error("Vui lòng nhập lý do từ chối hồ sơ.");
			return;
		}
		try {
			await rejectKycMutation.mutateAsync({
				kycId: rejectTargetKyc.id,
				reason: rejectReason.trim(),
			});
			toast.success("Đã từ chối hồ sơ KYC!");
			setRejectTargetKyc(null);
			if (previewKyc?.id === rejectTargetKyc.id) setPreviewKyc(null);
			refetch();
		} catch (err: any) {
			toast.error(`Từ chối thất bại: ${err?.response?.data || err.message}`);
		}
	};

	// Helper hiển thị badge trạng thái chuẩn tiếng Việt và màu sắc đồng bộ
	const renderKycStatusBadge = (status: string) => {
		switch (status?.toLowerCase()) {
			case "verified":
			case "approved":
				return (
					<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded uppercase tracking-wide inline-flex items-center gap-1">
						<Check className="w-3 h-3" /> Đã phê duyệt
					</span>
				);
			case "rejected":
				return (
					<span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black rounded uppercase tracking-wide inline-flex items-center gap-1">
						<X className="w-3 h-3" /> Bị từ chối
					</span>
				);
			case "draft":
				return (
					<span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-black rounded uppercase tracking-wide">
						Bản nháp
					</span>
				);
			case "submitted":
			default:
				return (
					<span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black rounded uppercase tracking-wide inline-flex items-center gap-1">
						<Loader2 className="w-3 h-3 animate-spin" /> Chờ duyệt
					</span>
				);
		}
	};

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header Bar */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Phê duyệt định danh KYC
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Xác thực thông tin căn cước công dân của các chủ shop để mở quyền bán hàng
					</p>
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="relative flex-1 sm:w-64">
						<input
							type="text"
							placeholder="Tìm theo số CCCD, Họ tên, Mã User..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark bg-white"
						/>
						<FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
					</div>
					<button
						onClick={() => refetch()}
						disabled={isFetching}
						title="Làm mới"
						className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border border-brand-border bg-white shrink-0 disabled:opacity-60"
					>
						<RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
					</button>
				</div>
			</div>

			{/* Tab bars */}
			<div className="flex border-b border-brand-border overflow-x-auto select-none no-scrollbar">
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
						className={`py-3 px-4 text-xs font-extrabold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
							statusFilter === tab.value
								? "border-brand-primary text-brand-primary-deep"
								: "border-transparent text-brand-muted hover:text-brand-dark"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Main Table - Đồng bộ theo chuẩn bảng của Admin Orders / Refunds */}
			<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs font-semibold text-brand-dark border-collapse">
						<thead>
							<tr className="bg-brand-light-soft border-b border-brand-border text-brand-muted uppercase text-[10px] tracking-wider font-extrabold select-none">
								<th className="py-3 px-4">Mã hồ sơ</th>
								<th className="py-3 px-4">Chủ sở hữu</th>
								<th className="py-3 px-4">Số CCCD</th>
								<th className="py-3 px-4 text-center">Trạng thái</th>
								<th className="py-3 px-4">Hình ảnh CCCD</th>
								<th className="py-3 px-4 text-right">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
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
										Không tìm thấy hồ sơ KYC nào.
									</td>
								</tr>
							) : (
								paginatedKycs.map((item: any) => {
									const idNumber = item.identityCardNumber || item.idCardNumber || "—";
									const frontUrl = item.identityCardFrontUrl || item.idCardFrontUrl;
									const backUrl = item.identityCardBackUrl || item.idCardBackUrl;
									const userId = item.ownerUserId || item.userId;
									const isSubmitted = item.status?.toLowerCase() === "submitted";

									return (
										<tr key={item.id} className="hover:bg-brand-light-soft/20 transition-colors">
											<td className="py-3 px-4 font-mono font-bold">#{item.id}</td>
											<td className="py-3 px-4 font-bold text-brand-dark">
												<div className="text-12 text-brand-muted font-medium">#{userId}</div>
											</td>
											<td className="py-3 px-4 font-mono font-extrabold tracking-wide text-brand-dark">
												{idNumber}
											</td>
											<td className="py-3 px-4 text-center">
												{renderKycStatusBadge(item.status)}
											</td>
											<td className="py-3 px-4">
												<div className="flex items-center gap-2">
													{frontUrl ? (
														<img
															src={frontUrl}
															alt="Mặt trước"
															className="w-11 h-7.5 object-cover rounded border border-brand-border cursor-pointer hover:opacity-80 transition-opacity shadow-2xs"
															onClick={() => setPreviewKyc(item)}
														/>
													) : (
														<span className="text-[10px] text-slate-300 italic">Trống</span>
													)}
													{backUrl ? (
														<img
															src={backUrl}
															alt="Mặt sau"
															className="w-11 h-7.5 object-cover rounded border border-brand-border cursor-pointer hover:opacity-80 transition-opacity shadow-2xs"
															onClick={() => setPreviewKyc(item)}
														/>
													) : (
														<span className="text-[10px] text-slate-300 italic">Trống</span>
													)}
												</div>
											</td>
											<td className="py-3 px-4 text-right">
												<div className="flex items-center justify-end gap-1.5">
													{/* Chi tiết button */}
													<button
														onClick={() => setPreviewKyc(item)}
														title="Xem chi tiết"
														className="px-2.5 py-1 text-brand-dark hover:text-brand-primary-deep text-xs font-bold transition-colors cursor-pointer border border-brand-border hover:bg-white rounded flex items-center gap-1 bg-brand-light-soft/50 shadow-2xs"
													>
														<Eye className="w-3.5 h-3.5 text-brand-muted" />
														<span>Xem</span>
													</button>

													{/* Actions chỉ hiển thị khi trạng thái là Chờ duyệt (Submitted) */}
													{isSubmitted && (
														<>
															<button
																onClick={() => handleApprove(item.id)}
																disabled={approveKycMutation.isPending}
																title="Duyệt hồ sơ"
																className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1 shadow-xs"
															>
																<Check className="w-3.5 h-3.5" />
																<span>Duyệt</span>
															</button>
															<button
																onClick={() => {
																	setRejectTargetKyc(item);
																	setRejectReason("");
																}}
																disabled={rejectKycMutation.isPending}
																title="Từ chối"
																className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition-all cursor-pointer border border-red-200 flex items-center gap-1"
															>
																<X className="w-3.5 h-3.5" />
																<span>Từ chối</span>
															</button>
														</>
													)}
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Phân trang */}
				{totalPages > 1 && (
					<div className="p-3 border-t border-brand-border flex justify-end">
						<Pagination
							currentPage={page}
							totalPages={totalPages}
							onPageChange={(p) => setPage(p)}
						/>
					</div>
				)}
			</div>

			{/* Modal Preview Chi Tiết KYC */}
			{previewKyc &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
						<div className="bg-white rounded-md max-w-2xl w-full p-6 space-y-4 shadow-2xl text-left font-sans animate-in zoom-in-95 duration-200 relative border border-brand-border">
							<button
								onClick={() => setPreviewKyc(null)}
								className="absolute top-4 right-4 p-1 rounded-md text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft cursor-pointer transition-colors border-none bg-transparent"
							>
								<X className="w-5 h-5" />
							</button>

							<div className="flex items-center gap-2 border-b border-brand-border pb-3">
								<FileText className="w-5 h-5 text-brand-primary" />
								<h3 className="text-sm font-black text-brand-dark uppercase tracking-wide">
									Chi tiết hồ sơ KYC #{previewKyc.id}
								</h3>
							</div>

							{/* Thông tin Text */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-brand-light-soft/50 p-4 rounded-md border border-brand-border">
								<div>
									<span className="text-[11px] text-brand-muted font-bold block">Họ và tên:</span>
									<span className="font-black text-brand-dark text-sm">
										{previewKyc.fullName || `User #${previewKyc.ownerUserId || previewKyc.userId}`}
									</span>
								</div>
								<div>
									<span className="text-[11px] text-brand-muted font-bold block">Số CCCD / CMND:</span>
									<span className="font-mono font-black text-brand-primary-deep text-sm">
										{previewKyc.identityCardNumber || previewKyc.idCardNumber || "—"}
									</span>
								</div>
								<div>
									<span className="text-[11px] text-brand-muted font-bold block">Mã User sở hữu:</span>
									<span className="font-bold text-brand-dark">#{previewKyc.ownerUserId || previewKyc.userId}</span>
								</div>
								<div>
									<span className="text-[11px] text-brand-muted font-bold block">Trạng thái hiện tại:</span>
									<div className="mt-0.5">{renderKycStatusBadge(previewKyc.status)}</div>
								</div>
								{previewKyc.rejectionReason && (
									<div className="sm:col-span-2 pt-2 border-t border-brand-border/60">
										<span className="text-[11px] text-red-600 font-bold block">Lý do từ chối trước đó:</span>
										<p className="text-red-700 font-medium">{previewKyc.rejectionReason}</p>
									</div>
								)}
							</div>

							{/* Photos */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
								<div className="space-y-1.5">
									<span className="text-[11px] font-bold text-brand-dark block">
										Ảnh mặt trước CCCD:
									</span>
									<div className="border border-brand-border rounded-md overflow-hidden bg-gray-50 aspect-video flex items-center justify-center relative shadow-inner">
										{previewKyc.identityCardFrontUrl || previewKyc.idCardFrontUrl ? (
											<a
												href={previewKyc.identityCardFrontUrl || previewKyc.idCardFrontUrl}
												target="_blank"
												rel="noreferrer"
												className="w-full h-full block"
											>
												<img
													src={previewKyc.identityCardFrontUrl || previewKyc.idCardFrontUrl}
													alt="Mặt trước CCCD"
													className="w-full h-full object-contain hover:scale-105 transition-transform"
												/>
											</a>
										) : (
											<span className="text-gray-400 text-xs font-bold">Chưa có ảnh mặt trước</span>
										)}
									</div>
								</div>

								<div className="space-y-1.5">
									<span className="text-[11px] font-bold text-brand-dark block">
										Ảnh mặt sau CCCD:
									</span>
									<div className="border border-brand-border rounded-md overflow-hidden bg-gray-50 aspect-video flex items-center justify-center relative shadow-inner">
										{previewKyc.identityCardBackUrl || previewKyc.idCardBackUrl ? (
											<a
												href={previewKyc.identityCardBackUrl || previewKyc.idCardBackUrl}
												target="_blank"
												rel="noreferrer"
												className="w-full h-full block"
											>
												<img
													src={previewKyc.identityCardBackUrl || previewKyc.idCardBackUrl}
													alt="Mặt sau CCCD"
													className="w-full h-full object-contain hover:scale-105 transition-transform"
												/>
											</a>
										) : (
											<span className="text-gray-400 text-xs font-bold">Chưa có ảnh mặt sau</span>
										)}
									</div>
								</div>
							</div>

							{/* Actions - Chỉ hiển thị nút Duyệt/Từ chối khi đang ở trạng thái Submitted */}
							<div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setPreviewKyc(null)}
									className="px-4 py-2 border border-brand-border rounded-md font-bold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer text-xs bg-white"
								>
									Đóng
								</button>
								{previewKyc.status?.toLowerCase() === "submitted" && (
									<>
										<button
											type="button"
											onClick={() => {
												setRejectTargetKyc(previewKyc);
												setRejectReason("");
											}}
											className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-bold text-xs transition-colors cursor-pointer border border-red-200 flex items-center gap-1.5"
										>
											<XCircle className="w-4 h-4" />
											Từ chối hồ sơ
										</button>
										<button
											type="button"
											onClick={() => handleApprove(previewKyc.id)}
											disabled={approveKycMutation.isPending}
											className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-deep text-white font-bold text-xs rounded-md transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
										>
											<CheckCircle className="w-4 h-4" />
											Duyệt hồ sơ ngay
										</button>
									</>
								)}
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* Modal Nhập Lý Do Từ Chối */}
			{rejectTargetKyc &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
						<div className="bg-white rounded-md max-w-md w-full p-6 space-y-4 shadow-2xl text-left font-sans animate-in zoom-in-95 duration-200 border border-brand-border">
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
									className="w-full p-3 border border-brand-border rounded-md text-xs focus:outline-none focus:border-red-500 font-medium bg-white"
								/>
							</div>

							<div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setRejectTargetKyc(null)}
									className="px-4 py-2 border border-brand-border rounded-md font-bold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer text-xs bg-white"
								>
									Hủy bỏ
								</button>
								<button
									type="button"
									onClick={handleConfirmReject}
									disabled={rejectKycMutation.isPending}
									className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-xs"
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
