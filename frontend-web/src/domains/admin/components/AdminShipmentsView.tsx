import React, { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import {
	Loader2,
	RefreshCw,
	Search,
	Truck,
	CheckCircle2,
	Activity,
	FileText,
	Clock,
	Copy,
	Check,
	Send,
} from "lucide-react";
import { Pagination } from "@/shared/components/Pagination";
import { toast } from "react-toastify";

export interface ShipmentItem {
	id: string;
	subOrderId: number;
	orderId?: number;
	customerId?: number;
	waybillCode?: string;
	carrierName: string;
	shippingFee: number;
	status: string;
	recipientName: string;
	recipientPhone: string;
	recipientAddress?: string;
	createdDate?: string;
	trackingLogs?: string;
	failureReason?: string;
}

const GHN_STATUS_OPTIONS = [
	{ value: "picking", label: "Lấy hàng (picking / storing)", statusName: "Picking", desc: "Shipper đang trên đường lấy hàng từ Shop" },
	{ value: "delivering", label: "Đang giao hàng (delivering ➔ InTransit)", statusName: "InTransit", desc: "Kiện hàng đang luân chuyển và đi giao (Kích hoạt SubOrderShippedEvent)" },
	{ value: "delivered", label: "Giao hàng thành công (delivered)", statusName: "Delivered", desc: "Khách đã nhận hàng thành công (Kích hoạt SubOrderDeliveredEvent)" },
	{ value: "returned", label: "Hoàn hàng / Trả hàng (returned)", statusName: "Returned", desc: "Giao không thành công hoặc hoàn trả về Shop" },
	{ value: "cancelled", label: "Hủy vận đơn (cancelled)", statusName: "Cancelled", desc: "Hủy bỏ vận đơn vận chuyển" },
];

export function getShipmentStatusBadge(status: string) {
	const strStatus = String(status);
	switch (strStatus) {
		case "1":
		case "Created":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
					Đã tạo đơn
				</span>
			);
		case "2":
		case "ReadyToPick":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
					Chờ lấy hàng
				</span>
			);
		case "3":
		case "Picking":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
					Đang lấy hàng
				</span>
			);
		case "4":
		case "InTransit":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
					Đang vận chuyển
				</span>
			);
		case "5":
		case "Delivered":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
					Đã giao thành công
				</span>
			);
		case "6":
		case "Cancelled":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
					Đã hủy
				</span>
			);
		case "7":
		case "Returned":
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
					Đã trả hàng
				</span>
			);
		default:
			return (
				<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gray-100 text-gray-700 border border-gray-200">
					{strStatus}
				</span>
			);
	}
}

