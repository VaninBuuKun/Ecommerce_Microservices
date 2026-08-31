import { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import { Loader2, RefreshCw, Search, Truck, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export interface ShipmentItem {
	id: number;
	subOrderId: number;
	orderId: number;
	customerId: number;
	waybillCode?: string;
	carrierName: string;
	shippingFee: number;
	status: string | number;
	recipientName: string;
	recipientPhone: string;
	createdDate?: string;
}

const GHN_STATUS_OPTIONS = [
	{ value: "picking", label: "Lấy hàng (picking / storing)", statusName: "Picking" },
	{ value: "delivering", label: "Đang giao hàng (delivering -> InTransit)", statusName: "InTransit" },
	{ value: "delivered", label: "Giao hàng thành công (delivered)", statusName: "Delivered" },
	{ value: "returned", label: "Hoàn hàng / Trả hàng (returned)", statusName: "Returned" },
	{ value: "cancelled", label: "Hủy vận đơn (cancelled)", statusName: "Cancelled" },
];

export function getShipmentStatusBadge(status: string | number) {
	const strStatus = String(status);
	switch (strStatus) {
		case "1":
		case "Created":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">Đã tạo đơn</span>;
		case "2":
		case "ReadyToPick":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">Chờ lấy hàng</span>;
		case "3":
		case "Picking":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">Đang lấy hàng</span>;
		case "4":
		case "InTransit":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">Đang vận chuyển</span>;
		case "5":
		case "Delivered":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Đã giao thành công</span>;
		case "6":
		case "Cancelled":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">Đã hủy</span>;
		case "7":
		case "Returned":
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">Đã trả hàng</span>;
		default:
			return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gray-100 text-gray-700 border border-gray-200">{strStatus}</span>;
	}
}

export function AdminShipmentsView() {
	const [shipments, setShipments] = useState<ShipmentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	// Modal State
	const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
	const [showWebhookModal, setShowWebhookModal] = useState(false);
	const [selectedWebhookStatus, setSelectedWebhookStatus] = useState("delivering");
	const [customReason, setCustomReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

	const fetchShipments = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
			});
			if (searchQuery.trim()) {
				params.append("search", searchQuery.trim());
			}

			const response = await api.get(`/shipments?${params.toString()}`).catch(() => null);
			if (response?.data) {
				const items = response.data?.items || response.data?.value?.items || [];
				const total = response.data?.totalCount ?? items.length;
				setShipments(items);
				setTotalCount(total);
			} else {
				setShipments([]);
				setTotalCount(0);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách vận đơn", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShipments();
	}, [page]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchShipments();
	};

	const handleTriggerWebhook = async () => {
		if (!selectedShipment) return;
		if (!selectedShipment.waybillCode) {
			setAlertMsg({ type: "error", text: "Vận đơn này chưa có mã GHN (OrderCode / WaybillCode)!" });
			return;
		}

		setSubmitting(true);
		try {
			const payload: any = {
				OrderCode: selectedShipment.waybillCode,
				Status: selectedWebhookStatus,
			};
			if (selectedWebhookStatus === "cancelled" || selectedWebhookStatus === "returned") {
				payload.reason = customReason.trim() || "Cập nhật từ hệ thống quản trị Admin";
			}

			await api.post("/shipping-webhooks/ghn", payload);
			setAlertMsg({
				type: "success",
				text: `Đã gửi Webhook GHN thành công! Trạng thái: '${selectedWebhookStatus}' cho mã ${selectedShipment.waybillCode}`,
			});
			setShowWebhookModal(false);
			setCustomReason("");
			fetchShipments();
		} catch (err: any) {
			setAlertMsg({
				type: "error",
				text: err.response?.data?.message || err.response?.data || "Gửi webhook thất bại!",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Quản lý vận chuyển & Vận đơn (Shipments)
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Theo dõi trạng thái giao hàng thực tế và mô phỏng Webhook đối tác vận chuyển GHN
					</p>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					<form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
						<input
							type="text"
							placeholder="Mã GHN, người nhận, SĐT..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
						/>
						<Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
					</form>
					<button onClick={fetchShipments} className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent shrink-0">
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Notification banner */}
			{alertMsg && (
				<div className={`p-3 rounded-md text-xs font-bold flex items-center justify-between ${alertMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
					<div className="flex items-center gap-2">
						{alertMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
						<span>{alertMsg.text}</span>
					</div>
					<button onClick={() => setAlertMsg(null)} className="text-xs font-black cursor-pointer px-1.5 py-0.5 hover:bg-black/5 rounded-md">✕</button>
				</div>
			)}

			{/* Table Container */}
			<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách vận đơn...
					</div>
				) : shipments.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Chưa có vận đơn nào được tạo trong hệ thống.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-left border-collapse">
							<thead>
								<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
									<th className="p-3 w-1/5">Mã vận đơn GHN</th>
									<th className="p-3 w-1/5">Đơn hàng con</th>
									<th className="p-3 w-1/4">Người nhận</th>
									<th className="p-3 text-right w-1/6">Cước phí</th>
									<th className="p-3 text-center w-28">Trạng thái</th>
									<th className="p-3 text-right w-36">Hành động</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border">
								{shipments.map((item) => (
									<tr key={item.id} className="hover:bg-brand-light-soft/10 transition-colors">
										<td className="p-3 font-mono font-black text-brand-dark">
											{item.waybillCode ? (
												<span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md text-[11px]">
													{item.waybillCode}
												</span>
											) : (
												<span className="text-brand-muted font-bold text-[10px]">Chưa tạo mã GHN</span>
											)}
										</td>
										<td className="p-3 font-mono font-bold text-brand-muted">
											#{String(item.subOrderId).split("-")[0].toUpperCase()}
										</td>
										<td className="p-3">
											<p className="font-extrabold text-brand-dark">{item.recipientName || "Khách hàng"}</p>
											<p className="text-[10px] font-mono text-brand-muted">{item.recipientPhone || "N/A"}</p>
										</td>
										<td className="p-3 text-right font-black text-brand-dark">
											{Number(item.shippingFee || 0).toLocaleString("vi-VN")}đ
										</td>
										<td className="p-3 text-center">
											{getShipmentStatusBadge(item.status)}
										</td>
										<td className="p-3 text-right">
											<button
												type="button"
												onClick={() => {
													setSelectedShipment(item);
													setShowWebhookModal(true);
												}}
												className="px-2.5 py-1 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark text-[10px] font-black rounded-md transition-all cursor-pointer border-none flex items-center gap-1 ml-auto"
											>
												Cập nhật Webhook <ArrowRight className="w-3 h-3" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination Footer */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between p-3 border-t border-brand-border text-xs text-brand-muted font-bold">
						<span>Trang {page} / {totalPages} (Tổng {totalCount} vận đơn)</span>
						<div className="flex items-center gap-1">
							<button
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
								className="px-2.5 py-1 bg-white border border-brand-border rounded-md hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
							>
								&lt; Trước
							</button>
							<button
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="px-2.5 py-1 bg-white border border-brand-border rounded-md hover:bg-brand-light-soft disabled:opacity-40 cursor-pointer font-extrabold"
							>
								Sau &gt;
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Modal GHN Webhook Simulation */}
			{showWebhookModal && selectedShipment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-md w-full max-w-md p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-3">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
								Mô phỏng Webhook GHN Carrier
							</h3>
							<p className="text-[10px] text-brand-muted font-bold mt-1">
								Vận đơn mã: <span className="font-mono text-brand-dark font-black">{selectedShipment.waybillCode || "N/A"}</span>
							</p>
						</div>

						<div className="space-y-3 text-xs">
							<div className="space-y-1">
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase">Trạng thái giao vận GHN khả dụng</label>
								<select
									value={selectedWebhookStatus}
									onChange={(e) => setSelectedWebhookStatus(e.target.value)}
									className="w-full px-3 py-2 border border-brand-border rounded-md bg-white font-bold text-brand-dark focus:outline-none focus:border-brand-primary"
								>
									{GHN_STATUS_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{(selectedWebhookStatus === "cancelled" || selectedWebhookStatus === "returned") && (
								<div className="space-y-1">
									<label className="block text-[10px] font-extrabold text-brand-muted uppercase">Lý do hủy / trả hàng</label>
									<textarea
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										placeholder="Nhập lý do đối tác trả hàng hoặc hủy đơn..."
										rows={2}
										className="w-full px-3 py-2 border border-brand-border rounded-md font-semibold text-brand-dark focus:outline-none focus:border-brand-primary text-xs"
									/>
								</div>
							)}

							<div className="bg-brand-light-soft/50 p-2.5 rounded-md border border-brand-border text-[10px] text-brand-muted font-semibold leading-relaxed">
								* Khi gửi Webhook thành công, Shippings Service sẽ tự động cập nhật trạng thái Shipment và phát bắn Event <span className="font-mono text-brand-dark font-bold">SubOrderShippedEvent / SubOrderDeliveredEvent</span> qua RabbitMQ.
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
							<button
								type="button"
								onClick={() => {
									setShowWebhookModal(false);
									setCustomReason("");
								}}
								className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={handleTriggerWebhook}
								disabled={submitting}
								className="px-4 py-1.5 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-md font-black text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
							>
								{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Bắn Webhook GHN
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
