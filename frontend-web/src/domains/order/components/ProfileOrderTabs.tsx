import { useState } from "react";
import {
	Package,
	ArrowLeftRight,
	Loader2,
	Search,
	CornerDownRight,
	RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import {
	useCustomerOrdersQuery,
	useMyRefundsQuery,
	useCancelRefundMutation,
} from "../hooks/useOrders";
import { getOrderStatusBadge } from "./VoucherHelpers";
import { CustomerOrderDetailView } from "./CustomerOrderDetailView";

export function MyOrdersTab({ customerId }: { customerId?: number }) {
	const {
		data: customerOrders = [],
		isLoading: ordersLoading,
		refetch,
	} = useCustomerOrdersQuery(customerId || 1);

	const [orderTab, setOrderTab] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [detailSubOrderId, setDetailSubOrderId] = useState<number | null>(null);
	const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});

	const matchesTab = (order: any, tab: string) => {
		if (tab === "All") return true;
		if (tab === "AwaitingPayment") return order.status === "AwaitingPayment";
		if (tab === "Processing") return order.status === "Processing" || order.status === "AwaitingConfirmation";
		if (tab === "Shipping") return order.status === "Shipping" || order.status === "PackageReady";
		if (tab === "Delivered") return order.status === "Delivered" || order.status === "Completed";
		if (tab === "Cancelled") return order.status === "Cancelled" || order.status === "Rejected";
		return true;
	};

	const filteredOrders = customerOrders.filter((order: any) => {
		const inTab = matchesTab(order, orderTab);
		if (!inTab) return false;

		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();
		return (
			String(order.id).toLowerCase().includes(query) ||
			(order.shopName && order.shopName.toLowerCase().includes(query)) ||
			order.orderItems?.some((item: any) =>
				item.productName.toLowerCase().includes(query),
			)
		);
	});

	if (detailSubOrderId) {
		return (
			<CustomerOrderDetailView
				subOrderId={detailSubOrderId}
				onBack={() => setDetailSubOrderId(null)}
			/>
		);
	}

	return (
		<div className="space-y-5 text-left font-sans">
			<div className="pb-3 border-b border-brand-border flex justify-between items-center">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Đơn hàng của tôi
					</h2>
					<p className="text-xs text-brand-muted">
						Theo dõi và kiểm tra lịch sử tất cả các đơn hàng bạn đã mua trên Buu Store.
					</p>
				</div>
				<button
					onClick={() => refetch()}
					className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer bg-white"
				>
					<RefreshCw className="w-3 h-3" /> Làm mới
				</button>
			</div>

			{/* Tab bars */}
			<div className="flex border-b border-brand-border overflow-x-auto select-none no-scrollbar">
				{[
					{ key: "All", label: "Tất cả đơn" },
					{ key: "AwaitingPayment", label: "Chờ thanh toán" },
					{ key: "Processing", label: "Đang xử lý" },
					{ key: "Shipping", label: "Đang vận chuyển" },
					{ key: "Delivered", label: "Đã giao" },
					{ key: "Cancelled", label: "Đã hủy" },
				].map((tab) => (
					<button
						key={tab.key}
						onClick={() => setOrderTab(tab.key)}
						className={`py-3 px-4 text-xs font-extrabold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
							orderTab === tab.key
								? "border-brand-primary text-brand-primary-deep"
								: "border-transparent text-brand-muted hover:text-brand-dark"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Search Order bar */}
			<div className="relative flex items-center w-full bg-brand-light-soft rounded-md p-2">
				<Search className="w-4 h-4 text-brand-muted ml-2 shrink-0" />
				<input
					type="text"
					placeholder="Tìm đơn hàng theo Mã đơn hàng, Nhà bán hoặc Tên sản phẩm..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full bg-transparent px-3 text-xs focus:outline-none border-none text-brand-dark h-8 placeholder:text-brand-muted"
				/>
				<button className="px-4 py-1.5 bg-white border border-brand-border text-brand-dark hover:bg-brand-light-soft rounded-md text-xs font-bold shrink-0 shadow-sm transition-all border-none">
					Tìm đơn hàng
				</button>
			</div>

			{/* Orders list */}
			<div className="space-y-4">
				{ordersLoading ? (
					<div className="flex flex-col items-center py-20 text-brand-muted text-xs gap-3">
						<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
						Đang tải lịch sử mua hàng...
					</div>
				) : filteredOrders.length === 0 ? (
					<div className="text-center py-16 border border-dashed border-brand-border rounded-md text-brand-muted font-medium text-xs">
						Chưa có đơn hàng nào trong mục này.
					</div>
				) : (
					filteredOrders.map((order: any) => (
						<div
							key={order.id}
							className="border border-brand-border rounded-md overflow-hidden bg-white shadow-xs hover:shadow-md transition-all text-left"
						>
							{/* Shop header and status */}
							<div className="flex justify-between items-center bg-brand-light-soft/50 border-b border-brand-border px-4 py-3">
								<div className="flex items-center gap-2">
									<span className="font-extrabold text-brand-dark text-xs uppercase tracking-wider">
										{order.shopName || `Shop #${order.shopId || 1}`}
									</span>
									<span className="text-[10px] text-brand-muted font-bold">
										Mã đơn: #{String(order.id).split("-")[0]}
									</span>
								</div>
								{getOrderStatusBadge(order.status)}
							</div>

							{/* Products items */}
							<div className="p-4 space-y-3">
								{(() => {
									const items = order.orderItems || [];
									const isExpanded = !!showAllItems[order.id];
									const displayItems = isExpanded
										? items
										: items.slice(0, 2);
									return (
										<>
											{displayItems.map((item: any, idx: number) => (
												<div key={idx} className="flex gap-3 items-center">
													<img
														src={
															item.thumbnailUrl ||
															item.imageUrl ||
															"https://via.placeholder.com/150"
														}
														alt={item.productName}
														className="w-14 h-14 object-cover rounded-md border border-brand-border shrink-0"
													/>
													<div className="flex-1 min-w-0">
														<h4 className="font-extrabold text-brand-dark text-xs truncate">
															{item.productName}
														</h4>
														{item.variantName && (
															<p className="text-[10px] font-bold text-brand-muted mt-0.5">
																Phân loại: {item.variantName}
															</p>
														)}
														<p className="text-[10px] text-brand-muted font-medium mt-0.5">
															Số lượng: x{item.quantity}
														</p>
													</div>
													<div className="text-right shrink-0">
														<span className="font-extrabold text-brand-dark text-xs">
															{Number(item.unitPrice || 0).toLocaleString("vi-VN")}đ
														</span>
													</div>
												</div>
											))}

											{items.length > 2 && (
												<div className="flex justify-start pt-1">
													<button
														type="button"
														onClick={() =>
															setShowAllItems((prev) => ({
																...prev,
																[order.id]: !isExpanded,
															}))
														}
														className="text-[10px] font-extrabold text-brand-muted hover:text-brand-primary border border-brand-border/60 rounded px-2.5 py-1 bg-white hover:bg-brand-light-soft transition-all cursor-pointer shadow-xs"
													>
														{isExpanded
															? "Thu gọn"
															: `Xem thêm ${items.length - 2} sản phẩm`}
													</button>
												</div>
											)}
										</>
									);
								})()}
							</div>

							{/* Total price and actions */}
							<div className="border-t border-brand-border p-4 bg-brand-light-soft/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
								<div className="flex items-center gap-1.5">
									<span className="text-xs text-brand-muted font-bold">
										Tổng tiền:
									</span>
									<span className="text-sm font-black text-brand-primary-deep">
										{Number(order.grandTotal || 0).toLocaleString("vi-VN")}đ
									</span>
								</div>
								<div className="flex gap-2 w-full sm:w-auto">
									<button
										onClick={() => setDetailSubOrderId(order.id)}
										className="flex-1 sm:flex-none px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
									>
										Xem chi tiết
									</button>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export function RefundRequestsTab() {
	const { data: refunds = [], isLoading, refetch } = useMyRefundsQuery();
	const cancelRefundMutation = useCancelRefundMutation();

	const handleCancelRefund = async (id: number) => {
		if (window.confirm("Bạn muốn rút lại yêu cầu hoàn tiền này?")) {
			try {
				await cancelRefundMutation.mutateAsync(id);
				toast.success("Đã rút yêu cầu hoàn tiền thành công!");
				refetch();
			} catch (err: any) {
				toast.error(err?.response?.data || "Thao tác thất bại!");
			}
		}
	};

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border flex justify-between items-center">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Yêu cầu hoàn tiền
					</h2>
					<p className="text-xs text-brand-muted">
						Theo dõi các khiếu nại trả hàng / hoàn tiền của bạn đã gửi cho các shop.
					</p>
				</div>
				<button
					onClick={() => refetch()}
					className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer bg-white"
				>
					<RefreshCw className="w-3.5 h-3.5" /> Làm mới
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-12 text-xs text-brand-muted gap-2">
					<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách khiếu nại...
				</div>
			) : refunds.length === 0 ? (
				<div className="text-center py-16 text-brand-muted font-bold text-xs space-y-2 bg-brand-light-soft/20 rounded-md border border-dashed border-brand-border">
					<ArrowLeftRight className="w-10 h-10 text-brand-muted mx-auto opacity-40" />
					<p>Bạn chưa gửi yêu cầu hoàn tiền nào.</p>
				</div>
			) : (
				<div className="space-y-4">
					{refunds.map((ref: any) => (
						<div
							key={ref.id}
							className="p-4 border border-brand-border rounded-md bg-white space-y-3 shadow-xs hover:border-brand-dark/30 transition-all"
						>
							<div className="flex items-center justify-between border-b border-brand-border pb-2 text-xs">
								<span className="font-mono font-bold text-brand-dark">
									Mã đơn con #{String(ref.subOrderId).split("-")[0].toUpperCase()}
								</span>
								<span
									className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
										ref.status === "Pending"
											? "bg-amber-100 text-amber-700"
											: ref.status === "Approved"
												? "bg-emerald-100 text-emerald-700"
												: "bg-red-100 text-red-700"
									}`}
								>
									{ref.status === "Pending"
										? "Chờ shop phản hồi"
										: ref.status === "Approved"
											? "Đã duyệt hoàn tiền"
											: "Shop từ chối"}
								</span>
							</div>

							<div className="space-y-1.5 text-xs">
								<div className="font-semibold text-brand-dark flex items-start gap-1">
									<span className="text-brand-muted">Lý do:</span> {ref.reason}
								</div>
								{ref.sellerNote && (
									<div className="bg-brand-light-soft/60 p-2.5 rounded-md border border-brand-border/60 text-[11px] text-brand-muted italic flex items-center gap-1.5">
										<CornerDownRight className="w-3.5 h-3.5 text-brand-muted shrink-0" />
										<span>Phản hồi từ shop: {ref.sellerNote}</span>
									</div>
								)}
							</div>

							<div className="flex justify-between items-center text-xs pt-2 border-t border-brand-border/60">
								<div className="font-black text-red-500">
									Số tiền hoàn trả:{" "}
									<span className="text-sm font-extrabold ml-1">
										{Number(ref.refundAmount || 0).toLocaleString("vi-VN")}đ
									</span>
								</div>

								{ref.status === "Pending" && (
									<button
										onClick={() => handleCancelRefund(ref.id)}
										disabled={cancelRefundMutation.isPending}
										className="h-7 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-[10px] font-bold cursor-pointer bg-white"
									>
										Rút yêu cầu
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
