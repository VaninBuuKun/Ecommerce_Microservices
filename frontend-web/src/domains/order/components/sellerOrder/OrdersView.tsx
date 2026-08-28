import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
	RefreshCw,
	Check,
	X,
	Eye,
	EyeOff,
	Package,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSellerStore, useSellerProfileQuery } from "@/domains/seller";
import { SubOrderDetailView } from "./SubOrderDetailView";
import { CancelOrderModal } from "./CancelOrderModal";
import { PackageReadyModal } from "./PackageReadyModal";
import { getOrderStatusBadge } from "../VoucherHelpers";
import { useConfirmSubOrderMutation, usePackageReadySubOrderMutation, useRejectSubOrderMutation, useShopSubOrdersQuery } from "../../hooks/useOrders";

export function OrdersView() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();

	const resolvedShop =
		activeShop ??
		profile?.shops?.find((shop: any) => String(shop.id) === shopId) ??
		profile?.shops?.[0] ??
		null;

	const PAGE_SIZE = 5;
	const [currentPage, setCurrentPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");

	// Load list of sub-orders with backend pagination and status filtering
	const {
		data: subOrdersPaged,
		isLoading,
		refetch,
		isFetching,
	} = useShopSubOrdersQuery(
		resolvedShop?.id ? Number(resolvedShop.id) : undefined,
		currentPage,
		PAGE_SIZE,
		statusFilter === "All" ? undefined : statusFilter,
	);

	const confirmSubOrderMutation = useConfirmSubOrderMutation();
	const rejectSubOrderMutation = useRejectSubOrderMutation();
	const packageReadyMutation = usePackageReadySubOrderMutation();

	// State for expanded order details
	const [expandedOrders, setExpandedOrders] = useState<
		Record<string | number, boolean>
	>({});

	// State for cancel modal
	const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(
		null,
	);
	const [cancelReason, setCancelReason] = useState("");

	// State for package ready modal
	const [packingOrderId, setPackingOrderId] = useState<number | null>(null);
	const [weight, setWeight] = useState(500); // grams
	const [length, setLength] = useState(10); // cm
	const [width, setWidth] = useState(10); // cm
	const [height, setHeight] = useState(10); // cm

	// Toggle detail expand
	const toggleExpand = (orderId: number) => {
		setExpandedOrders((prev) => ({
			...prev,
			[orderId]: !prev[orderId],
		}));
	};

	const handleConfirm = async (id: number) => {
		try {
			await confirmSubOrderMutation.mutateAsync(id);
			toast.success("Xác nhận đơn hàng thành công!");
			refetch();
		} catch (err: any) {
			toast.error(err?.response?.data || "Lỗi khi xác nhận đơn hàng");
		}
	};

	const handleRejectSubmit = async () => {
		if (!cancelingOrderId) return;
		if (!cancelReason.trim()) {
			toast.error("Vui lòng nhập lý do hủy đơn hàng.");
			return;
		}

		try {
			await rejectSubOrderMutation.mutateAsync({
				subOrderId: cancelingOrderId,
				reason: cancelReason.trim(),
			});
			toast.success("Đã hủy đơn hàng thành công!");
			setCancelingOrderId(null);
			setCancelReason("");
			refetch();
		} catch (err: any) {
			toast.error(err?.response?.data || "Lỗi khi từ chối đơn hàng");
		}
	};

	const handlePackageReadySubmit = async () => {
		if (!packingOrderId) return;

		try {
			await packageReadyMutation.mutateAsync({
				subOrderId: packingOrderId,
				dimensions: { weight, length, width, height },
			});
			toast.success("Đã cập nhật trạng thái chuẩn bị hàng xong!");
			setPackingOrderId(null);
			refetch();
		} catch (err: any) {
			toast.error(
				err?.response?.data || "Lỗi khi cập nhật chuẩn bị hàng",
			);
		}
	};

	// Helper to format order status badge
	const getStatusBadge = (status: string) => getOrderStatusBadge(status);

	// Client-side search query match within the returned backend page
	const backendItems = subOrdersPaged?.items || [];
	const filteredOrders = backendItems.filter((order: any) => {
		if (!searchQuery.trim()) return true;
		return (
			String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
			(order.shippingAddress &&
				order.shippingAddress
					.toLowerCase()
					.includes(searchQuery.toLowerCase()))
		);
	});

	const totalPages = subOrdersPaged?.totalPages || 1;

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải danh sách đơn hàng...
			</div>
		);
	}

	return (
		<div className="space-y-4 text-left font-sans">
			<div className="flex justify-between items-center pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Quản lý Đơn hàng ({resolvedShop?.name})
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem, xác nhận và chuẩn bị hàng cho các đơn hàng nhận
						được từ người mua (Phân trang phía Server).
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => {
							refetch();
						}}
						disabled={isFetching}
						className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
						/>
						Làm mới
					</button>
				</div>
			</div>

			{/* Bộ lọc đơn giản */}
			<div className="flex flex-wrap gap-2.5 p-3.5 bg-brand-light-soft border border-brand-border rounded-xl">
				<input
					type="text"
					placeholder="Tìm nhanh trên trang này theo Mã đơn hàng..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="h-8 px-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary min-w-60"
				/>
				<select
					value={statusFilter}
					onChange={(e) => {
						setStatusFilter(e.target.value);
						setCurrentPage(1); // Reset page on filter change
					}}
					className="h-8 px-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary cursor-pointer"
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

			{/* Bảng đơn hàng */}
			<div className="border border-brand-border rounded-xl overflow-hidden bg-white shadow-sm">
				<table className="w-full text-xs text-left">
					<thead className="bg-brand-light-soft border-b border-brand-border text-brand-dark font-bold">
						<tr>
							<th className="p-3">Mã Đơn hàng con</th>
							<th className="p-3">Ngày đặt</th>
							<th className="p-3">Khách hàng</th>
							<th className="p-3">Tổng tiền</th>
							<th className="p-3">Trạng thái</th>
							<th className="p-3 text-right">Hành động</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-border">
						{filteredOrders.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="p-8 text-center text-brand-muted"
								>
									Không tìm thấy đơn hàng nào.
								</td>
							</tr>
						) : (
							filteredOrders.map((order: any) => {
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
												#{String(order.id).split("-")[0]}
											</td>
											<td className="p-3 text-brand-muted">
												{new Date(
													order.orderDate,
												).toLocaleString("vi-VN")}
											</td>
											<td className="p-3 text-brand-dark font-semibold">
												#{order.customerId}
											</td>
											<td className="p-3 font-extrabold text-brand-dark">
												{order.grandTotal.toLocaleString(
													"vi-VN",
												)}
												đ
											</td>
											<td className="p-3">
												{getStatusBadge(order.status)}
											</td>
											<td className="p-3 text-right">
												<div className="flex justify-end items-center gap-1.5">
													{order.status ===
														"AwaitingConfirmation" && (
															<>
																<button
																	onClick={() =>
																		handleConfirm(
																			order.id,
																		)
																	}
																	className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[10px] font-bold"
																	title="Xác nhận"
																>
																	<Check className="w-3.5 h-3.5" />
																	Xác nhận
																</button>
																<button
																	onClick={() =>
																		setCancelingOrderId(
																			order.id,
																		)
																	}
																	className="p-1 text-red-600 hover:bg-red-50 border border-red-200 rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[10px] font-bold"
																	title="Hủy đơn"
																>
																	<X className="w-3.5 h-3.5" />
																	Hủy đơn
																</button>
															</>
														)}
													{order.status ===
														"Processing" && (
															<button
																onClick={() =>
																	setPackingOrderId(
																		order.id,
																	)
																}
																className="px-2 py-1 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded cursor-pointer transition-all inline-flex items-center gap-1 text-[10px] font-bold"
															>
																<Package className="w-3.5 h-3.5" />
																Đóng gói xong
															</button>
														)}

													{/* Details toggle button */}
													<button
														onClick={() =>
															toggleExpand(
																order.id,
															)
														}
														className="px-2 py-1 border border-brand-border hover:bg-brand-light-soft rounded-lg text-brand-primary transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-white"
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
														isSeller={true}
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

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex justify-between items-center pt-2 text-xs">
					<span className="text-brand-muted font-bold">
						Hiển thị trang {currentPage} trên tổng số {totalPages}{" "}
						trang (Tổng số đơn: {subOrdersPaged?.totalCount || 0})
					</span>
					<div className="flex gap-2">
						<button
							onClick={() =>
								setCurrentPage((p) => Math.max(p - 1, 1))
							}
							disabled={currentPage === 1}
							className="h-8 w-8 flex items-center justify-center border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							<ChevronLeft className="w-4 h-4 text-brand-dark" />
						</button>
						<button
							onClick={() =>
								setCurrentPage((p) =>
									Math.min(p + 1, totalPages),
								)
							}
							disabled={currentPage === totalPages}
							className="h-8 w-8 flex items-center justify-center border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							<ChevronRight className="w-4 h-4 text-brand-dark" />
						</button>
					</div>
				</div>
			)}

			{/* Modal Hủy Đơn */}
			<CancelOrderModal
				isOpen={Boolean(cancelingOrderId)}
				onClose={() => {
					setCancelingOrderId(null);
					setCancelReason("");
				}}
				onSubmit={handleRejectSubmit}
				cancelReason={cancelReason}
				setCancelReason={setCancelReason}
				isPending={rejectSubOrderMutation.isPending}
			/>

			{/* Modal Đóng Gói (Chuẩn Bị Hàng Xong) */}
			<PackageReadyModal
				isOpen={Boolean(packingOrderId)}
				onClose={() => setPackingOrderId(null)}
				onSubmit={handlePackageReadySubmit}
				weight={weight}
				setWeight={setWeight}
				length={length}
				setLength={setLength}
				width={width}
				setWidth={setWidth}
				height={height}
				setHeight={setHeight}
				isPending={packageReadyMutation.isPending}
			/>
		</div>
	);
}
