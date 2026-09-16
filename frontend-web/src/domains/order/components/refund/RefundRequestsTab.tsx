import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
	Eye,
	FileText,
	X,
	Play,
	Maximize2,
	ShieldCheck,
	AlertCircle,
	CornerDownRight,
	RefreshCw,
	ArrowLeftRight,
	Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
	useMyRefundsQuery,
	useCancelRefundMutation,
} from "../../hooks/useOrders";
import { getRefundStatusBadge } from "../VoucherHelpers";
import { CustomerOrderDetailView } from "../CustomerOrderDetailView";

function isVideoUrl(url: string): boolean {
	const clean = url.split("?")[0].toLowerCase();
	return (
		clean.endsWith(".mp4") ||
		clean.endsWith(".webm") ||
		clean.endsWith(".mov") ||
		clean.endsWith(".mkv") ||
		clean.includes("/videos/") ||
		clean.includes(".mp4?")
	);
}

function getRefundMedias(ref: any): string[] {
	if (ref.medias && Array.isArray(ref.medias) && ref.medias.length > 0) return ref.medias;
	if (ref.proofImagesJson) {
		try {
			const parsed = JSON.parse(ref.proofImagesJson);
			if (Array.isArray(parsed)) return parsed;
		} catch {}
	}
	return [];
}

