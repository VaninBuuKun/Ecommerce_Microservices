import { useSearchParams, Link } from "react-router-dom";
import {
	Users,
	ShoppingBag,
	Store,
	TrendingUp,
	ShieldAlert,
	Package,
	Wallet,
	CreditCard,
} from "lucide-react";
import {
	useAdminOverviewQuery,
	useAdminUserCountQuery,
} from "../hooks/useAdminAnalytics";
import { useAdminShopsQuery } from "../hooks/useAdmin";
import { ShopAnalyticsDashboard } from "@/domains/seller";

export function AdminOverviewView() {
	const [searchParams, setSearchParams] = useSearchParams();
	const urlShopId = searchParams.get("shopId");
	const selectedAdminShopId = urlShopId ? urlShopId : null;

	const { data: overview, isLoading: isOverviewLoading } = useAdminOverviewQuery();
	const { data: userCount, isLoading: isUserCountLoading } = useAdminUserCountQuery();
	const { data: shopsData, isLoading: isShopsLoading } = useAdminShopsQuery({ pageSize: 100 });

	const availableShops = (shopsData?.items || []).map((s: any) => ({
		id: s.id,
		name: s.name || `Shop #${s.id}`,
	}));

	const currentShopName = selectedAdminShopId
		? availableShops.find((s) => String(s.id) === String(selectedAdminShopId))?.name || `Shop #${selectedAdminShopId}`
		: "Toàn Sàn";

	const totalShopsCount = typeof shopsData?.totalCount === "number"
		? shopsData.totalCount
		: (overview?.totalShops ?? 0);

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

			{/* Banner nếu đang lọc xem riêng theo Shop từ Shops View */}
			{selectedAdminShopId && (
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs font-bold text-brand-dark">
					<div className="flex items-center gap-2">
						<Store className="w-4 h-4 text-amber-600 shrink-0" />
						<span>
							Đang xem báo cáo phân tích riêng cho:{" "}
							<strong className="text-amber-800">{currentShopName}</strong> (Shop ID: #{selectedAdminShopId})
						</span>
					</div>
					<button
						type="button"
						onClick={() => {
							const next = new URLSearchParams(searchParams);
							next.delete("shopId");
							setSearchParams(next);
						}}
						className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-amber-300 rounded text-[11px] font-bold text-amber-800 cursor-pointer transition-colors shadow-2xs shrink-0"
					>
						← Quay lại Toàn Sàn
					</button>
				</div>
			)}

			{/* 3 KPI Cards Nền Tảng (Tổng Người Dùng, Tổng Đơn Hàng, Tổng Cửa Hàng) */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
						Tin tưởng sử dụng hệ thống
					</p>
				</div>

				{/* 2. Tổng Đơn Hàng */}
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

				{/* 3. Tổng Số Shop */}
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
						{isShopsLoading ? "..." : totalShopsCount.toLocaleString("vi-VN")} shop
					</div>
					<p className="text-[10px] text-purple-600 font-bold">
						Người bán đang hoạt động
					</p>
				</div>
			</div>

			{/* BỘ BIỂU ĐỒ THỐNG KÊ THỐNG NHẤT (Mặc định Toàn Sàn, hoặc theo shopId) */}
			<ShopAnalyticsDashboard
				shopId={selectedAdminShopId}
				shopName={currentShopName}
				isAdminView={true}
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
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<ShieldAlert className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Duyệt KYC</span>
							<span className="text-[10px] text-brand-muted font-bold">Hồ sơ người bán</span>
						</div>
					</Link>

					<Link
						to="/admin/products"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<Package className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Kho Hàng Toàn Sàn</span>
							<span className="text-[10px] text-brand-muted font-bold">Kiểm duyệt sản phẩm</span>
						</div>
					</Link>

					<Link
						to="/admin/wallets"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<Wallet className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Ví Tiền & Quyết Toán</span>
							<span className="text-[10px] text-brand-muted font-bold">Số dư hệ thống</span>
						</div>
					</Link>

					<Link
						to="/admin/payment-methods"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<CreditCard className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Cổng Thanh Toán</span>
							<span className="text-[10px] text-brand-muted font-bold">Cấu hình thanh toán</span>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default AdminOverviewView;
