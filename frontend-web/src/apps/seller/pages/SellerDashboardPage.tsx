import {
	ShoppingBag,
	Package,
	DollarSign,
	Users,
	TrendingUp,
	BarChart3,
	Award,
} from "lucide-react";
import { useState } from "react";
import { Routes, Route, Link, useParams, Navigate } from "react-router-dom";
import {
	useSellerStore,
	useSellerProfileQuery,
	useSellerOverviewQuery,
	useSellerRevenueChartQuery,
	useSellerTopProductsQuery,
} from "@/domains/seller";
import { EditProductPage, ProductsView } from "@/domains/catalog";
import { ShopSettingsPage } from "./ShopSettingsPage";
import RevenueView from "../components/RevenueView";
import SellerReviewsView from "../components/SellerReviewsView";
import SellerFollowersView from "../components/SellerFollowersView";
import { CouponsView, OrdersView, RefundRequestsView } from "@/domains/order";


// View: Tổng quan Dashboard
function Overview() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();
	const resolvedShop =
		activeShop ??
		profile?.shops?.find((shop: any) => String(shop.id) === shopId) ??
		profile?.shops?.[0] ??
		null;

	const [period, setPeriod] = useState<"7d" | "30d">("7d");
	const { data: overview, isLoading: isOverviewLoading } = useSellerOverviewQuery(resolvedShop?.id);
	const { data: chartData } = useSellerRevenueChartQuery(resolvedShop?.id, period);
	const { data: topProducts } = useSellerTopProductsQuery(resolvedShop?.id, 5);

	const maxRevenue = Math.max(...(chartData?.map((p) => p.revenue) || [1]));

	return (
		<div className="space-y-6 text-left font-sans">
			<div>
				<h1 className="text-xl font-bold text-brand-dark mb-1">
					Chào mừng quay trở lại, {resolvedShop?.name || "Người Bán"}!
				</h1>
				<p className="text-xs text-brand-muted">
					Dưới đây là hiệu suất và thống kê bán hàng của shop hôm nay.
				</p>
			</div>

			{/* Grid thẻ thông số KPI */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3 shadow-2xs">
					<div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
						<DollarSign className="w-5 h-5 text-brand-primary-deep" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Doanh thu ngày
						</span>
						<span className="text-sm font-bold text-brand-dark">
							{isOverviewLoading ? "..." : `${(overview?.todayRevenue || 0).toLocaleString("vi-VN")}đ`}
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3 shadow-2xs">
					<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
						<ShoppingBag className="w-5 h-5 text-blue-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Đơn hàng mới
						</span>
						<span className="text-sm font-bold text-brand-dark">
							{isOverviewLoading ? "..." : `${overview?.todayOrders || 0} đơn hàng`}
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3 shadow-2xs">
					<div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
						<Package className="w-5 h-5 text-purple-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Sản phẩm hoạt động
						</span>
						<span className="text-sm font-bold text-brand-dark">
							{isOverviewLoading ? "..." : `${overview?.totalProducts || 0} sản phẩm`}
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3 shadow-2xs">
					<div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
						<Users className="w-5 h-5 text-amber-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Người theo dõi
						</span>
						<span className="text-sm font-bold text-brand-dark">
							{isOverviewLoading ? "..." : `${(overview?.totalFollowers || 0).toLocaleString("vi-VN")} người`}
						</span>
					</div>
				</div>
			</div>

			{/* Biểu đồ doanh thu theo thời gian */}
			<div className="bg-white border border-brand-border rounded-xl p-5 shadow-2xs space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
					<div className="flex items-center gap-2">
						<BarChart3 className="w-4 h-4 text-brand-primary-deep" />
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
							Biểu đồ doanh thu
						</h3>
					</div>
					<div className="flex gap-1.5">
						<button
							type="button"
							onClick={() => setPeriod("7d")}
							className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${period === "7d"
								? "bg-brand-dark text-white border-brand-dark shadow-2xs"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
								}`}
						>
							7 ngày qua
						</button>
						<button
							type="button"
							onClick={() => setPeriod("30d")}
							className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${period === "30d"
								? "bg-brand-dark text-white border-brand-dark shadow-2xs"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
								}`}
						>
							30 ngày qua
						</button>
					</div>
				</div>

				{chartData && chartData.length > 0 ? (
					<div className="h-48 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-100">
						{chartData.map((item, idx) => {
							const heightPercent = Math.max((item.revenue / maxRevenue) * 100, 8);
							return (
								<div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 h-full justify-end group relative">
									<span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
										{item.revenue.toLocaleString("vi-VN")}đ ({item.orderCount} đơn)
									</span>
									<div
										style={{ height: `${heightPercent}%` }}
										className="w-full bg-brand-primary/80 hover:bg-brand-primary-deep rounded-t-md transition-all duration-300"
									/>
									<span className="text-[9px] font-bold text-brand-muted truncate w-full text-center">
										{item.date.slice(5)}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<div className="py-12 text-center text-xs text-brand-muted font-medium">
						Chưa có dữ liệu biểu đồ trong khoảng thời gian này.
					</div>
				)}
			</div>

			{/* Top sản phẩm bán chạy & Thao tác nhanh */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Top sản phẩm bán chạy */}
				<div className="border border-brand-border bg-white rounded-xl p-5 shadow-2xs space-y-3">
					<div className="flex items-center gap-2 border-b border-brand-border/60 pb-2.5">
						<Award className="w-4 h-4 text-amber-500" />
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
							Top sản phẩm bán chạy
						</h3>
					</div>
					{topProducts && topProducts.length > 0 ? (
						<div className="divide-y divide-slate-100">
							{topProducts.map((p, idx) => (
								<div key={p.productId} className="py-2 flex items-center justify-between gap-3 text-xs">
									<div className="flex items-center gap-2.5 truncate">
										<span className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" :
											idx === 1 ? "bg-slate-200 text-slate-700" :
												idx === 2 ? "bg-orange-100 text-orange-700" :
													"bg-slate-100 text-slate-500"
											}`}>
											{idx + 1}
										</span>
										<span className="font-bold text-brand-dark truncate">{p.name}</span>
									</div>
									<div className="text-right shrink-0">
										<span className="font-extrabold text-brand-primary-deep block">
											{p.revenue.toLocaleString("vi-VN")}đ
										</span>
										<span className="text-[10px] text-brand-muted">Đã bán {p.soldQuantity}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-xs text-brand-muted py-6 text-center">Chưa có dữ liệu top sản phẩm.</p>
					)}
				</div>

				{/* Hướng dẫn thao tác */}
				<div className="border border-brand-border bg-white rounded-xl p-5 shadow-2xs space-y-3">
					<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2.5">
						Các mục thao tác nhanh
					</h3>
					<div className="grid grid-cols-2 gap-3">
						<Link
							to="products/list"
							className="p-3 border border-brand-border hover:border-brand-primary rounded-lg text-center text-xs font-bold text-brand-dark hover:bg-brand-primary/5 transition-colors"
						>
							Danh sách sản phẩm
						</Link>
						<Link
							to="orders"
							className="p-3 border border-brand-border hover:border-brand-primary rounded-lg text-center text-xs font-bold text-brand-dark hover:bg-brand-primary/5 transition-colors"
						>
							Quản lý đơn hàng
						</Link>
						<Link
							to="/chat"
							className="p-3 border border-brand-border hover:border-brand-primary rounded-lg text-center text-xs font-bold text-brand-dark hover:bg-brand-primary/5 transition-colors col-span-2"
						>
							💬 Trung tâm Trò chuyện Khách hàng
						</Link>
					</div>
				</div>
			</div>

			{/* Trạng thái vận hành */}
			<div className="border border-brand-border bg-white rounded-xl p-5 text-xs text-brand-muted space-y-3 leading-relaxed shadow-2xs">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2.5">
					Đánh giá chung hiệu suất
				</h3>
				<p>
					Tỷ lệ phản hồi chat:{" "}
					<strong className="text-brand-dark">98%</strong> (Rất tốt)
				</p>
				<p>
					Thời gian chuẩn bị hàng:{" "}
					<strong className="text-brand-dark">0.8 ngày</strong> (Nhanh)
				</p>
				<p>
					Tỷ lệ đơn hàng không thành công:{" "}
					<strong className="text-brand-dark">1.2%</strong> (Đạt tiêu chuẩn)
				</p>
			</div>
		</div>
	);
}

// Placeholder cho các trang khác
function PlaceholderView({ title }: { title: string }) {
	return (
		<div className="py-12 text-center text-brand-muted space-y-3">
			<h3 className="text-sm font-bold text-brand-dark">{title}</h3>
			<p className="text-xs">
				Trang chức năng này đang được thiết lập và chuẩn bị hiển thị.
			</p>
		</div>
	);
}

export default function SellerDashboardPage() {
	return (
		<Routes>
			<Route index element={<RevenueView />} />
			<Route path="products/list" element={<ProductsView />} />
			<Route
				path="products/edit/:productId"
				element={<EditProductPage />}
			/>
			<Route
				path="products/category"
				element={<PlaceholderView title="Quản lý Danh mục sản phẩm" />}
			/>
			<Route
				path="products/bulk"
				element={
					<PlaceholderView title="Quản lý Hàng loạt (Import/Export)" />
				}
			/>
			<Route path="orders" element={<OrdersView />} />
			<Route path="chat" element={<Navigate to="/chat?seller=true" replace />} />
			<Route
				path="refunds"
				element={<RefundRequestsView />}
			/>
			<Route
				path="coupons"
				element={<CouponsView />}
			/>
			<Route
				path="reviews"
				element={<SellerReviewsView />}
			/>
			<Route
				path="followers"
				element={<SellerFollowersView />}
			/>
			<Route
				path="balance"
				element={<RevenueView />}
			/>
			<Route
				path="transactions"
				element={<RevenueView />}
			/>
			<Route
				path="withdrawals"
				element={<RevenueView />}
			/>
			<Route
				path="revenue"
				element={<RevenueView />}
			/>
			<Route path="settings" element={<ShopSettingsPage />} />
			<Route path="*" element={<RevenueView />} />
		</Routes>
	);
}
