import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ShoppingCart, Wallet, Loader2, Calendar } from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

// USE_MOCK_DATA flag for fallback testing
const USE_MOCK_DATA = false;

interface DailyRevenue {
	date: string;
	revenue: number;
	orderCount: number;
}

interface RevenueReport {
	totalRevenue: number;
	availableBalance: number;
	frozenBalance: number;
	totalCompletedOrders: number;
	dailyRevenues: DailyRevenue[];
}

export function RevenueView() {
	const [report, setReport] = useState<RevenueReport | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRevenueReport = async () => {
			try {
				setIsLoading(true);
				if (USE_MOCK_DATA) {
					await new Promise((res) => setTimeout(res, 400));
					setReport({
						totalRevenue: 15450000,
						availableBalance: 8200000,
						frozenBalance: 1200000,
						totalCompletedOrders: 32,
						dailyRevenues: [
							{ date: "2026-08-23", revenue: 1500000, orderCount: 3 },
							{ date: "2026-08-24", revenue: 2200000, orderCount: 5 },
							{ date: "2026-08-25", revenue: 1800000, orderCount: 4 },
							{ date: "2026-08-26", revenue: 3100000, orderCount: 7 },
							{ date: "2026-08-27", revenue: 2700000, orderCount: 6 },
							{ date: "2026-08-28", revenue: 4150000, orderCount: 7 },
						],
					});
				} else {
					const res = await api.get("/wallet/revenue");
					const data = res.data?.value || res.data;
					setReport(data);
				}
			} catch (err: any) {
				console.error("Lỗi khi tải báo cáo doanh thu:", err);
				toast.error("Không thể tải báo cáo doanh thu.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRevenueReport();
	}, []);

	if (isLoading) {
		return (
			<div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-brand-muted font-bold">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tổng hợp báo cáo doanh thu...
			</div>
		);
	}

	const maxDailyRevenue = Math.max(...(report?.dailyRevenues.map((d) => d.revenue) || [1]));

	return (
		<div className="space-y-6 text-left font-sans">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-brand-border pb-4">
				<div>
					<h1 className="text-xl font-black text-brand-dark tracking-tight">
						Báo Cáo Doanh Thu Cửa Hàng
					</h1>
					<p className="text-xs text-brand-muted font-bold">
						Thống kê tổng hợp doanh số và số dư ví tiền bán hàng
					</p>
				</div>
				<span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full flex items-center gap-1.5">
					<TrendingUp className="w-3.5 h-3.5" /> Thống kê thời gian thực
				</span>
			</div>

			{/* 4 Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-2">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-xs font-extrabold uppercase tracking-wider">Tổng Doanh Thu</span>
						<div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
							<DollarSign className="w-4 h-4" />
						</div>
					</div>
					<div className="text-2xl font-black text-brand-dark">
						{(report?.totalRevenue || 0).toLocaleString("vi-VN")}đ
					</div>
					<p className="text-[10px] text-emerald-600 font-bold">Tích lũy từ đơn hàng hoàn thành</p>
				</div>

				<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-2">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-xs font-extrabold uppercase tracking-wider">Số Đơn Hoàn Thành</span>
						<div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
							<ShoppingCart className="w-4 h-4" />
						</div>
					</div>
					<div className="text-2xl font-black text-brand-dark">
						{report?.totalCompletedOrders || 0}
					</div>
					<p className="text-[10px] text-brand-muted font-semibold">Đơn đã giao thành công</p>
				</div>

				<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-2">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-xs font-extrabold uppercase tracking-wider">Số Dư Rút Được</span>
						<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
							<Wallet className="w-4 h-4" />
						</div>
					</div>
					<div className="text-2xl font-black text-emerald-600">
						{(report?.availableBalance || 0).toLocaleString("vi-VN")}đ
					</div>
					<p className="text-[10px] text-emerald-600 font-bold">Khả dụng trong ví shop</p>
				</div>

				<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-2">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-xs font-extrabold uppercase tracking-wider">Số Dư Đang Đóng Băng</span>
						<div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
							<Calendar className="w-4 h-4" />
						</div>
					</div>
					<div className="text-2xl font-black text-slate-700">
						{(report?.frozenBalance || 0).toLocaleString("vi-VN")}đ
					</div>
					<p className="text-[10px] text-slate-400 font-semibold">Chờ quyết toán đơn mới</p>
				</div>
			</div>

			{/* Biểu đồ doanh thu dạng Bar Chart */}
			<div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-6">
				<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
					<TrendingUp className="w-4 h-4 text-brand-primary" />
					Biểu Đồ Doanh Thu Theo Ngày
				</h3>

				{report?.dailyRevenues && report.dailyRevenues.length > 0 ? (
					<div className="h-64 flex items-end gap-3 md:gap-6 pt-8 pb-4 px-4 border-b border-slate-100 overflow-x-auto">
						{report.dailyRevenues.map((item, idx) => {
							const heightPercent = Math.max((item.revenue / maxDailyRevenue) * 100, 8);
							return (
								<div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-2 h-full justify-end group">
									<span className="text-[10px] font-black text-brand-dark opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-1 rounded shadow-md whitespace-nowrap">
										{item.revenue.toLocaleString("vi-VN")}đ ({item.orderCount} đơn)
									</span>
									<div
										style={{ height: `${heightPercent}%` }}
										className="w-full bg-brand-primary hover:bg-brand-primary-deep rounded-t-xl transition-all duration-300 shadow-xs relative"
									/>
									<span className="text-[10px] font-bold text-brand-muted truncate w-full text-center">
										{item.date.slice(5)}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<div className="py-12 text-center text-xs font-bold text-brand-muted">
						Chưa có dữ liệu doanh thu theo ngày.
					</div>
				)}
			</div>
		</div>
	);
}

export default RevenueView;
