import {
	ShoppingBag,
	Package,
	DollarSign,
	Users,
	Filter,
	RefreshCw,
} from "lucide-react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import { useSellerStore } from "../stores";
import { useSellerProfileQuery } from "../hooks";
import { ProductsView, EditProductPage } from "../../catalog";
import { ShopSettingsPage } from "./ShopSettingsPage";

// View: Tổng quan Dashboard
function Overview() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();
	const resolvedShop =
		activeShop ??
		profile?.shops.find((shop) => String(shop.id) === shopId) ??
		profile?.shops[0] ??
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
						<strong className="text-brand-dark">98%</strong> (Rất
						tốt)
					</p>
					<p>
						Thời gian chuẩn bị hàng:{" "}
						<strong className="text-brand-dark">0.8 ngày</strong>{" "}
						(Nhanh)
					</p>
					<p>
						Tỷ lệ đơn hàng không thành công:{" "}
						<strong className="text-brand-dark">1.2%</strong> (Đạt
						tiêu chuẩn)
					</p>
				</div>
			</div>
		</div>
	);
}

// View: Quản lý Đơn hàng (Có giải thích bộ lọc các thứ)
function OrdersView() {
	return (
		<div className="space-y-4 text-left">
			<div className="flex justify-between items-center pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Quản lý Đơn hàng
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem, xác nhận và xử lý các đơn hàng nhận được từ người
						mua.
					</p>
				</div>
				<div className="flex gap-2">
					<button className="h-8 px-3 border border-brand-border hover:bg-brand-light-soft text-brand-dark text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer">
						<RefreshCw className="w-3.5 h-3.5" />
						Làm mới
					</button>
				</div>
			</div>

			{/* Khối giải thích các bộ lọc thông minh */}
			<div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl text-xs text-amber-900 space-y-2 leading-relaxed">
				<h4 className="font-bold flex items-center gap-2">
					<Filter className="w-4 h-4 text-amber-500" />
					Giải thích tính năng Lọc Đơn hàng:
				</h4>
				<p>
					Hệ thống hỗ trợ các loại lọc đơn hàng chuyên sâu giúp người
					bán tối ưu năng suất vận hành:
				</p>
				<ul className="list-disc pl-5 space-y-1">
					<li>
						<strong>Theo Trạng thái đơn hàng:</strong> Tất cả, Chờ
						xác nhận, Đang xử lý, Đang giao, Đã giao, Đã hủy, Trả
						hàng/Hoàn tiền.
					</li>
					<li>
						<strong>Theo Thời gian tạo đơn:</strong> Hôm nay, Hôm
						qua, 7 ngày qua, 30 ngày qua, hoặc Khoảng thời gian tùy
						chỉnh.
					</li>
					<li>
						<strong>Theo Đơn vị vận chuyển:</strong> Giao Hàng Nhanh
						(GHN), Giao Hàng Tiết Kiệm (GHTK), Viettel Post, Shopee
						Express.
					</li>
					<li>
						<strong>Theo Kênh thanh toán:</strong> Ví ShopeePay, COD
						(Thanh toán khi nhận hàng), Thẻ ATM/Visa, ví điện tử
						VNPay.
					</li>
				</ul>
			</div>

			{/* Bộ lọc Demo UI */}
			<div className="flex flex-wrap gap-2.5 p-3.5 bg-brand-light-soft border border-brand-border rounded-xl">
				<input
					type="text"
					placeholder="Mã đơn hàng, Tên người nhận..."
					className="h-8 px-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary min-w-50"
				/>
				<select className="h-8 px-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary">
					<option>Mọi trạng thái</option>
					<option>Chờ xác nhận</option>
					<option>Đang xử lý</option>
					<option>Đang vận chuyển</option>
				</select>
				<select className="h-8 px-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary">
					<option>Tất cả đơn vị vận chuyển</option>
					<option>Giao Hàng Nhanh</option>
					<option>Giao Hàng Tiết Kiệm</option>
				</select>
			</div>

			{/* Bảng danh sách đơn hàng demo */}
			<div className="border border-brand-border rounded-xl overflow-hidden">
				<table className="w-full text-xs text-left">
					<thead className="bg-brand-light-soft border-b border-brand-border text-brand-dark font-bold">
						<tr>
							<th className="p-3">Mã Đơn hàng</th>
							<th className="p-3">Ngày đặt</th>
							<th className="p-3">Khách hàng</th>
							<th className="p-3">Tổng cộng</th>
							<th className="p-3">Trạng thái</th>
							<th className="p-3">Đơn vị vận chuyển</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-border">
						<tr>
							<td className="p-3 font-bold text-brand-primary-deep">
								#129384
							</td>
							<td className="p-3 text-brand-muted">
								04/08/2026 15:30
							</td>
							<td className="p-3">Trần Anh Tuấn</td>
							<td className="p-3 font-bold">450.000đ</td>
							<td className="p-3">
								<span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-bold text-[10px]">
									Chờ xác nhận
								</span>
							</td>
							<td className="p-3">Giao Hàng Nhanh</td>
						</tr>
						<tr>
							<td className="p-3 font-bold text-brand-primary-deep">
								#129375
							</td>
							<td className="p-3 text-brand-muted">
								04/08/2026 11:15
							</td>
							<td className="p-3">Nguyễn Thị Mai</td>
							<td className="p-3 font-bold">1.040.000đ</td>
							<td className="p-3">
								<span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
									Đang xử lý
								</span>
							</td>
							<td className="p-3">Giao Hàng Tiết Kiệm</td>
						</tr>
					</tbody>
				</table>
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

export default function SellerDashboard() {
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
				element={<PlaceholderView title="Các yêu cầu hoàn tiền" />}
			/>
			<Route
				path="coupons"
				element={<PlaceholderView title="Mã giảm giá Khuyến mãi" />}
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