export function AdminShipmentsView() {
	const [shipments, setShipments] = useState<ShipmentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	// Modal Webhook Simulation
	const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
	const [showWebhookModal, setShowWebhookModal] = useState(false);
	const [selectedWebhookStatus, setSelectedWebhookStatus] = useState("delivering");
	const [customReason, setCustomReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Modal Tracking Logs
	const [logShipment, setLogShipment] = useState<ShipmentItem | null>(null);

	const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
				const raw = response.data?.value || response.data;
				const items: ShipmentItem[] = raw?.items || (Array.isArray(raw) ? raw : []);
				const total = raw?.totalCount ?? items.length;
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

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopiedCode(text);
		toast.success(`Đã sao chép mã ${text}`);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const handleTriggerWebhook = async () => {
		if (!selectedShipment) return;
		const code = selectedShipment.waybillCode;
		if (!code) {
			toast.error("Vận đơn này chưa có mã GHN (OrderCode / WaybillCode)!");
			return;
		}

		setSubmitting(true);
		try {
			const payload: any = {
				OrderCode: code,
				Status: selectedWebhookStatus,
			};
			if (selectedWebhookStatus === "cancelled" || selectedWebhookStatus === "returned") {
				payload.reason = customReason.trim() || "Cập nhật từ Webhook Simulator";
			}

			await api.post("/shipping-webhooks/ghn", payload);
			toast.success(
				`Bắn Webhook GHN thành công! Đã cập nhật trạng thái '${selectedWebhookStatus}' cho mã ${code}`
			);
			setShowWebhookModal(false);
			setCustomReason("");
			fetchShipments();
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Gửi webhook thất bại!";
			toast.error(msg);
		} finally {
			setSubmitting(false);
		}
	};

	// Filtered items on client if statusFilter is active
	const filteredShipments = statusFilter === "All"
		? shipments
		: shipments.filter((s) => String(s.status) === statusFilter);

	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	// Summary stats
	const pickingCount = shipments.filter((s) => ["3", "Picking", "2", "ReadyToPick"].includes(String(s.status))).length;
	const inTransitCount = shipments.filter((s) => ["4", "InTransit"].includes(String(s.status))).length;
	const deliveredCount = shipments.filter((s) => ["5", "Delivered"].includes(String(s.status))).length;
	const problemCount = shipments.filter((s) => ["6", "Cancelled", "7", "Returned"].includes(String(s.status))).length;

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
						{/*<Truck className="w-4 h-4 text-brand-primary" />*/}
						Quản lý Vận chuyển & Webhook GHN Simulator
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Theo dõi vận đơn thực tế, xem nhật ký lộ trình và mô phỏng Webhook đối tác vận chuyển GHN
					</p>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					<form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
						<input
							type="text"
							placeholder="Mã GHN, Người nhận, SĐT..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
						/>
						<Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-brand-muted" />
					</form>
					<button
						type="button"
						onClick={fetchShipments}
						disabled={loading}
						className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent shrink-0 disabled:opacity-50"
						title="Làm mới danh sách"
					>
						<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>
			</div>

			{/* Quick Stats Banner */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div className="bg-white border border-brand-border/80 rounded-lg p-3 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-brand-muted uppercase">Tổng vận đơn</span>
						<Activity className="w-3.5 h-3.5 text-slate-400" />
					</div>
					<p className="text-lg font-black text-brand-dark mt-1">{totalCount}</p>
				</div>
				<div className="bg-white border border-brand-border/80 rounded-lg p-3 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-blue-600 uppercase">Đang lấy / Chuẩn bị</span>
						<Clock className="w-3.5 h-3.5 text-blue-500" />
					</div>
					<p className="text-lg font-black text-blue-700 mt-1">{pickingCount}</p>
				</div>
				<div className="bg-white border border-brand-border/80 rounded-lg p-3 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-indigo-600 uppercase">Đang vận chuyển</span>
						<Truck className="w-3.5 h-3.5 text-indigo-500" />
					</div>
					<p className="text-lg font-black text-indigo-700 mt-1">{inTransitCount}</p>
				</div>
				<div className="bg-white border border-brand-border/80 rounded-lg p-3 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[10px] font-bold text-emerald-600 uppercase">Đã giao thành công</span>
						<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
					</div>
					<p className="text-lg font-black text-emerald-700 mt-1">{deliveredCount}</p>
				</div>
			</div>

			{/* Filter Dropdown */}
			<div className="flex flex-wrap gap-2.5 p-3 bg-brand-light-soft/50 border border-brand-border rounded-lg">
				<select
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
					className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary cursor-pointer font-bold text-brand-dark"
				>
					<option value="All">Mọi trạng thái vận đơn</option>
					<option value="Created">Đã tạo đơn</option>
					<option value="ReadyToPick">Chờ lấy hàng</option>
					<option value="Picking">Đang lấy hàng</option>
					<option value="InTransit">Đang vận chuyển</option>
					<option value="Delivered">Đã giao thành công</option>
					<option value="Cancelled">Đã hủy</option>
					<option value="Returned">Đã trả hàng</option>
				</select>
			</div>

			{/* Table Container */}
			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-2xs">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2 font-bold">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						<span>Đang tải danh sách vận đơn từ Shippings Service...</span>
					</div>
				) : filteredShipments.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">
						Chưa có vận đơn nào trong hệ thống hoặc không khớp bộ lọc.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-left border-collapse">
							<thead>
								<tr className="bg-brand-light-soft/60 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
									<th className="py-3 px-3.5 w-0.15">Mã vận đơn GHN</th>
									<th className="py-3 px-3.5 w-0.15">Đơn hàng con</th>
									<th className="py-3 px-3.5 w-1/4">Người nhận & Địa chỉ</th>
									<th className="py-3 px-3.5 text-right w-1/6">Cước phí</th>
									<th className="py-3 px-3.5 text-center w-45">Trạng thái</th>
									<th className="py-3 px-3.5 text-center w-44">Hành động</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border/60">
								{filteredShipments.map((item) => (
									<tr key={item.id} className="hover:bg-brand-light-soft/20 transition-colors">
										<td className="py-3 px-3.5 font-mono font-bold text-brand-dark">
											{item.waybillCode ? (
												<div className="flex items-center gap-1.5">
													<span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md text-[11px] font-black">
														{item.waybillCode}
													</span>
													<button
														type="button"
														onClick={() => copyToClipboard(item.waybillCode!)}
														className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
														title="Sao chép mã"
													>
														{copiedCode === item.waybillCode ? (
															<Check className="w-3 h-3 text-emerald-600" />
														) : (
															<Copy className="w-3 h-3" />
														)}
													</button>
												</div>
											) : (
												<span className="text-brand-muted font-bold text-[10px]">Chưa tạo mã GHN</span>
											)}
										</td>
										<td className="py-3 px-3.5 font-mono font-bold text-brand-dark">
											#{String(item.subOrderId).split("-")[0].toUpperCase()}
										</td>
										<td className="py-3 px-3.5">
											<p className="font-extrabold text-brand-dark">{item.recipientName || "Khách hàng"}</p>
											<p className="text-[10px] font-mono text-brand-muted">{item.recipientPhone || "N/A"}</p>
										</td>
										<td className="py-3 px-3.5 text-right font-black text-brand-dark">
											{Number(item.shippingFee || 0).toLocaleString("vi-VN")}đ
										</td>
										<td className="py-3 px-3.5 text-center">
											{getShipmentStatusBadge(item.status)}
										</td>
										<td className="py-3 px-3.5 text-right">
											<div className="flex items-center justify-end gap-1.5">
												{/* View Logs Button */}
												<button
													type="button"
													onClick={() => setLogShipment(item)}
													className="px-2 py-1 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark text-[10px] font-bold rounded-md transition-all cursor-pointer shadow-2xs flex items-center gap-1"
													title="Xem lịch sử tracking logs"
												>
													<FileText className="w-3 h-3" />
													<span>Logs</span>
												</button>

												{/* Webhook Modal Trigger Button */}
												<button
													type="button"
													onClick={() => {
														setSelectedShipment(item);
														setShowWebhookModal(true);
													}}
													className="px-2.5 py-1 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark text-[10px] font-black rounded-md transition-all cursor-pointer border-none flex items-center gap-1 shadow-2xs"
												>
													<Send className="w-3 h-3" />
													<span>Webhook</span>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* Pagination Footer */}
				<div className="px-4 py-2.5 border-t border-brand-border bg-brand-light-soft/20 text-xs">
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

			{/* Modal GHN Webhook Simulation */}
			{showWebhookModal && selectedShipment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-xl w-full max-w-md p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-3 flex justify-between items-start">
							<div>
								<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
									<Send className="w-3.5 h-3.5 text-brand-primary" />
									Mô phỏng Webhook GHN Carrier
								</h3>
								<p className="text-[10px] text-brand-muted font-bold mt-1">
									Vận đơn: <span className="font-mono text-brand-dark font-black">{selectedShipment.waybillCode || "N/A"}</span> | SubOrder #{String(selectedShipment.subOrderId).split("-")[0].toUpperCase()}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowWebhookModal(false)}
								className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
							>
								✕
							</button>
						</div>

						<div className="space-y-3 text-xs">
							<div className="space-y-1">
								<label className="block text-[10px] font-extrabold text-brand-muted uppercase">
									Trạng thái Webhook GHN gửi về
								</label>
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
								<p className="text-[10px] text-brand-muted font-medium pt-0.5">
									{GHN_STATUS_OPTIONS.find((o) => o.value === selectedWebhookStatus)?.desc}
								</p>
							</div>

							{(selectedWebhookStatus === "cancelled" || selectedWebhookStatus === "returned") && (
								<div className="space-y-1">
									<label className="block text-[10px] font-extrabold text-brand-muted uppercase">
										Lý do hủy / trả hàng (Failure Reason)
									</label>
									<textarea
										value={customReason}
										onChange={(e) => setCustomReason(e.target.value)}
										placeholder="Ví dụ: Khách không nghe máy 3 lần, địa chỉ không tìm thấy..."
										rows={2}
										className="w-full px-3 py-2 border border-brand-border rounded-md font-semibold text-brand-dark focus:outline-none focus:border-brand-primary text-xs"
									/>
								</div>
							)}

							<div className="bg-brand-light-soft/50 p-2.5 rounded-md border border-brand-border text-[10px] text-brand-muted font-medium leading-relaxed">
								* Khi gửi Webhook thành công, Shippings Service sẽ cập nhật trạng thái Shipment và phát bắn Event <span className="font-mono text-brand-dark font-bold">SubOrderShippedEvent / SubOrderDeliveredEvent</span> qua RabbitMQ để Orders Service tự động đồng bộ trạng thái đơn hàng.
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
							<button
								type="button"
								onClick={() => {
									setShowWebhookModal(false);
									setCustomReason("");
								}}
								className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer border-none"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={handleTriggerWebhook}
								disabled={submitting}
								className="px-4 py-1.5 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-md font-black text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 border-none"
							>
								{submitting ? (
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										<span>Đang gửi...</span>
									</>
								) : (
									<>
										<Send className="w-3.5 h-3.5" />
										<span>Bắn Webhook GHN</span>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Tracking Logs */}
			{logShipment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-xl w-full max-w-lg p-5 shadow-2xl text-left space-y-4">
						<div className="border-b border-brand-border pb-3 flex justify-between items-start">
							<div>
								<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
									<FileText className="w-3.5 h-3.5 text-brand-primary" />
									Nhật ký hành trình vận đơn (Tracking Logs)
								</h3>
								<p className="text-[10px] text-brand-muted font-bold mt-1">
									Mã GHN: <span className="font-mono text-brand-dark font-black">{logShipment.waybillCode || "N/A"}</span>
								</p>
							</div>
							<button
								type="button"
								onClick={() => setLogShipment(null)}
								className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
							>
								✕
							</button>
						</div>

						<div className="space-y-3 text-xs max-h-80 overflow-y-auto font-mono">
							<div className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg text-[11px] leading-relaxed whitespace-pre-wrap">
								{logShipment.trackingLogs || "Chưa có tracking logs nào được ghi nhận."}
							</div>

							{logShipment.failureReason && (
								<div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-md font-sans text-xs">
									<span className="font-bold">Lý do thất bại / hủy đơn:</span> {logShipment.failureReason}
								</div>
							)}
						</div>

						<div className="flex justify-end pt-3 border-t border-brand-border">
							<button
								type="button"
								onClick={() => setLogShipment(null)}
								className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs cursor-pointer border-none"
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
