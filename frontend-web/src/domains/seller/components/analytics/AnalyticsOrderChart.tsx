import { ShoppingBag, Loader2, Inbox } from "lucide-react";
import type { ChartDataPoint } from "./AnalyticsRevenueChart";

interface AnalyticsOrderChartProps {
	chartData: ChartDataPoint[];
	totalOrders: number;
	isChartLoading: boolean;
}

export function AnalyticsOrderChart({
	chartData,
	totalOrders,
	isChartLoading,
}: AnalyticsOrderChartProps) {
	return (
		<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs space-y-4">
			<div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
				<div className="flex items-center gap-2">
					<ShoppingBag className="w-4 h-4 text-blue-600" />
					<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
						Thống Kê Số Đơn Đặt Hàng
					</h3>
				</div>
				<span className="text-xs font-extrabold text-blue-600">
					Tổng: {totalOrders} đơn
				</span>
			</div>

			{isChartLoading ? (
				<div className="h-52 flex items-center justify-center">
					<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
				</div>
			) : chartData.length === 0 ? (
				<div className="h-52 flex flex-col items-center justify-center gap-2 text-xs text-brand-muted font-bold">
					<Inbox className="w-7 h-7 text-slate-300" />
					<span>Chưa có đơn hàng trong kỳ</span>
				</div>
			) : (
				<div className="h-52 flex items-end gap-1.5 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-100">
					{chartData.map((item, idx) => {
						const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);
						const heightPercent = item.orders > 0 ? Math.max((item.orders / maxOrders) * 100, 6) : 2;
						return (
							<div
								key={idx}
								className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 h-full justify-end group relative"
							>
								<span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
									{item.fullDate}: {item.orders} đơn
								</span>
								<div
									style={{ height: `${heightPercent}%` }}
									className={`w-full rounded-t-sm transition-all duration-200 ${
										item.orders > 0 ? "bg-blue-500/80 hover:bg-blue-600" : "bg-slate-100"
									}`}
								/>
								<span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">
									{item.label}
								</span>
							</div>
						);
					})}
				</div>
			)}

			{/* Trạng thái đơn hàng phân bổ */}
			<div className="grid grid-cols-3 gap-2 pt-1 text-center">
				<div className="p-2 bg-emerald-50 border border-emerald-100 rounded-md">
					<span className="text-[10px] text-emerald-700 font-bold block">Thành công</span>
					<span className="text-xs font-black text-emerald-800">
						{totalOrders}
					</span>
				</div>
				<div className="p-2 bg-amber-50 border border-amber-100 rounded-md">
					<span className="text-[10px] text-amber-700 font-bold block">Đang giao</span>
					<span className="text-xs font-black text-amber-800">0</span>
				</div>
				<div className="p-2 bg-rose-50 border border-rose-100 rounded-md">
					<span className="text-[10px] text-rose-700 font-bold block">Đã hủy</span>
					<span className="text-xs font-black text-rose-800">0</span>
				</div>
			</div>
		</div>
	);
}
