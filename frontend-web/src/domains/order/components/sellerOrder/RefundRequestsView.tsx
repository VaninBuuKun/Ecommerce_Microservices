import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
	useShopRefundsQuery,
	useApproveRefundMutation,
	useRejectRefundMutation,
} from "@/domains/order";
import { SubOrderDetailView } from "./SubOrderDetailView";
import {
	Loader2,
	Calendar,
	User,
	DollarSign,
	Check,
	X,
	Eye,
	AlertCircle,
	CornerDownRight,
	MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";

interface RefundRequest {
	id: number;
	subOrderId: string;
	customerId: number;
	shopId: number;
	refundAmount: number;
	reason: string;
	sellerNote?: string;
	status: string;
	createdDate: string;
}

export default function RefundRequestsView() {
	const { shopId } = useParams<{ shopId?: string }>();
	const {
		data: serverData,
		isLoading,
		refetch,
	} = useShopRefundsQuery(shopId ? Number(shopId) : undefined);

	const approveMutation = useApproveRefundMutation();
	const rejectMutation = useRejectRefundMutation();

	// Modal and action states
	const [activeSubOrderId, setActiveSubOrderId] = useState<string | null>(
		null,
	);
	const [actionRequest, setActionRequest] = useState<{
		id: number;
		type: "approve" | "reject";
	} | null>(null);
	const [sellerNote, setSellerNote] = useState("");

	// Determine data source
	const refundRequests: RefundRequest[] = serverData || [];

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
						toast.success("Đã chấp nhận hoàn tiền!");
						setSellerNote("");
						setActionRequest(null);
						refetch();
					},
					onError: (err: any) => {
						toast.error(
							err?.response?.data || "Duyệt hoàn tiền thất bại!",
						);
					},
				},
			);
		} else {
			rejectMutation.mutate(
				{ id, sellerNote: sellerNote.trim() },
				{
					onSuccess: () => {
						toast.success("Đã từ chối hoàn tiền!");
						setSellerNote("");
						setActionRequest(null);
						refetch();
					},
					onError: (err: any) => {
						toast.error(
							err?.response?.data ||
								"Từ chối hoàn tiền thất bại!",
						);
					},
				},
			);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3 font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách yêu cầu hoàn tiền...
			</div>
		);
	}

	return (
		<div className="space-y-6 font-sans text-brand-dark text-left">
			<div className="pb-3 border-b border-brand-border flex justify-between items-center">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Các yêu cầu hoàn tiền
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem và xử lý các yêu cầu trả hàng, hoàn tiền từ khách
						hàng.
					</p>
				</div>
			</div>

			{refundRequests.length === 0 ? (
				<div className="text-center py-16 border border-dashed border-brand-border rounded-2xl text-brand-muted font-bold text-xs bg-brand-light-soft/10">
					Không có yêu cầu hoàn tiền nào gửi tới shop của bạn.
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{refundRequests.map((req) => (
						<div
							key={req.id}
							className={`border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
								req.status === "Pending"
									? "border-amber-200 bg-amber-50/5"
									: req.status === "Approved"
										? "border-emerald-200 bg-emerald-50/5"
										: "border-brand-border"
							}`}
						>
							<div className="space-y-3">
								{/* Card Header */}
								<div className="flex justify-between items-start gap-2">
									<div className="space-y-0.5">
										<span className="text-[10px] font-bold text-brand-muted block uppercase tracking-wide">
											Mã đơn hàng con
										</span>
										<span className="font-extrabold text-xs text-brand-dark">
											#{req.subOrderId}
										</span>
									</div>
									<span
										className={`text-[9px] font-black px-2 py-0.8 rounded uppercase tracking-wider ${
											req.status === "Pending"
												? "bg-amber-100 text-amber-700"
												: req.status === "Approved"
													? "bg-emerald-100 text-emerald-700"
													: "bg-red-100 text-red-700"
										}`}
									>
										{req.status === "Pending"
											? "Chờ xử lý"
											: req.status === "Approved"
												? "Đã duyệt"
												: "Từ chối"}
									</span>
								</div>

								{/* Amount and requester info */}
								<div className="grid grid-cols-2 gap-4 py-2 border-y border-brand-border/60">
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
											<DollarSign className="w-4 h-4 text-red-500" />
										</div>
										<div>
											<span className="text-[9px] font-bold text-brand-muted block uppercase">
												Hoàn trả
											</span>
											<span className="font-black text-xs text-red-500">
												{req.refundAmount.toLocaleString(
													"vi-VN",
												)}
												đ
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-brand-light-soft flex items-center justify-center">
											<User className="w-4 h-4 text-brand-muted" />
										</div>
										<div>
											<span className="text-[9px] font-bold text-brand-muted block uppercase">
												Khách hàng
											</span>
											<span className="font-bold text-xs text-brand-dark">
												User #{req.customerId}
											</span>
										</div>
									</div>
								</div>

								{/* Details / Reason */}
								<div className="space-y-1 bg-brand-light-soft/20 p-3 rounded-lg border border-brand-border/40">
									<div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
										<AlertCircle className="w-3.5 h-3.5 text-brand-primary" />
										Lý do hoàn tiền
									</div>
									<p className="text-xs text-brand-dark font-medium leading-relaxed">
										{req.reason}
									</p>
								</div>

								{/* Seller Note (If exists) */}
								{req.sellerNote && (
									<div className="space-y-1 bg-brand-light-soft/40 p-3 rounded-lg border border-brand-border/60">
										<div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
											<CornerDownRight className="w-3.5 h-3.5 text-brand-muted" />
											Phản hồi từ shop
										</div>
										<p className="text-xs text-brand-muted italic font-medium leading-relaxed">
											{req.sellerNote}
										</p>
									</div>
								)}

								<div className="flex items-center gap-1 text-[10px] text-brand-muted font-bold pt-1">
									<Calendar className="w-3.5 h-3.5" />
									Yêu cầu lúc:{" "}
									{new Date(req.createdDate).toLocaleString(
										"vi-VN",
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-2.5 pt-3 border-t border-brand-border/60">
								<button
									onClick={() =>
										setActiveSubOrderId(req.subOrderId)
									}
									className="flex-1 h-8 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white flex items-center justify-center gap-1"
								>
									<Eye className="w-3.5 h-3.5" />
									Chi tiết đơn
								</button>

								{req.status === "Pending" && (
									<>
										<button
											onClick={() =>
												setActionRequest({
													id: req.id,
													type: "reject",
												})
											}
											className="h-8 px-3 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white flex items-center justify-center gap-1"
										>
											<X className="w-3.5 h-3.5" />
											Từ chối
										</button>
										<button
											onClick={() =>
												setActionRequest({
													id: req.id,
													type: "approve",
												})
											}
											className="h-8 px-3.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs"
										>
											<Check className="w-3.5 h-3.5" />
											Chấp nhận
										</button>
									</>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* 1. ORDER DETAIL VIEW MODAL */}
			{activeSubOrderId && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="bg-white border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setActiveSubOrderId(null)}
							className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide border-b border-brand-border pb-3">
							Chi tiết đơn hàng hoàn trả
						</h2>

						<div className="max-h-[70vh] overflow-y-auto pr-1">
							<SubOrderDetailView
								subOrderId={activeSubOrderId}
								isSeller={true}
							/>
						</div>

						<div className="flex pt-3 border-t border-brand-border/60">
							<button
								onClick={() => setActiveSubOrderId(null)}
								className="w-full h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-lg transition-colors cursor-pointer bg-white"
							>
								Đóng lại
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 2. REACTION NOTE DIALOG MODAL (APPROVE/REJECT NOTES) */}
			{actionRequest && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="bg-white border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setActionRequest(null)}
							className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-sm font-black text-brand-dark flex items-center gap-1.5 uppercase tracking-wide border-b border-brand-border pb-3">
							<MessageSquare className="w-5 h-5 text-brand-primary" />
							{actionRequest.type === "approve"
								? "Duyệt yêu cầu hoàn tiền"
								: "Từ chối yêu cầu hoàn tiền"}
						</h2>

						<form
							onSubmit={handleActionSubmit}
							className="space-y-4"
						>
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
											? "Ví dụ: Đồng ý hoàn tiền. Chúng tôi sẽ xử lý giao dịch..."
											: "Lý do từ chối (bắt buộc). Ví dụ: Sản phẩm đã quá hạn thời gian đổi trả..."
									}
									required={actionRequest.type === "reject"}
									value={sellerNote}
									onChange={(e) =>
										setSellerNote(e.target.value)
									}
									className="w-full p-3 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-sans"
								/>
							</div>

							<div className="flex gap-3 pt-3 border-t border-brand-border/60">
								<button
									type="button"
									onClick={() => setActionRequest(null)}
									className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-lg transition-colors cursor-pointer bg-white"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={
										approveMutation.isPending ||
										rejectMutation.isPending
									}
									className={`flex-1 h-9 font-black text-xs rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 ${
										actionRequest.type === "approve"
											? "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark"
											: "bg-red-500 hover:bg-red-600 text-white"
									}`}
								>
									{approveMutation.isPending ||
									rejectMutation.isPending ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										"Xác nhận"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
