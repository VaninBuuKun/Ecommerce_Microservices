import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
	useShopRefundsQuery,
	useApproveRefundMutation,
	useRejectRefundMutation,
} from "../../hooks/useOrders";
import { CustomerOrderDetailView } from "../CustomerOrderDetailView";
import { getRefundStatusBadge } from "../VoucherHelpers";
import { Pagination } from "@/shared/components/Pagination";
import { useSellerStore, useSellerProfileQuery } from "@/domains/seller";
import type { RefundRequestDto } from "../../types/order.types";
import {
	Loader2,
	RefreshCw,
	Check,
	X,
	Eye,
	FileText,
	AlertCircle,
	Calendar,
	DollarSign,
	Clock,
	Play,
	Maximize2,
	CornerDownRight,
	MessageSquare,
	ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

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

function getRefundMedias(req: RefundRequestDto): string[] {
	if (req.medias && req.medias.length > 0) return req.medias;
	if (req.proofImagesJson) {
		try {
			const parsed = JSON.parse(req.proofImagesJson);
			if (Array.isArray(parsed)) return parsed;
		} catch {}
	}
	return [];
}

function getRemainingTime(expirationDateStr?: string) {
	if (!expirationDateStr) return null;
	const diff = new Date(expirationDateStr).getTime() - Date.now();
	if (diff <= 0) return "Đã hết hạn tự động xử lý";
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	if (hours > 24) {
		const days = Math.floor(hours / 24);
		return `Còn ${days} ngày ${hours % 24} giờ`;
	}
	return `Còn ${hours} giờ ${mins} phút`;
}

export default function RefundRequestsView() {
	const { shopId: urlShopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();

	const resolvedShop =
		activeShop ??
		profile?.shops?.find((shop: any) => String(shop.id) === urlShopId) ??
		profile?.shops?.[0] ??
		null;

	const targetShopId = resolvedShop?.id ? Number(resolvedShop.id) : (urlShopId ? Number(urlShopId) : undefined);

	const {
		data: serverData,
		isLoading,
		refetch,
		isFetching,
	} = useShopRefundsQuery(targetShopId);

	const approveMutation = useApproveRefundMutation();
	const rejectMutation = useRejectRefundMutation();

	// State for viewing full customer order details
	const [activeSubOrderId, setActiveSubOrderId] = useState<string | null>(null);

	// State for viewing refund details modal
	const [selectedRefund, setSelectedRefund] = useState<RefundRequestDto | null>(null);

	// State for media preview (lightbox)
	const [previewMedia, setPreviewMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

	// State for approve/reject confirmation modal
	const [actionRequest, setActionRequest] = useState<{
		id: number;
		type: "approve" | "reject";
	} | null>(null);
	const [sellerNote, setSellerNote] = useState("");

	// Filters & Pagination
	const [statusFilter, setStatusFilter] = useState<string>("Pending"); // Mặc định là 'Chưa xử lý'
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const PAGE_SIZE = 8;

	const allRefunds: RefundRequestDto[] = serverData || [];

	// Filter logic
	const filteredRefunds = useMemo(() => {
		return allRefunds.filter((req) => {
			// Status Filter
			if (statusFilter !== "All") {
				if (statusFilter === "SellerApproved" || statusFilter === "Approved") {
					if (req.status !== "SellerApproved" && req.status !== "Approved") return false;
				} else if (statusFilter === "SellerRejected" || statusFilter === "Rejected") {
					if (req.status !== "SellerRejected" && req.status !== "Rejected") return false;
				} else if (req.status !== statusFilter) {
					return false;
				}
			}
			// Search Query Filter
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase().trim();
			return (
				String(req.id).toLowerCase().includes(q) ||
				String(req.subOrderId).toLowerCase().includes(q) ||
				String(req.customerId).toLowerCase().includes(q) ||
				(req.reason && req.reason.toLowerCase().includes(q)) ||
				(req.description && req.description.toLowerCase().includes(q))
			);
		});
	}, [allRefunds, statusFilter, searchQuery]);

	// Pagination
	const totalPages = Math.ceil(filteredRefunds.length / PAGE_SIZE) || 1;
	const paginatedRefunds = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredRefunds.slice(start, start + PAGE_SIZE);
	}, [filteredRefunds, currentPage, PAGE_SIZE]);

	const handleActionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!actionRequest) return;

		const { id, type } = actionRequest;

		if (type === "reject" && !sellerNote.trim()) {
			toast.error("Vui lòng nhập lý do từ chối!");
			return;
		}

		if (type === "approve") {
			approveMutation.mutate(
				{ id, sellerNote: sellerNote.trim() || undefined },
				{
					onSuccess: () => {
						toast.success("Đã chấp nhận yêu cầu hoàn tiền!");
						setSellerNote("");
						setActionRequest(null);
						if (selectedRefund?.id === id) {
							setSelectedRefund((prev) => (prev ? { ...prev, status: "Approved" } : null));
						}
						refetch();
					},
					onError: (err: any) => {
						toast.error(err?.response?.data || "Duyệt hoàn tiền thất bại!");
					},
				}
			);
		} else {
			rejectMutation.mutate(
				{ id, sellerNote: sellerNote.trim() },
				{
					onSuccess: () => {
						toast.success("Đã từ chối yêu cầu hoàn tiền!");
						setSellerNote("");
						setActionRequest(null);
						if (selectedRefund?.id === id) {
							setSelectedRefund((prev) => (prev ? { ...prev, status: "Rejected", sellerRejectReason: sellerNote.trim() } : null));
						}
						refetch();
					},
					onError: (err: any) => {
						toast.error(err?.response?.data || "Từ chối hoàn tiền thất bại!");
					},
				}
			);
		}
	};

	// 1. Nếu đang xem chi tiết đơn hàng con -> Hiển thị CustomerOrderDetailView
	if (activeSubOrderId) {
		return (
			<CustomerOrderDetailView
				subOrderId={activeSubOrderId}
				isSeller={true}
				onBack={() => setActiveSubOrderId(null)}
				onStatusUpdated={() => refetch()}
			/>
		);
	}

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3 font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách yêu cầu hoàn tiền...
			</div>
		);
	}

	return (
		<div className="space-y-4 font-sans text-brand-dark text-left animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Quản lý Yêu cầu Hoàn tiền / Trả hàng
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem xét lý do, minh chứng hình ảnh/video và xử lý phê duyệt hoặc từ chối yêu cầu trả hàng từ người mua.
					</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => refetch()}
						disabled={isFetching}
						className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all shadow-2xs"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
						Làm mới
					</button>
				</div>
			</div>

			{/* Filter Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-brand-light-soft border border-brand-border rounded-md">
				<div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
					<input
						type="text"
						placeholder="Tìm theo Mã đơn hàng, Mã hoàn tiền, Khách hàng, Lý do..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary flex-1 min-w-[220px]"
					/>

					<div className="flex items-center gap-1.5">
						<span className="text-[11px] font-bold text-brand-muted whitespace-nowrap">Trạng thái:</span>
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary cursor-pointer font-bold"
						>
							<option value="Pending">Chờ xử lý (Mặc định)</option>
							<option value="All">Tất cả trạng thái</option>
							<option value="SellerApproved">Đã chấp thuận</option>
							<option value="SellerRejected">Đã từ chối</option>
							<option value="Cancelled">Đã hủy</option>
						</select>
					</div>
				</div>
			</div>

			{/* Table View */}
			<div className="border border-brand-border rounded-md overflow-hidden bg-white shadow-xs">
				<div className="overflow-x-auto">
					<table className="w-full text-xs text-left">
						<thead>
							<tr className="border-b border-brand-border bg-brand-light-soft/50 text-brand-muted font-bold text-xs">
								<th className="p-3 whitespace-nowrap">Mã Yêu Cầu / Đơn</th>
								<th className="p-3 whitespace-nowrap">Khách hàng</th>
								<th className="p-3 whitespace-nowrap">Tiền hoàn</th>
								<th className="p-3 min-w-[200px]">Lý do yêu cầu</th>
								<th className="p-3 whitespace-nowrap">Bằng chứng</th>
								<th className="p-3 whitespace-nowrap">Trạng thái</th>
								<th className="p-3 text-right whitespace-nowrap">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{paginatedRefunds.length === 0 ? (
								<tr>
									<td colSpan={7} className="p-10 text-center text-brand-muted font-medium">
										Không tìm thấy yêu cầu hoàn tiền nào phù hợp với bộ lọc hiện tại.
									</td>
								</tr>
							) : (
								paginatedRefunds.map((req) => {
									const medias = getRefundMedias(req);
									const hasPending = req.status === "Pending";
									const remainingStr = hasPending ? getRemainingTime(req.expirationDate) : null;

									return (
										<tr
											key={req.id}
											className="hover:bg-brand-light-soft/20 transition-colors group"
										>
											{/* Mã yêu cầu & SubOrder */}
											<td className="p-3 whitespace-nowrap">
												<div className="space-y-0.5">
													<div className="flex items-center gap-1.5">
														<span className="font-extrabold text-brand-dark">#{req.id}</span>
														<span className="text-[10px] text-brand-muted">
															(Đơn: <strong className="font-mono text-brand-dark">#{String(req.subOrderId).split("-")[0]}</strong>)
														</span>
													</div>
													<div className="text-[10px] text-brand-muted flex items-center gap-1">
														<Calendar className="w-3 h-3 text-brand-muted" />
														{new Date(req.createdDate).toLocaleDateString("vi-VN")}
													</div>
												</div>
											</td>

											{/* Khách hàng */}
											<td className="p-3 whitespace-nowrap">
												<span className="font-semibold text-brand-dark">
													#{req.customerId}
												</span>
											</td>

											{/* Tiền hoàn */}
											<td className="p-3 whitespace-nowrap">
												<span className="font-black text-xs text-red-600">
													{(req.refundAmount || req.requestedAmount || 0).toLocaleString("vi-VN")}đ
												</span>
											</td>

											{/* Lý do (truncate 1 dòng ...) */}
											<td className="p-3 max-w-[240px]">
												<div
													onClick={() => setSelectedRefund(req)}
													className="cursor-pointer group-hover:text-brand-primary transition-colors"
													title={req.reason}
												>
													<p className="truncate font-bold text-brand-dark text-xs">
														{req.reason || "Không có lý do"}
													</p>
													{req.description && req.description !== req.reason && (
														<p className="truncate text-[11px] text-brand-muted font-normal mt-0.5" title={req.description}>
															{req.description}
														</p>
													)}
													{hasPending && remainingStr && (
														<span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1">
															<Clock className="w-3 h-3" />
															{remainingStr}
														</span>
													)}
												</div>
											</td>

											{/* Bằng chứng proof count */}
											<td className="p-3 whitespace-nowrap">
												{medias.length > 0 ? (
													<button
														type="button"
														onClick={() => setSelectedRefund(req)}
														className="px-2 py-1 bg-brand-light-soft hover:bg-brand-primary/10 border border-brand-border rounded text-[11px] font-bold text-brand-dark flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
													>
														<span>{medias.length} tệp đính kèm</span>
													</button>
												) : (
													<span className="text-[11px] text-brand-muted italic">Không có</span>
												)}
											</td>

											{/* Trạng thái */}
											<td className="p-3 whitespace-nowrap">
												{getRefundStatusBadge(req.status)}
											</td>

											{/* 3 Actions */}
											<td className="p-3 text-right whitespace-nowrap">
												<div className="flex justify-end items-center gap-1.5">
													{/* 1. Chi tiết đơn hàng */}
													<button
														type="button"
														onClick={() => setActiveSubOrderId(String(req.subOrderId))}
														className="p-1.5 bg-white hover:bg-brand-light-soft text-brand-dark border border-brand-border rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
														title="Xem chi tiết đơn hàng con"
													>
														<Eye className="w-3.5 h-3.5 text-brand-muted" />
														<span>Chi tiết đơn</span>
													</button>

													{/* 2. Chi tiết hoàn trả */}
													<button
														type="button"
														onClick={() => setSelectedRefund(req)}
														className="p-1.5 bg-brand-light-soft hover:bg-brand-primary/10 text-brand-dark border border-brand-border rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
														title="Xem chi tiết yêu cầu & bằng chứng hình ảnh/video"
													>
														<FileText className="w-3.5 h-3.5 text-brand-primary" />
														<span>Chi tiết hoàn</span>
													</button>

													{/* 3. Duyệt / Từ chối (chỉ khi Pending) */}
													{hasPending && (
														<>
															<button
																type="button"
																onClick={() =>
																	setActionRequest({
																		id: req.id,
																		type: "approve",
																	})
																}
																disabled={approveMutation.isPending}
																className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-black shadow-2xs"
																title="Duyệt yêu cầu hoàn tiền"
															>
																<Check className="w-3.5 h-3.5" />
																<span>Duyệt</span>
															</button>

															<button
																type="button"
																onClick={() =>
																	setActionRequest({
																		id: req.id,
																		type: "reject",
																	})
																}
																disabled={rejectMutation.isPending}
																className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-black shadow-2xs"
																title="Từ chối yêu cầu hoàn tiền"
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

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="p-3 border-t border-brand-border flex justify-between items-center">
						<span className="text-[11px] text-brand-muted font-bold">
							Trang {currentPage} / {totalPages}
						</span>
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
						/>
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* MODAL 1: CHI TIẾT HOÀN TIỀN & MINH CHỨNG (IMAGES + VIDEOS)                */}
			{/* ========================================================================= */}
			{selectedRefund && typeof document !== "undefined" && createPortal(
				<div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-xs font-sans animate-in fade-in duration-200">
					<div className="bg-white rounded-md max-w-2xl w-full border border-brand-border p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left relative">
						{/* Close button */}
						<button
							type="button"
							onClick={() => setSelectedRefund(null)}
							className="absolute top-4 right-4 p-1 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft cursor-pointer transition-all border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Modal Header */}
						<div className="border-b border-brand-border pb-3 pr-8">
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="font-black text-brand-dark text-sm uppercase">
									Chi tiết yêu cầu hoàn tiền #{selectedRefund.id}
								</h3>
								{getRefundStatusBadge(selectedRefund.status)}
							</div>
							<p className="text-[11px] text-brand-muted mt-0.5">
								Đơn hàng con liên quan: <strong className="font-mono text-brand-dark">#{selectedRefund.subOrderId}</strong>
							</p>
						</div>

						{/* Summary details */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-brand-light-soft/60 border border-brand-border rounded-md text-xs">
							<div>
								<span className="text-[10px] font-bold text-brand-muted block uppercase">Khách hàng</span>
								<p className="font-extrabold text-brand-dark">#{selectedRefund.customerId}</p>
							</div>
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

						{/* Expiration warning if pending */}
						{selectedRefund.status === "Pending" && (
							<div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 text-amber-800 font-bold">
									<Clock className="w-4 h-4 text-amber-600 shrink-0" />
									<span>Thời hạn tự động xử lý:</span>
									<span className="font-black">{getRemainingTime(selectedRefund.expirationDate)}</span>
								</div>
								<span className="text-[10px] text-amber-700">
									(Hạn chót: {new Date(selectedRefund.expirationDate).toLocaleString("vi-VN")})
								</span>
							</div>
						)}

						{/* Reason & Description */}
						<div className="space-y-3">
							<div className="space-y-1">
								<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider flex items-center gap-1.5">
									<AlertCircle className="w-3.5 h-3.5 text-amber-600" />
									Lý do yêu cầu trả hàng / hoàn tiền:
								</h4>
								<div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-md text-xs font-semibold text-brand-dark leading-relaxed">
									{selectedRefund.reason || "Không có lý do được ghi chú."}
								</div>
							</div>

							{selectedRefund.description && selectedRefund.description !== selectedRefund.reason && (
								<div className="space-y-1">
									<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider">
										Mô tả chi tiết từ người mua:
									</h4>
									<div className="p-3 bg-brand-light-soft border border-brand-border rounded-md text-xs text-brand-dark leading-relaxed font-normal whitespace-pre-line">
										{selectedRefund.description}
									</div>
								</div>
							)}
						</div>

						{/* Proof Gallery (Images + Videos) */}
						<div className="space-y-2">
							<h4 className="text-[11px] font-black uppercase text-brand-dark tracking-wider flex items-center gap-1.5">
								<ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
								Bằng chứng người mua cung cấp ({getRefundMedias(selectedRefund).length} tệp):
							</h4>

							{getRefundMedias(selectedRefund).length === 0 ? (
								<div className="p-6 text-center border border-dashed border-brand-border rounded-md text-brand-muted text-xs font-semibold">
									Người mua không đính kèm hình ảnh hoặc video minh chứng nào.
								</div>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
														<div className="w-8 h-8 rounded-full bg-brand-primary/90 text-brand-dark flex items-center justify-center shadow-md">
															<Play className="w-4 h-4 fill-brand-dark ml-0.5" />
														</div>
													</div>
													<span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-mono rounded">
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
													<Maximize2 className="w-5 h-5 text-white drop-shadow" />
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Phản hồi từ Shop nếu đã từ chối/duyệt */}
						{(selectedRefund.sellerRejectReason || (selectedRefund as any).sellerNote) && (
							<div className="space-y-1 p-3 bg-brand-light-soft/60 border border-brand-border rounded-md text-xs">
								<div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
									<CornerDownRight className="w-3.5 h-3.5 text-brand-muted" />
									Ghi chú phản hồi của Shop:
								</div>
								<p className="text-xs text-brand-dark italic font-medium leading-relaxed">
									{selectedRefund.sellerRejectReason || (selectedRefund as any).sellerNote}
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
								className="px-3 py-2 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
							>
								<Eye className="w-3.5 h-3.5 text-brand-muted" />
								Xem toàn bộ đơn hàng
							</button>

							<div className="flex items-center gap-2">
								{selectedRefund.status === "Pending" && (
									<>
										<button
											type="button"
											onClick={() => {
												const rId = selectedRefund.id;
												setActionRequest({ id: rId, type: "reject" });
											}}
											className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold text-xs rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
										>
											<X className="w-3.5 h-3.5" />
											Từ chối
										</button>
										<button
											type="button"
											onClick={() => {
												const rId = selectedRefund.id;
												setActionRequest({ id: rId, type: "approve" });
											}}
											className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
										>
											<Check className="w-3.5 h-3.5" />
											Duyệt hoàn tiền
										</button>
									</>
								)}
								<button
									type="button"
									onClick={() => setSelectedRefund(null)}
									className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-all cursor-pointer"
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
			{/* MODAL 2: LIGHTBOX PREVIEW MEDIA (IMAGE HOẶC VIDEO PHÓNG TO)              */}
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

			{/* ========================================================================= */}
			{/* MODAL 3: NHẬP GHI CHÚ KHI DUYỆT HOẶC TỪ CHỐI                              */}
			{/* ========================================================================= */}
			{actionRequest && typeof document !== "undefined" && createPortal(
				<div className="fixed inset-0 z-10000 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-md max-w-md w-full p-5 shadow-2xl space-y-4 text-left relative">
						<button
							type="button"
							onClick={() => setActionRequest(null)}
							className="absolute top-4 right-4 p-1 rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft cursor-pointer transition-all border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h3 className="text-sm font-black text-brand-dark flex items-center gap-1.5 uppercase tracking-wide border-b border-brand-border pb-3">
							<MessageSquare className="w-4 h-4 text-brand-primary" />
							{actionRequest.type === "approve"
								? "Duyệt yêu cầu hoàn tiền"
								: "Từ chối yêu cầu hoàn tiền"}
						</h3>

						<form onSubmit={handleActionSubmit} className="space-y-4">
							<div>
								<label className="block text-[11px] font-bold text-brand-dark mb-1 uppercase tracking-wide">
									Ghi chú gửi tới khách hàng{" "}
									{actionRequest.type === "reject" && (
										<span className="text-red-500">*</span>
									)}
								</label>
								<textarea
									rows={3}
									placeholder={
										actionRequest.type === "approve"
											? "Ví dụ: Đồng ý hoàn tiền. Chúng tôi sẽ xử lý giao dịch hoàn tiền vào ví..."
											: "Lý do từ chối (bắt buộc). Ví dụ: Sản phẩm đã quá hạn thời gian đổi trả..."
									}
									required={actionRequest.type === "reject"}
									value={sellerNote}
									onChange={(e) => setSellerNote(e.target.value)}
									className="w-full p-2.5 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-sans leading-relaxed"
								/>
							</div>

							<div className="flex gap-2 justify-end pt-2 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setActionRequest(null)}
									className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={approveMutation.isPending || rejectMutation.isPending}
									className={`px-4 py-1.5 font-black text-xs rounded-md cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-2xs ${
										actionRequest.type === "approve"
											? "bg-emerald-600 hover:bg-emerald-700 text-white"
											: "bg-red-600 hover:bg-red-700 text-white"
									}`}
								>
									{approveMutation.isPending || rejectMutation.isPending ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										"Xác nhận"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