export function RefundRequestsTab() {
	const { data: refunds = [], isLoading, refetch } = useMyRefundsQuery();
	const cancelRefundMutation = useCancelRefundMutation();

	// State for viewing suborder detail view
	const [activeSubOrderId, setActiveSubOrderId] = useState<string | null>(null);

	// State for viewing full refund detail modal
	const [selectedRefund, setSelectedRefund] = useState<any | null>(null);

	// State for media preview modal (lightbox)
	const [previewMedia, setPreviewMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

	// Status filter: default is "All" (tất cả)
	const [statusFilter, setStatusFilter] = useState<string>("All");

	const filteredRefunds = useMemo(() => {
		if (statusFilter === "All") return refunds;
		if (statusFilter === "SellerApproved" || statusFilter === "Approved") {
			return refunds.filter((r: any) => r.status === "SellerApproved" || r.status === "Approved");
		}
		if (statusFilter === "SellerRejected" || statusFilter === "Rejected") {
			return refunds.filter((r: any) => r.status === "SellerRejected" || r.status === "Rejected");
		}
		return refunds.filter((r: any) => r.status === statusFilter);
	}, [refunds, statusFilter]);

	const handleCancelRefund = async (id: number) => {
		if (window.confirm("Bạn muốn rút lại yêu cầu hoàn tiền này?")) {
			try {
				await cancelRefundMutation.mutateAsync(id);
				toast.success("Đã rút yêu cầu hoàn tiền thành công!");
				if (selectedRefund?.id === id) {
					setSelectedRefund(null);
				}
				refetch();
			} catch (err: any) {
				toast.error(err?.response?.data || "Thao tác thất bại!");
			}
		}
	};

	// 1. Nếu đang xem chi tiết đơn hàng con -> Hiển thị CustomerOrderDetailView
	if (activeSubOrderId) {
		return (
			<CustomerOrderDetailView
				subOrderId={activeSubOrderId}
				isSeller={false}
				onBack={() => setActiveSubOrderId(null)}
				onStatusUpdated={() => refetch()}
			/>
		);
	}

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="pb-3 border-b border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Yêu cầu hoàn tiền
					</h2>
					<p className="text-xs text-brand-muted">
						Theo dõi các khiếu nại trả hàng / hoàn tiền của bạn đã gửi cho các shop.
					</p>
				</div>
				<button
					type="button"
					onClick={() => refetch()}
					className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer bg-white transition-all shadow-2xs"
				>
					<RefreshCw className="w-3.5 h-3.5" /> Làm mới
				</button>
			</div>

			{/* Filter Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-brand-light-soft border border-brand-border rounded-md">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-bold text-brand-muted whitespace-nowrap">Trạng thái:</span>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary cursor-pointer font-bold"
					>
						<option value="All">Tất cả trạng thái (Mặc định)</option>
						<option value="Pending">Chờ shop phản hồi</option>
						<option value="SellerApproved">Đã duyệt hoàn tiền</option>
						<option value="SellerRejected">Shop từ chối</option>
					</select>
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
					<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách khiếu nại...
				</div>
			) : filteredRefunds.length === 0 ? (
				<div className="text-center py-16 text-brand-muted font-bold text-xs space-y-2 bg-brand-light-soft/20 rounded-md border border-dashed border-brand-border">
					<ArrowLeftRight className="w-10 h-10 text-brand-muted mx-auto opacity-40" />
					<p>{refunds.length === 0 ? "Bạn chưa gửi yêu cầu hoàn tiền nào." : "Không có yêu cầu hoàn tiền nào phù hợp với bộ lọc."}</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredRefunds.map((ref: any) => {
						const isApproved = ref.status === "SellerApproved" || ref.status === "Approved";
						const isRejected = ref.status === "SellerRejected" || ref.status === "Rejected";
						const isPending = ref.status === "Pending";

						return (
							<div
								key={ref.id}
								className="p-4 border border-brand-border rounded-md bg-white space-y-3 shadow-xs hover:border-brand-dark/30 transition-all"
							>
								{/* Header Card */}
								<div className="flex items-center justify-between border-b border-brand-border pb-2 text-xs">
									<div className="flex items-center gap-2">
										<span className="font-mono font-bold text-brand-dark">
											Đơn con #{String(ref.subOrderId).split("-")[0].toUpperCase()}
										</span>
										<span className="text-[10px] text-brand-muted font-normal">
											(Yêu cầu #{ref.id})
										</span>
									</div>
									<span
										className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
											isPending
												? "bg-amber-100 text-amber-800"
												: isApproved
													? "bg-emerald-100 text-emerald-800"
													: isRejected
														? "bg-red-100 text-red-800"
														: "bg-slate-100 text-slate-800"
										}`}
									>
										{isPending
											? "Chờ shop phản hồi"
											: isApproved
												? "Đã duyệt hoàn tiền"
												: isRejected
													? "Shop từ chối"
													: "Đã rút yêu cầu"}
									</span>
								</div>

								{/* Reason & Description - 1 line with ellipsis */}
								<div className="space-y-1 text-xs">
									<div className="flex items-center gap-1.5 font-bold text-brand-dark">
										<span className="text-brand-muted shrink-0">Lý do:</span>
										<span className="truncate" title={ref.reason}>{ref.reason || "Không có"}</span>
									</div>

									{ref.description && ref.description !== ref.reason && (
										<div className="flex items-center gap-1.5 text-[11px] text-brand-muted">
											<span className="shrink-0 font-medium">Mô tả:</span>
											<span className="truncate" title={ref.description}>{ref.description}</span>
										</div>
									)}

									{/* Shop seller note if exists */}
									{(ref.sellerNote || ref.sellerRejectReason) && (
										<div className="bg-brand-light-soft/60 p-2.5 rounded-md border border-brand-border/60 text-[11px] text-brand-muted italic flex items-center gap-1.5 mt-1">
											<CornerDownRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
											<span className="truncate" title={ref.sellerNote || ref.sellerRejectReason}>
												Phản hồi từ shop: {ref.sellerNote || ref.sellerRejectReason}
											</span>
										</div>
									)}
								</div>

								{/* Bottom info & Actions */}
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-brand-border/60 text-xs">
									<div className="font-black text-red-600 flex items-center gap-1">
										<span>Số tiền hoàn trả:</span>
										<span className="text-sm font-extrabold">
											{Number(ref.refundAmount || ref.requestedAmount || 0).toLocaleString("vi-VN")}đ
										</span>
									</div>

									<div className="flex items-center gap-2">
										{/* Action 1: Xem chi tiết đơn */}
										<button
											type="button"
											onClick={() => setActiveSubOrderId(String(ref.subOrderId))}
											className="h-7 px-2.5 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
											title="Xem chi tiết đơn hàng con"
										>
											<Eye className="w-3 h-3 text-brand-muted" />
											<span>Chi tiết đơn</span>
										</button>

										{/* Action 2: Xem chi tiết hoàn trả */}
										<button
											type="button"
											onClick={() => setSelectedRefund(ref)}
											className="h-7 px-2.5 bg-brand-light-soft hover:bg-brand-primary/10 border border-brand-border text-brand-dark rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
											title="Xem chi tiết yêu cầu & bằng chứng ảnh/video"
										>
											<FileText className="w-3 h-3 text-brand-primary" />
											<span>Chi tiết hoàn</span>
										</button>

										{/* Action 3: Rút yêu cầu nếu còn Pending */}
										{isPending && (
											<button
												type="button"
												onClick={() => handleCancelRefund(ref.id)}
												disabled={cancelRefundMutation.isPending}
												className="h-7 px-2.5 border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 rounded-md text-[11px] font-bold cursor-pointer bg-white transition-all shadow-2xs"
											>
												Rút yêu cầu
											</button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ========================================================================= */}
			{/* MODAL: CHI TIẾT HOÀN TIỀN & MINH CHỨNG (CUSTOMER)                         */}
			{/* ========================================================================= */}
			{selectedRefund && typeof document !== "undefined" && createPortal(
				<div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xs font-sans animate-in fade-in duration-200">
					<div className="bg-white rounded-md max-w-xl w-full border border-brand-border p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left relative">
						<button
							type="button"
							onClick={() => setSelectedRefund(null)}
							className="absolute top-4 right-4 p-1 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft cursor-pointer transition-all border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="border-b border-brand-border pb-3 pr-8">
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="font-black text-brand-dark text-sm uppercase">
									Chi tiết khiếu nại hoàn tiền #{selectedRefund.id}
								</h3>
								{getRefundStatusBadge(selectedRefund.status)}
							</div>
							<p className="text-[11px] text-brand-muted mt-0.5">
								Đơn hàng liên kết: <strong className="font-mono text-brand-dark">#{selectedRefund.subOrderId}</strong>
							</p>
						</div>

						{/* Info cards */}
						<div className="grid grid-cols-2 gap-3 p-3 bg-brand-light-soft/60 border border-brand-border rounded-md text-xs">
							<div>
								<span className="text-[10px] font-bold text-brand-muted block uppercase">Số tiền hoàn trả</span>
								<p className="font-black text-red-600 text-sm">
									{(selectedRefund.refundAmount || selectedRefund.requestedAmount || 0).toLocaleString("vi-VN")}đ
								</p>
							</div>
							<div>
								<span className="text-[10px] font-bold text-brand-muted block uppercase">Thời gian gửi</span>
								<p className="font-semibold text-brand-dark">
									{new Date(selectedRefund.createdDate).toLocaleString("vi-VN")}
								</p>
							</div>
						</div>

						{/* Lý do & Mô tả */}
						<div className="space-y-3">
							<div className="space-y-1">
								<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider flex items-center gap-1.5">
									<AlertCircle className="w-3.5 h-3.5 text-amber-600" />
									Lý do trả hàng / hoàn tiền:
								</h4>
								<div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-md text-xs font-semibold text-brand-dark leading-relaxed">
									{selectedRefund.reason || "Không có"}
								</div>
							</div>

							{selectedRefund.description && selectedRefund.description !== selectedRefund.reason && (
								<div className="space-y-1">
									<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider">
										Mô tả chi tiết của bạn:
									</h4>
									<div className="p-3 bg-brand-light-soft border border-brand-border rounded-md text-xs text-brand-dark leading-relaxed font-normal whitespace-pre-line">
										{selectedRefund.description}
									</div>
								</div>
							)}
						</div>

						{/* Proof Gallery */}
						<div className="space-y-2">
							<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider flex items-center gap-1.5">
								<ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
								Minh chứng đã tải lên ({getRefundMedias(selectedRefund).length} tệp):
							</h4>

							{getRefundMedias(selectedRefund).length === 0 ? (
								<div className="p-4 text-center border border-dashed border-brand-border rounded-md text-brand-muted text-xs">
									Không có hình ảnh hoặc video đính kèm.
								</div>
							) : (
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
									{getRefundMedias(selectedRefund).map((url, idx) => {
										const isVideo = isVideoUrl(url);

										if (isVideo) {
											return (
												<div
													key={idx}
													onClick={() => setPreviewMedia({ url, isVideo: true })}
													className="group relative aspect-video bg-black rounded-md overflow-hidden border border-brand-border cursor-pointer shadow-xs"
												>
													<video
														src={url}
														preload="metadata"
														className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
													/>
													<div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all">
														<div className="w-7 h-7 rounded-full bg-brand-primary/90 text-brand-dark flex items-center justify-center shadow-md">
															<Play className="w-3.5 h-3.5 fill-brand-dark ml-0.5" />
														</div>
													</div>
													<span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/70 text-white text-[8px] font-mono rounded">
														Video
													</span>
												</div>
											);
										}

										return (
											<div
												key={idx}
												onClick={() => setPreviewMedia({ url, isVideo: false })}
												className="group relative aspect-square bg-slate-100 rounded-md overflow-hidden border border-brand-border cursor-pointer shadow-xs"
											>
												<img
													src={url}
													alt={`Proof ${idx + 1}`}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform"
												/>
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
													<Maximize2 className="w-4 h-4 text-white drop-shadow" />
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Phản hồi từ Shop */}
						{(selectedRefund.sellerNote || selectedRefund.sellerRejectReason) && (
							<div className="space-y-1 p-3 bg-brand-light-soft/60 border border-brand-border rounded-md text-xs">
								<div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
									<CornerDownRight className="w-3.5 h-3.5 text-brand-muted" />
									Phản hồi từ người bán:
								</div>
								<p className="text-xs text-brand-dark italic font-medium leading-relaxed">
									{selectedRefund.sellerNote || selectedRefund.sellerRejectReason}
								</p>
							</div>
						)}

						{/* Footer Actions */}
						<div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-brand-border">
							<button
								type="button"
								onClick={() => {
									const subId = String(selectedRefund.subOrderId);
									setSelectedRefund(null);
									setActiveSubOrderId(subId);
								}}
								className="px-3 py-1.5 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
							>
								<Eye className="w-3.5 h-3.5 text-brand-muted" />
								Xem toàn bộ đơn hàng
							</button>

							<div className="flex items-center gap-2">
								{selectedRefund.status === "Pending" && (
									<button
										type="button"
										onClick={() => handleCancelRefund(selectedRefund.id)}
										disabled={cancelRefundMutation.isPending}
										className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-extrabold text-xs rounded-md transition-all cursor-pointer shadow-2xs"
									>
										Rút yêu cầu
									</button>
								)}
								<button
									type="button"
									onClick={() => setSelectedRefund(null)}
									className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer"
								>
									Đóng
								</button>
							</div>
						</div>
					</div>
				</div>,
				document.body
			)}

			{/* ========================================================================= */}
			{/* LIGHTBOX PREVIEW MODAL (IMAGE / VIDEO)                                    */}
			{/* ========================================================================= */}
			{previewMedia && typeof document !== "undefined" && createPortal(
				<div
					onClick={() => setPreviewMedia(null)}
					className="fixed inset-0 z-10000 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
				>
					<button
						type="button"
						onClick={() => setPreviewMedia(null)}
						className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-all border-none"
					>
						<X className="w-6 h-6" />
					</button>

					<div
						onClick={(e) => e.stopPropagation()}
						className="max-w-4xl max-h-[85vh] flex items-center justify-center cursor-default"
					>
						{previewMedia.isVideo ? (
							<video
								src={previewMedia.url}
								controls
								autoPlay
								className="max-w-full max-h-[85vh] rounded-md shadow-2xl"
							/>
						) : (
							<img
								src={previewMedia.url}
								alt="Preview"
								className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
							/>
						)}
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
