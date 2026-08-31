import React, { useState } from "react";
import {
	RefreshCw,
	Eye,
	EyeOff,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { getOrderStatusBadge, useAdminSubOrdersQuery } from "@/domains/order";
import { Pagination } from "@/shared/components/Pagination";
import { SubOrderDetailView } from "@/domains/order/components/sellerOrder/SubOrderDetailView";

export function AdminOrdersView() {
	const PAGE_SIZE = 10;
	const [currentPage, setCurrentPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");

	// Load list of sub-orders with backend pagination and status filtering
	const {
		data: subOrdersPaged,
		isLoading,
		refetch,
		isFetching,
	} = useAdminSubOrdersQuery({
		pageNumber: currentPage,
		pageSize: PAGE_SIZE,
		status: statusFilter === "All" ? undefined : statusFilter,
		searchKeyword: searchQuery,
	});

	// State for expanded order details
	const [expandedOrders, setExpandedOrders] = useState<
		Record<string | number, boolean>
	>({});

	// Toggle detail expand
	const toggleExpand = (orderId: number) => {
		setExpandedOrders((prev) => ({
			...prev,
			[orderId]: !prev[orderId],
		}));
	};

	// Helper to format order status badge
	const getStatusBadge = (status: string) => getOrderStatusBadge(status);

	const items = subOrdersPaged?.items || [];
	const totalCount = subOrdersPaged?.totalCount || items.length || 0;
	const totalPages = subOrdersPaged?.totalPages || Math.ceil(totalCount / PAGE_SIZE) || 1;

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách đơn hàng toàn sàn...
			</div>
		);
	}

	return (
		<div className="space-y-4 text-left font-sans">
			{/* Header */}
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Quản lý Đơn hàng Toàn Sàn
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Xem, kiểm tra và quản lý tiến độ xử lý tất cả các đơn hàng con trên toàn hệ thống
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => refetch()}
						disabled={isFetching}
						className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
						/>
						Làm mới
					</button>
				</div>
			</div>

			{/* Bộ lọc đơn giản - y hệt Seller OrdersView */}
			<div className="flex flex-wrap gap-2.5 p-3.5 bg-brand-light-soft border border-brand-border rounded-md">
				<input
					type="text"
					placeholder="Tìm kiếm theo Mã đơn con, Mã Shop, Mã Khách hàng..."
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value);
						setCurrentPage(1);
					}}
					className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary min-w-60"
				/>
				<select
					value={statusFilter}
					onChange={(e) => {
						setStatusFilter(e.target.value);
						setCurrentPage(1); // Reset page on filter change
					}}
					className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary cursor-pointer"
				>
					<option value="All">Mọi trạng thái</option>
					<option value="AwaitingPayment">Chờ thanh toán</option>
					<option value="AwaitingConfirmation">Chờ xác nhận</option>
					<option value="Processing">Đang xử lý</option>
					<option value="PackageReady">Chờ shipper</option>
					<option value="Shipping">Đang vận chuyển</option>
					<option value="Delivered">Đã giao hàng</option>
					<option value="Completed">Đã hoàn thành</option>
					<option value="Cancelled">Đã hủy</option>
				</select>
			</div>

			{/* Bảng đơn hàng - y hệt Seller OrdersView */}
			<div className="border border-brand-border rounded-md overflow-hidden bg-white shadow-sm">
				<table className="w-full text-xs text-left">
					<thead className="bg-brand-light-soft border-b border-brand-border text-brand-dark font-bold">
						<tr>
							<th className="p-3">Mã Đơn hàng con</th>
							<th className="p-3">Ngày đặt</th>
							<th className="p-3">Khách & Cửa hàng</th>
							<th className="p-3">Tổng tiền</th>
							<th className="p-3">Trạng thái</th>
							<th className="p-3 text-right">Hành động</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-border">
						{items.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="p-8 text-center text-brand-muted"
								>
									Không tìm thấy đơn hàng nào.
								</td>
							</tr>
						) : (
							items.map((order: any) => {
								const isExpanded = !!expandedOrders[order.id];
								return (
									<React.Fragment key={order.id}>
										<tr
											className={`hover:bg-brand-light-soft/20 ${isExpanded ? "bg-brand-light-soft/10" : ""}`}
										>
											<td
												className="p-3 font-bold text-brand-dark truncate max-w-40"
												title={order.id}
											>
												#{String(order.id).split("-")[0].toUpperCase()}
											</td>
											<td className="p-3 text-brand-muted">
												{new Date(
													order.createdDate || order.orderDate || Date.now(),
												).toLocaleString("vi-VN")}
											</td>
											<td className="p-3 text-brand-dark font-semibold">
												<div>Shop #{order.shopId || 1}</div>
												<div className="text-[10px] text-brand-muted">
													User #{order.customerId || 1}
												</div>
											</td>
											<td className="p-3 font-extrabold text-brand-dark">
												{Number(order.grandTotal || 0).toLocaleString("vi-VN")}đ
											</td>
											<td className="p-3">
												{getStatusBadge(order.status)}
											</td>
											<td className="p-3 text-right">
												<div className="flex justify-end items-center gap-1.5">
													{/* Details toggle button */}
													<button
														onClick={() => toggleExpand(order.id)}
														className="px-2 py-1 border border-brand-border hover:bg-brand-light-soft rounded-md text-brand-primary transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-white"
														title="Xem chi tiết"
													>
														{isExpanded ? (
															<>
																<EyeOff className="w-3.5 h-3.5" />
																Ẩn chi tiết
															</>
														) : (
															<>
																<Eye className="w-3.5 h-3.5" />
																Chi tiết
															</>
														)}
													</button>
												</div>
											</td>
										</tr>

										{/* Expandable Invoice details row */}
										{isExpanded && (
											<tr>
												<td
													colSpan={6}
													className="p-4 bg-brand-light-soft/5"
												>
													<SubOrderDetailView
														subOrderId={order.id}
														isSeller={false}
													/>
												</td>
											</tr>
										)}
									</React.Fragment>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls - y hệt Seller OrdersView */}
			{totalPages > 1 && (
				<div className="flex justify-between items-center pt-2 text-xs">
					<span className="text-brand-muted font-bold">
						Tổng cộng: {totalCount} đơn hàng ({totalPages} trang)
					</span>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				</div>
			)}
		</div>
	);
}
