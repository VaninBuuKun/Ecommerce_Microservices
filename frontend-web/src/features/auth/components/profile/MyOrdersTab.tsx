import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCustomerOrdersQuery } from "../../../order/hooks/useCheckoutQueries";
import { CustomerOrderDetailView } from "./CustomerOrderDetailView";
import { getOrderStatusBadge } from "../../../order/utils/statusHelper";

interface MyOrdersTabProps {
	customerId?: string;
}

export function MyOrdersTab({ customerId }: MyOrdersTabProps) {
	const { data: customerOrders, isLoading: ordersLoading } =
		useCustomerOrdersQuery(customerId);
	const [orderTab, setOrderTab] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [detailSubOrderId, setDetailSubOrderId] = useState<string | null>(
		null,
	);
	const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>(
		{},
	);

	const handleReorder = () => {
		toast.success("Sản phẩm đã được thêm lại vào giỏ hàng của bạn!");
	};

	const matchesTab = (order: any, tab: string) => {
		if (tab === "All") return true;
		if (tab === "AwaitingPayment")
			return order.status === "AwaitingPayment";
		if (tab === "Processing")
			return (
				order.status === "Processing" ||
				order.status === "AwaitingConfirmation"
			);
		if (tab === "Shipping")
			return (
				order.status === "Shipping" || order.status === "PackageReady"
			);
		if (tab === "Delivered")
			return order.status === "Delivered" || order.status === "Completed";
		if (tab === "Cancelled") return order.status === "Cancelled";
		return true;
	};

	const filteredOrders =
		customerOrders?.filter((order: any) => {
			const inTab = matchesTab(order, orderTab);
			if (!inTab) return false;

			if (!searchQuery.trim()) return true;
			const query = searchQuery.toLowerCase();
			return (
				order.id.toLowerCase().includes(query) ||
				order.shopName.toLowerCase().includes(query) ||
				order.orderItems?.some((item: any) =>
					item.productName.toLowerCase().includes(query),
				)
			);
		}) || [];

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
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Đơn hàng của tôi
				</h2>
				<p className="text-xs text-brand-muted">
					Theo dõi và kiểm tra lịch sử tất cả các đơn hàng bạn đã mua
					trên Buu Store.
				</p>
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
			<div className="relative flex items-center w-full bg-brand-light-soft rounded-xl p-2">
				<Search className="w-4 h-4 text-brand-muted ml-2 shrink-0" />
				<input
					type="text"
					placeholder="Tìm đơn hàng theo Mã đơn hàng, Nhà bán hoặc Tên sản phẩm..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full bg-transparent px-3 text-xs focus:outline-none border-none text-brand-dark h-8 placeholder:text-brand-muted"
				/>
				<button className="px-4 py-1.5 bg-white border border-brand-border text-brand-dark hover:bg-brand-light-soft rounded-lg text-xs font-bold shrink-0 shadow-sm transition-all">
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
					<div className="text-center py-16 border border-dashed border-brand-border rounded-2xl text-brand-muted font-medium text-xs">
						Chưa có đơn hàng nào trong mục này.
					</div>
				) : (
					filteredOrders.map((order: any) => (
						<div
							key={order.id}
							className="border border-brand-border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all text-left"
						>
							{/* Shop header and status */}
							<div className="flex justify-between items-center bg-brand-light-soft/50 border-b border-brand-border px-4 py-3">
								<div className="flex items-center gap-2">
									<span className="font-extrabold text-brand-dark text-xs uppercase tracking-wider">
										{order.shopName || "Cửa hàng"}
									</span>
									<span className="text-[10px] text-brand-muted font-bold">
										Mã đơn: #{order.id.split("-")[0]}
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
											{displayItems.map(
												(item: any, idx: number) => (
													<div
														key={idx}
														className="flex gap-3"
													>
														<img
															src={
																item.thumbnailUrl ||
																"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"
															}
															alt={
																item.productName
															}
															className="w-14 h-14 object-cover rounded-xl border border-brand-border shrink-0"
														/>
														<div className="flex-1 min-w-0">
															<h4 className="font-extrabold text-brand-dark text-xs truncate">
																{
																	item.productName
																}
															</h4>
															{item.variantName && (
																<p className="text-[10px] font-bold text-brand-muted mt-0.5">
																	Phân loại:{" "}
																	{
																		item.variantName
																	}
																</p>
															)}
															<p className="text-[10px] text-brand-muted font-medium mt-0.5">
																Số lượng: x
																{item.quantity}
															</p>
														</div>
														<div className="text-right shrink-0">
															<span className="font-extrabold text-brand-dark text-xs">
																{item.unitPrice.toLocaleString(
																	"vi-VN",
																)}
																đ
															</span>
														</div>
													</div>
												),
											)}

											{items.length > 2 && (
												<div className="flex justify-start pt-1">
													<button
														type="button"
														onClick={() =>
															setShowAllItems(
																(prev) => ({
																	...prev,
																	[order.id]:
																		!isExpanded,
																}),
															)
														}
														className="text-[10px] font-extrabold text-brand-muted hover:text-brand-primary border border-brand-border/60 rounded px-2.5 py-1 bg-white hover:bg-brand-light-soft transition-all cursor-pointer shadow-sm"
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
										{order.grandTotal.toLocaleString(
											"vi-VN",
										)}
										đ
									</span>
								</div>
								<div className="flex gap-2 w-full sm:w-auto">
									<button
										onClick={handleReorder}
										className="flex-1 sm:flex-none px-4 py-1.5 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark rounded-xl text-xs font-black transition-all cursor-pointer"
									>
										Mua lại
									</button>
									<button
										onClick={() =>
											setDetailSubOrderId(order.id)
										}
										className="flex-1 sm:flex-none px-4 py-1.5 border border-brand-border bg-white hover:bg-brand-light-soft text-brand-dark rounded-xl text-xs font-black transition-all cursor-pointer text-center"
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
