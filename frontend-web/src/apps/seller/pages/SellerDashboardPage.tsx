import {
	ShoppingBag,
	Package,
	DollarSign,
	Users,
} from "lucide-react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import { useSellerStore, useSellerProfileQuery } from "@/domains/seller";
import { ProductsView, EditProductPage } from "@/domains/catalog";
import { ShopSettingsPage } from "./ShopSettingsPage";
import { OrdersView, RefundRequestsView } from "@/domains/order";
import CouponsView from "@/domains/order/components/sellerVoucher/CouponsView";

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

	return (
		<div className="space-y-6 text-left">
			<div>
				<h1 className="text-xl font-bold text-brand-dark mb-1">
					Chào mừng quay trở lại, {resolvedShop?.name}!
				</h1>
				<p className="text-xs text-brand-muted">
					Dưới đây là hiệu suất và thống kê bán hàng của shop hôm nay.
				</p>
			</div>

			{/* Grid thẻ thông số */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3">
					<div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
						<DollarSign className="w-5 h-5 text-brand-primary-deep" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Doanh thu ngày
						</span>
						<span className="text-sm font-bold text-brand-dark">
							12.500.000đ
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3">
					<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
						<ShoppingBag className="w-5 h-5 text-blue-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Đơn hàng mới
						</span>
						<span className="text-sm font-bold text-brand-dark">
							36 đơn hàng
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3">
					<div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
						<Package className="w-5 h-5 text-purple-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Sản phẩm hoạt động
						</span>
						<span className="text-sm font-bold text-brand-dark">
							142 sản phẩm
						</span>
					</div>
				</div>

				<div className="p-4 bg-brand-light-soft border border-brand-border rounded-xl flex items-center gap-3">
					<div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
						<Users className="w-5 h-5 text-amber-500" />
					</div>
					<div>
						<span className="text-[10px] text-brand-muted font-bold block uppercase tracking-wide">
							Người theo dõi
						</span>
						<span className="text-sm font-bold text-brand-dark">
							1,280 người
						</span>
					</div>
				</div>
			</div>

			{/* Grid chi tiết */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Hướng dẫn thao tác */}
				<div className="border border-brand-border rounded-xl p-5">
					<h3 className="text-xs font-bold text-brand-dark mb-3 uppercase tracking-wide">
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
					</div>
				</div>

				{/* Trạng thái vận hành */}
				<div className="border border-brand-border rounded-xl p-5 text-xs text-brand-muted space-y-3 leading-relaxed">
					<h3 className="text-xs font-bold text-brand-dark uppercase tracking-wide">
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
			<Route index element={<Overview />} />
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
			<Route
				path="refunds"
				element={<RefundRequestsView />}
			/>
			<Route
				path="coupons"
				element={<CouponsView />}
			/>
			<Route
				path="flashsale"
				element={<PlaceholderView title="Flash Sale Khuyến mãi" />}
			/>
			<Route
				path="reviews"
				element={
					<PlaceholderView title="Đánh giá sản phẩm từ Khách hàng" />
				}
			/>
			<Route
				path="qa"
				element={<PlaceholderView title="Hỏi đáp sản phẩm" />}
			/>
			<Route
				path="followers"
				element={<PlaceholderView title="Khách hàng người theo dõi" />}
			/>
			<Route
				path="balance"
				element={<PlaceholderView title="Số dư Ví Người Bán" />}
			/>
			<Route
				path="transactions"
				element={<PlaceholderView title="Lịch sử giao dịch Ví" />}
			/>
			<Route
				path="withdrawals"
				element={<PlaceholderView title="Yêu cầu rút tiền Ví" />}
			/>
			<Route
				path="revenue"
				element={<PlaceholderView title="Báo cáo Doanh thu" />}
			/>
			<Route
				path="top-products"
				element={<PlaceholderView title="Báo cáo Sản phẩm bán chạy" />}
			/>
			<Route
				path="sales-perf"
				element={<PlaceholderView title="Báo cáo Hiệu suất bán hàng" />}
			/>
			<Route
				path="customer-stats"
				element={<PlaceholderView title="Thống kê khách hàng" />}
			/>
			<Route path="settings" element={<ShopSettingsPage />} />
			<Route path="*" element={<Overview />} />
		</Routes>
	);
}
