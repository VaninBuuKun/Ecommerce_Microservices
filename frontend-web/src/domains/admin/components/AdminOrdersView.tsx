import React, { useState } from "react";
import {
	RefreshCw,
	Eye,
	Loader2,
	ShoppingBag,
	X,
	ShieldAlert,
} from "lucide-react";
import { getOrderStatusBadge, useAdminSubOrdersQuery } from "@/domains/order";
import { Pagination } from "@/shared/components/Pagination";
import { CustomerOrderDetailView } from "@/domains/order/components/CustomerOrderDetailView";

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

	// State for modal viewing full order detail
	const [detailSubOrderId, setDetailSubOrderId] = useState<number | string | null>(null);

	// Helper to format order status badge
	const getStatusBadge = (status: string) => getOrderStatusBadge(status);

	const items = subOrdersPaged?.items || [];
	const totalCount = subOrdersPaged?.totalCount || items.length || 0;
	const totalPages = subOrdersPaged?.totalPages || Math.ceil(totalCount / PAGE_SIZE) || 1;

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3 font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách đơn hàng toàn sàn...
			</div>
		);
	}

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
						<ShoppingBag className="w-4 h-4 text-brand-primary" />
						Quản lý Đơn hàng Toàn Sàn
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Xem, tra cứu chi tiết và theo dõi tiến độ xử lý tất cả các đơn hàng con trên toàn hệ thống (Chế độ quản trị)
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => refetch()}
						disabled={isFetching}
						className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
						/>
						Làm mới
					</button>
				</div>
			</div>

			{/* Filter Section */}
			<div className="flex flex-wrap gap-2.5 p-3.5 bg-brand-light-soft/50 border border-brand-border rounded-lg">
				<input
					type="text"
					placeholder="Tìm kiếm theo Mã đơn con, Mã Shop, Mã Khách hàng..."
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value);
						setCurrentPage(1);
					}}
					className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary min-w-64 font-bold text-brand-dark"
				/>
				<select
					value={statusFilter}
					onChange={(e) => {
						setStatusFilter(e.target.value);
						setCurrentPage(1);
					}}
					className="h-8 px-3 bg-white border border-brand-border rounded-md text-xs focus:outline-none focus:border-brand-primary cursor-pointer font-bold text-brand-dark"
				>
					<option value="All">Mọi trạng thái đơn hàng</option>
					<option value="AwaitingPayment">Chờ thanh toán</option>
					<option value="AwaitingConfirmation">Chờ xác nhận</option>
					<option value="Processing">Đang xử lý</option>
					<option value="PackageReady">Chờ shipper lấy hàng</option>
					<option value="Shipping">Đang vận chuyển</option>
					<option value="Delivered">Đã giao hàng</option>
					<option value="Completed">Đã hoàn thành</option>
					<option value="Cancelled">Đã hủy</option>
				</select>
			</div>

			{/* Orders Table */}
			<div className="border border-brand-border rounded-lg overflow-hidden bg-white shadow-2xs">
				<div className="overflow-x-auto">
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/60 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="py-3 px-3.5">Mã Đơn hàng con</th>
								<th className="py-3 px-3.5">Ngày đặt</th>
								<th className="py-3 px-3.5">Khách & Cửa hàng</th>
								<th className="py-3 px-3.5">Tổng thanh toán</th>
								<th className="py-3 px-3.5 text-center">Trạng thái</th>
								<th className="py-3 px-3.5 text-right">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border/60">
							{items.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="p-10 text-center text-brand-muted font-bold text-xs"
									>
										Không tìm thấy đơn hàng nào phù hợp.
									</td>
								</tr>
							) : (
								items.map((order: any) => {
									return (
										<tr
											key={order.id}
											className="hover:bg-brand-light-soft/20 transition-colors"
										>
											<td
												className="py-3 px-3.5 font-mono font-bold text-brand-dark truncate max-w-40"
												title={order.id}
											>
												#{String(order.id).split("-")[0].toUpperCase()}
											</td>
											<td className="py-3 px-3.5 text-brand-muted font-medium">
												{new Date(
													order.createdDate || order.orderDate || Date.now(),
												).toLocaleString("vi-VN")}
											</td>
											<td className="py-3 px-3.5 text-brand-dark font-semibold">
												<div>Shop #{order.shopId || 1}</div>
												<div className="text-[10px] text-brand-muted font-normal">
													User #{order.customerId || 1}
												</div>
											</td>
											<td className="py-3 px-3.5 font-black text-brand-dark">
												{Number(order.grandTotal || 0).toLocaleString("vi-VN")}đ
											</td>
											<td className="py-3 px-3.5 text-center">
												{getStatusBadge(order.status)}
											</td>
											<td className="py-3 px-3.5 text-right">
												<button
													onClick={() => setDetailSubOrderId(order.id)}
													className="px-2.5 py-1.5 border border-brand-border hover:bg-brand-light-soft hover:border-brand-primary rounded-md text-brand-primary transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold bg-white shadow-2xs"
													title="Xem chi tiết đầy đủ đơn hàng"
												>
													<Eye className="w-3.5 h-3.5" />
													<span>Chi tiết</span>
												</button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				<div className="px-4 py-2.5 border-t border-brand-border bg-brand-light-soft/20 text-xs">
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalCount={totalCount}
						pageSize={PAGE_SIZE}
						onPageChange={setCurrentPage}
						showQuickJumper
						showTotal
					/>
				</div>
			</div>

			{/* Fullscreen Modal View for Order Details (Admin Read-Only) */}
			{detailSubOrderId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
					<div className="relative bg-white rounded-xl border border-brand-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 text-left">
						{/* Close button in top right */}
						<button
							onClick={() => setDetailSubOrderId(null)}
							className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors z-20 cursor-pointer border-none bg-transparent"
							title="Đóng chi tiết"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Admin Mode Badge */}
						<div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-bold">
							<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
							<span>Chế độ xem quản trị Admin (Chỉ đọc - Không có thao tác xử lý)</span>
						</div>

						{/* Full Detailed View identical to Seller/Customer with isAdmin=true */}
						<CustomerOrderDetailView
							subOrderId={detailSubOrderId as any}
							onBack={() => setDetailSubOrderId(null)}
							isSeller={true}
							isAdmin={true}
							onStatusUpdated={() => refetch()}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
