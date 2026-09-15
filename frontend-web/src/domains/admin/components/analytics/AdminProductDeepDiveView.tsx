import { useMemo } from "react";
import { Package, Loader2, Inbox, TrendingUp, DollarSign, ShoppingCart, ExternalLink, Store } from "lucide-react";
import { useCategoriesQuery } from "@/domains/catalog";
import type { ProductDetailAnalyticsData } from "../../api/adminAnalyticsApi";

export interface AdminProductDeepDiveViewProps {
	data: ProductDetailAnalyticsData | null | undefined;
	isLoading: boolean;
	productId: string | number;
}

export function AdminProductDeepDiveView({
	data,
	isLoading,
	productId,
}: AdminProductDeepDiveViewProps) {
	const { data: categories = [] } = useCategoriesQuery();
	const categoryMap = useMemo(() => {
		const map = new Map<number | string, string>();
		categories.forEach((cat) => {
			map.set(cat.id, cat.name);
			map.set(String(cat.id), cat.name);
			if (cat.subCategories && Array.isArray(cat.subCategories)) {
				cat.subCategories.forEach((sub: any) => {
					map.set(sub.id, sub.name);
					map.set(String(sub.id), sub.name);
				});
			}
		});
		return map;
	}, [categories]);

	const parentCategoryName = data?.parentCategoryId
		? categoryMap.get(data.parentCategoryId) || "Ngành hàng"
		: "Ngành hàng";

	if (isLoading) {
		return (
			<div className="bg-white border border-brand-border rounded-md p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
				<Loader2 className="w-8 h-8 animate-spin text-amber-500" />
				<span className="text-xs font-bold text-brand-muted">
					Đang nạp dữ liệu phân tích sản phẩm #{productId}...
				</span>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="bg-white border border-brand-border rounded-md p-12 flex flex-col items-center justify-center gap-3 text-center shadow-xs">
				<Inbox className="w-10 h-10 text-slate-300" />
				<h4 className="text-sm font-black text-brand-dark">Không tìm thấy sản phẩm #{productId}</h4>
				<p className="text-xs text-brand-muted max-w-md">
					Sản phẩm này chưa phát sinh giao dịch trong hệ thống phân tích hoặc mã ID không chính xác.
				</p>
			</div>
		);
	}

	const chartPoints = data.chartData || [];
	const maxChartRev = Math.max(...chartPoints.map((p) => p.revenue), 1);

	return (
		<div className="space-y-5 animate-in fade-in duration-200">
			{/* Thẻ thông tin tổng quan sản phẩm */}
			<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
				<div className="flex items-center gap-4 min-w-0">
					{data.thumbnailUrl ? (
						<img
							src={data.thumbnailUrl}
							alt={data.name}
							className="w-16 h-16 rounded-lg object-cover border border-brand-border shadow-xs shrink-0"
							onError={(e) => {
								(e.target as HTMLImageElement).src =
									"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
							}}
						/>
					) : (
						<div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
							<Package className="w-8 h-8" />
						</div>
					)}

					<div className="min-w-0 space-y-1">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black">
								{parentCategoryName}
							</span>
						</div>
						<h2 className="text-sm sm:text-base font-black text-brand-dark line-clamp-1">
							{data.name}
						</h2>
						<div className="flex items-center gap-3 text-xs text-brand-muted font-medium">
							<span className="font-mono font-bold">Mã SP: #{data.productId}</span>
							<span>•</span>
							<span className="flex items-center gap-1 font-bold text-purple-700">
								<Store className="w-3.5 h-3.5" />
								<span>Shop #{data.shopId}</span>
							</span>
						</div>
					</div>
				</div>

				<a
					href={`/products/${data.productId}`}
					target="_blank"
					rel="noreferrer"
					className="px-3.5 py-2 rounded-md bg-brand-light-soft hover:bg-brand-primary text-brand-dark border border-brand-border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs shrink-0 no-underline"
				>
					<span>Mở trang sản phẩm</span>
					<ExternalLink className="w-3.5 h-3.5" />
				</a>
			</div>

			{/* 2 Thẻ KPI Tổng sản phẩm */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
							Tổng Doanh Thu Sản Phẩm
						</span>
						<span className="text-xl font-black text-brand-dark block mt-1">
							{data.revenue.toLocaleString("vi-VN")} đ
						</span>
						<span className="text-[10px] text-emerald-600 font-bold">Đóng góp doanh số toàn sàn</span>
					</div>
					<div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
						<DollarSign className="w-5 h-5" />
					</div>
				</div>

				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs flex items-center justify-between">
					<div>
						<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
							Tổng Số Lượng Đã Bán
						</span>
						<span className="text-xl font-black text-brand-dark block mt-1">
							{data.soldQuantity.toLocaleString("vi-VN")} sản phẩm
						</span>
						<span className="text-[10px] text-blue-600 font-bold">Tổng lượt mua thành công</span>
					</div>
					<div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
						<ShoppingCart className="w-5 h-5" />
					</div>
				</div>
			</div>

			{/* Biểu đồ xu hướng bán hàng của sản phẩm */}
			<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs space-y-4">
				<div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
					<div className="flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-amber-600" />
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
							Biến Động Doanh Thu Sản Phẩm Theo Thời Gian
						</h3>
					</div>
					<span className="text-xs font-bold text-brand-muted">
						{chartPoints.length} mốc thống kê
					</span>
				</div>

				{chartPoints.length === 0 ? (
					<div className="h-44 flex items-center justify-center text-xs text-brand-muted font-bold">
						Chưa có dữ liệu biến động cho sản phẩm này
					</div>
				) : (
					<div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-100">
						{chartPoints.map((item, idx) => {
							const heightPercent =
								item.revenue > 0 ? Math.max((item.revenue / maxChartRev) * 100, 8) : 4;
							return (
								<div
									key={idx}
									className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5 h-full justify-end group relative"
								>
									<span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
										{item.date}: {item.revenue.toLocaleString("vi-VN")}đ ({item.orderCount} cái)
									</span>
									<div
										style={{ height: `${heightPercent}%` }}
										className={`w-full rounded-t-sm transition-all duration-200 ${
											item.revenue > 0 ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-100"
										}`}
									/>
									<span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">
										{item.date.slice(5)}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

export default AdminProductDeepDiveView;
