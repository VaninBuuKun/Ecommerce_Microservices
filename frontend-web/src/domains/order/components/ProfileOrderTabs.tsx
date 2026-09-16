import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Loader2,
	Search,
	RefreshCw,
	ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/domains/auth";
import { useBuyNowOrReorder } from "@/domains/cart";
import { useCustomerOrdersQuery } from "../hooks/useOrders";
import { getOrderStatusBadge } from "./VoucherHelpers";
import { CustomerOrderDetailView } from "./CustomerOrderDetailView";

export { RefundRequestsTab } from "./refund";

export function MyOrdersTab({ customerId }: { customerId?: number }) {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const effectiveCustomerId = customerId ?? (user?.id ? Number(user.id) : undefined);
	const { buyNowOrReorder } = useBuyNowOrReorder();
	const [isReorderingId, setIsReorderingId] = useState<string | null>(null);

	const {
		data: customerOrders = [],
		isLoading: ordersLoading,
		refetch,
	} = useCustomerOrdersQuery(effectiveCustomerId);

	const [orderTab, setOrderTab] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [detailSubOrderId, setDetailSubOrderId] = useState<string | null>(null);
	const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});

	const ORDER_TABS = [
		{ key: "All", label: "Tất cả đơn" },
		{ key: "AwaitingPayment", label: "Chờ thanh toán" },
		{ key: "Processing", label: "Đang xử lý" },
		{ key: "Shipping", label: "Vận chuyển" },
		{ key: "Delivered", label: "Đã giao" },
		{ key: "Completed", label: "Hoàn thành" },
		{ key: "Returning", label: "Đang trả hàng" },
		{ key: "Refunded", label: "Trả hàng" },
		{ key: "Cancelled", label: "Đã hủy" },
	];

	const matchesTab = (order: any, tab: string) => {
		if (tab === "All") return true;
		if (tab === "AwaitingPayment") return order.status === "AwaitingPayment";
		if (tab === "Processing") return order.status === "Processing" || order.status === "AwaitingConfirmation";
		if (tab === "Shipping") return order.status === "Shipping" || order.status === "PackageReady";
		if (tab === "Delivered") return order.status === "Delivered";
		if (tab === "Completed") return order.status === "Completed";
		if (tab === "Returning") return order.status === "Returning";
		if (tab === "Refunded") return order.status === "Refunded";
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
			<div className="flex border-b border-brand-border overflow-x-auto select-none no-scrollbar gap-1">
				{ORDER_TABS.map((tab) => {
					const count = customerOrders.filter((order: any) => matchesTab(order, tab.key)).length;
					const isActive = orderTab === tab.key;
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => setOrderTab(tab.key)}
							className={`py-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${
								isActive
									? "border-brand-primary text-brand-primary-deep bg-brand-primary/10"
									: "border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft/50"
							}`}
						>
							<span>{tab.label}</span>
							{count > 0 && (
								<span
									className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0 transition-colors ${
										isActive
											? "bg-brand-primary text-white"
											: "bg-brand-border/60 text-brand-muted"
									}`}
								>
									{count}
								</span>
							)}
						</button>
					);
				})}
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
							<div className="flex justify-between items-center bg-brand-light-soft/50 border-b border-brand-border px-4 py-2.5">
								<div className="flex items-center gap-2.5 min-w-0">
									{/*{order.shopLogoUrl ? (*/}
									{/*	<img*/}
									{/*		src={order.shopLogoUrl}*/}
									{/*		alt={order.shopName || "Shop Logo"}*/}
									{/*		className="w-8 h-8 object-cover border border-brand-border shrink-0"*/}
									{/*	/>*/}
									{/*) : (*/}
									{/*	<div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">*/}
									{/*		<Store className="w-3.5 h-3.5 text-brand-primary" />*/}
									{/*	</div>*/}
									{/*)}*/}
									<span className="font-extrabold text-brand-dark text-xs uppercase tracking-wider truncate">
										{order.shopName || `Shop #${order.shopId || 1}`}
									</span>
									<span className="text-[10px] text-brand-muted font-bold shrink-0">
										Mã đơn: #{String(order.id).split("-")[0]}
									</span>
								</div>
								<div className="shrink-0 flex items-center ml-2">
									{getOrderStatusBadge(order.status)}
								</div>
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
														className="w-14 h-14 object-cover rounded-md border border-brand-border shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
														onClick={() => {
															if (item.productId) navigate(`/products/${item.productId}`);
														}}
													/>
													<div className="flex-1 min-w-0">
														<h4 
															className="font-extrabold text-brand-dark text-xs truncate cursor-pointer hover:text-brand-primary transition-colors"
															onClick={() => {
																if (item.productId) navigate(`/products/${item.productId}`);
															}}
														>
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
										type="button"
										onClick={async () => {
											try {
												setIsReorderingId(order.id);
												await buyNowOrReorder({
													subOrderId: order.id,
												});
												navigate("/cart");
											} catch (err: any) {
												const msg = err.response?.data?.message || err.response?.data || "Không thể mua lại đơn hàng. Vui lòng thử lại!";
												toast.error(msg);
											} finally {
												setIsReorderingId(null);
											}
										}}
										disabled={isReorderingId === order.id}
										className="flex-1 sm:flex-none px-3.5 py-1.5 bg-white border border-brand-primary text-brand-primary-deep hover:bg-brand-primary/10 rounded text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
									>
										{isReorderingId === order.id ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
										) : (
											<ShoppingBag className="w-3.5 h-3.5" />
										)}
										<span>Mua lại đơn này</span>
									</button>
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
