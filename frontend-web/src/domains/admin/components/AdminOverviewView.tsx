import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Users,
	DollarSign,
	ShoppingBag,
	Store,
	TrendingUp,
	ShieldAlert,
	Package,
	Wallet,
} from "lucide-react";
import {
	useAdminOverviewQuery,
	useAdminUserCountQuery,
} from "../hooks/useAdminAnalytics";
import { ShopAnalyticsDashboard } from "@/domains/seller";

// Danh sách các shop mẫu để Admin có thể xem thống kê riêng từng shop
const ADMIN_SHOPS_LIST = [
	{ id: 1, name: "Shop Bàn Phím Cơ Pro" },
	{ id: 2, name: "Shop Phụ Kiện Gaming Gear" },
	{ id: 3, name: "Shop Setup Công Thái Học" },
];

export function AdminOverviewView() {
	const [selectedAdminShopId, setSelectedAdminShopId] = useState<string | number | null>(null);

	const { data: overview, isLoading: isOverviewLoading } = useAdminOverviewQuery();
	const { data: userCount, isLoading: isUserCountLoading } = useAdminUserCountQuery();

	const currentShopName = selectedAdminShopId
		? ADMIN_SHOPS_LIST.find((s) => String(s.id) === String(selectedAdminShopId))?.name || `Shop #${selectedAdminShopId}`
		: "Toàn Sàn";

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-4 font-black text-brand-dark uppercase tracking-wider">
						Tổng quan & Thống kê hệ thống
					</h1>
					<p className="text-[12px] text-brand-muted font-bold mt-0.5">
						Theo dõi hiệu suất vận hành toàn sàn, doanh thu và tăng trưởng người dùng thời gian thực
					</p>
				</div>
				<span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-md flex items-center gap-1.5 shadow-2xs">
					<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
					Hệ thống trực tuyến
				</span>
			</div>

			{/* 4 KPI Cards Nền Tảng (rounded-md) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 1. Tổng Người Dùng (Từ Identity.Api) */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Người Dùng
						</span>
						<div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
							<Users className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isUserCountLoading ? "..." : (userCount || 0).toLocaleString("vi-VN")}
					</div>
					<p className="text-[10px] text-blue-600 font-bold">
						Đo trực tiếp từ Identity.Api
					</p>
				</div>

				{/* 2. Doanh Thu Sàn */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Doanh Thu Toàn Sàn
						</span>
						<div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
							<DollarSign className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isOverviewLoading ? "..." : `${((overview?.platformRevenue || 0) / 1000000).toFixed(1)}M đ`}
					</div>
					<p className="text-[10px] text-emerald-600 font-bold">
						Tích lũy từ tất cả đơn thành công
					</p>
				</div>

				{/* 3. Tổng Đơn Hàng */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Đơn Hàng
						</span>
						<div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
							<ShoppingBag className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isOverviewLoading ? "..." : (overview?.totalOrders || 0).toLocaleString("vi-VN")} đơn
					</div>
					<p className="text-[10px] text-brand-muted font-bold">
						Hôm nay: +{overview?.todayNewOrders || 0} đơn mới
					</p>
				</div>

				{/* 4. Tổng Số Shop */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Cửa Hàng
						</span>
						<div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
							<Store className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isOverviewLoading ? "..." : (overview?.totalShops || 0).toLocaleString("vi-VN")} shop
					</div>
					<p className="text-[10px] text-purple-600 font-bold">
						Người bán đang hoạt động
					</p>
				</div>
			</div>

			{/* BỘ BIỂU ĐỒ THỐNG KÊ THỐNG NHẤT (Có thể xem Toàn Sàn hoặc chọn xem từng Shop) */}
			<ShopAnalyticsDashboard
				shopId={selectedAdminShopId}
				shopName={currentShopName}
				isAdminView={true}
				availableShops={ADMIN_SHOPS_LIST}
				onSelectShop={(id) => setSelectedAdminShopId(id)}
			/>

			{/* Lối Tắt Quản Trị Hệ Thống (rounded-md) */}
			<div className="border border-brand-border bg-white rounded-md p-4 shadow-xs space-y-3">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2">
					Lối Tắt Quản Trị Hệ Thống Nhanh
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<Link
						to="/admin/kyc"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-amber-50 text-amber-600 rounded-md group-hover:scale-105 transition-transform">
							<ShieldAlert className="w-4 h-4" />
						</div>
						<div className="text-left">
							<span className="text-xs font-black text-brand-dark block">Duyệt Seller KYC</span>
							<span className="text-[10px] text-brand-muted">Hồ sơ định danh</span>
						</div>
					</Link>

					<Link
						to="/admin/products"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-blue-50 text-blue-600 rounded-md group-hover:scale-105 transition-transform">
							<Package className="w-4 h-4" />
						</div>
						<div className="text-left">
							<span className="text-xs font-black text-brand-dark block">Quản lý Sản phẩm</span>
							<span className="text-[10px] text-brand-muted">Duyệt / Ẩn sản phẩm</span>
						</div>
					</Link>

					<Link
						to="/admin/orders"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-emerald-50 text-emerald-600 rounded-md group-hover:scale-105 transition-transform">
							<ShoppingBag className="w-4 h-4" />
						</div>
						<div className="text-left">
							<span className="text-xs font-black text-brand-dark block">Quản lý Đơn hàng</span>
							<span className="text-[10px] text-brand-muted">Vận đơn & Trạng thái</span>
						</div>
					</Link>

					<Link
						to="/admin/wallets"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-purple-50 text-purple-600 rounded-md group-hover:scale-105 transition-transform">
							<Wallet className="w-4 h-4" />
						</div>
						<div className="text-left">
							<span className="text-xs font-black text-brand-dark block">Quản lý Ví Sàn</span>
							<span className="text-[10px] text-brand-muted">Số dư & Quyết toán</span>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default AdminOverviewView;
