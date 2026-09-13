import { DollarSign, ShoppingBag, Package, TrendingUp } from "lucide-react";

interface AnalyticsKpiCardsProps {
	totalRevenue: number;
	totalOrders: number;
	totalSoldUnits: number;
	avgDailyRevenue: number;
	isChartLoading: boolean;
	isTopProductsLoading: boolean;
	isCustomWaiting: boolean;
	todayOrders?: number;
}

export function AnalyticsKpiCards({
	totalRevenue,
	totalOrders,
	totalSoldUnits,
	avgDailyRevenue,
	isChartLoading,
	isTopProductsLoading,
	isCustomWaiting,
	todayOrders,
}: AnalyticsKpiCardsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{/* 1. TỔNG DOANH THU (Kèm Doanh thu trung bình làm subtitle) */}
			<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
				<div className="flex items-center justify-between text-brand-muted">
					<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
						Tổng Doanh Thu
					</span>
					<div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
						<DollarSign className="w-4 h-4" />
					</div>
				</div>
				<div className="text-xl font-black text-brand-dark">
					{isCustomWaiting ? "---" : isChartLoading ? "..." : `${totalRevenue.toLocaleString("vi-VN")}đ`}
				</div>
				<p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
					<TrendingUp className="w-3 h-3" />
					<span>
						{isCustomWaiting
							? "Chờ cập nhật"
							: `TB ~${avgDailyRevenue.toLocaleString("vi-VN")}đ / ngày`}
					</span>
				</p>
			</div>

			{/* 2. SỐ ĐƠN ĐẶT HÀNG */}
			<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
				<div className="flex items-center justify-between text-brand-muted">
					<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
						Số Đơn Đặt Hàng
					</span>
					<div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
						<ShoppingBag className="w-4 h-4" />
					</div>
				</div>
				<div className="text-xl font-black text-brand-dark">
					{isCustomWaiting ? "---" : isChartLoading ? "..." : `${totalOrders.toLocaleString("vi-VN")} đơn`}
				</div>
				<p className="text-[10px] text-brand-muted font-medium">
					{todayOrders !== undefined
						? `Hôm nay: +${todayOrders} đơn`
						: "Tích lũy theo kỳ lọc"}
				</p>
			</div>

			{/* 3. SẢN PHẨM ĐÃ BÁN */}
			<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
				<div className="flex items-center justify-between text-brand-muted">
					<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
						Sản Phẩm Đã Bán
					</span>
					<div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
						<Package className="w-4 h-4" />
					</div>
				</div>
				<div className="text-xl font-black text-brand-dark">
					{isCustomWaiting ? "---" : isTopProductsLoading ? "..." : `${totalSoldUnits.toLocaleString("vi-VN")} cái`}
				</div>
				<p className="text-[10px] text-purple-600 font-bold">
					{totalOrders > 0
						? `TB ~${(totalSoldUnits / totalOrders).toFixed(1)} món / đơn`
						: "Chưa có lượt bán"}
				</p>
			</div>
		</div>
	);
}
