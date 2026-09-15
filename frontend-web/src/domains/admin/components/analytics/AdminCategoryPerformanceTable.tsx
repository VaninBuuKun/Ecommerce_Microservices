import { useMemo } from "react";
import { Layers, TrendingUp, BarChart2, ArrowRight } from "lucide-react";
import { useCategoriesQuery } from "@/domains/catalog";
import type { AdminCategoryItem } from "../../api/adminAnalyticsApi";

export interface AdminCategoryPerformanceTableProps {
	categoriesStats: AdminCategoryItem[];
	isLoading?: boolean;
	title?: string;
	subtitle?: string;
	onSelectCategory?: (categoryId: number | string) => void;
}

export function AdminCategoryPerformanceTable({
	categoriesStats = [],
	isLoading = false,
	title = "Thống Kê Hiệu Suất Theo Ngành Hàng",
	subtitle = "Tổng hợp doanh thu, số lượng sản phẩm bán ra và tỷ trọng đóng góp của từng ngành hàng cha trên toàn sàn",
	onSelectCategory,
}: AdminCategoryPerformanceTableProps) {
	// Lấy danh mục từ cache cây danh mục của Catalog service (Redis/React Query)
	const { data: catalogCategories = [] } = useCategoriesQuery();

	const categoryMap = useMemo(() => {
		const map = new Map<number | string, { name: string; iconUrl?: string; imageUrl?: string }>();
		catalogCategories.forEach((c: any) => {
			map.set(c.id, {
				name: c.name,
				iconUrl: c.iconUrl,
				imageUrl: c.imageUrl,
			});
			map.set(String(c.id), {
				name: c.name,
				iconUrl: c.iconUrl,
				imageUrl: c.imageUrl,
			});
		});
		return map;
	}, [catalogCategories]);

	const enrichedList = useMemo(() => {
		return categoriesStats.map((item) => {
			const info = categoryMap.get(item.categoryId) || categoryMap.get(String(item.categoryId));
			return {
				...item,
				name: (info?.name && info.name.trim()) || `Ngành hàng #${item.categoryId}`,
				iconUrl: info?.iconUrl || info?.imageUrl,
			};
		});
	}, [categoriesStats, categoryMap]);

	const totalRevenue = useMemo(() => {
		return enrichedList.reduce((sum, item) => sum + (item.revenue || 0), 0);
	}, [enrichedList]);

	const totalSold = useMemo(() => {
		return enrichedList.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
	}, [enrichedList]);

	return (
		<div className="bg-white border border-brand-border rounded-md shadow-xs overflow-hidden">
			{/* Header */}
			<div className="p-4 sm:p-5 border-b border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
				<div>
					<div className="flex items-center gap-2">
						<Layers className="w-4 h-4 text-emerald-600" />
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
							{title}
						</h3>
						<span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
							{enrichedList.length} ngành hàng
						</span>
					</div>
					<p className="text-[11px] text-brand-muted font-medium mt-0.5">
						{subtitle}
					</p>
				</div>

				<div className="flex items-center gap-4 text-xs">
					<div className="flex items-center gap-1.5 font-bold text-slate-700">
						<span className="text-slate-400 font-medium">Tổng sản lượng:</span>
						<span className="font-black text-brand-dark">{totalSold.toLocaleString("vi-VN")} cái</span>
					</div>
					<div className="flex items-center gap-1.5 font-bold text-emerald-700">
						<span className="text-slate-400 font-medium">Tổng doanh thu:</span>
						<span className="font-black">{totalRevenue.toLocaleString("vi-VN")} đ</span>
					</div>
				</div>
			</div>

			{/* Bảng dữ liệu */}
			<div className="overflow-x-auto">
				{isLoading ? (
					<div className="p-10 text-center space-y-3">
						<div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
						<p className="text-xs font-bold text-slate-400">Đang tải số liệu hiệu suất ngành hàng...</p>
					</div>
				) : enrichedList.length === 0 ? (
					<div className="p-10 text-center space-y-2">
						<Layers className="w-8 h-8 text-slate-300 mx-auto" />
						<p className="text-xs font-bold text-slate-500">Chưa có dữ liệu thống kê cho ngành hàng trong kỳ này</p>
					</div>
				) : (
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-brand-border/60 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
								<th className="py-3 px-4 w-12 text-center">#</th>
								<th className="py-3 px-4 min-w-[200px]">Ngành hàng</th>
								<th className="py-3 px-4 min-w-[90px] text-center">Đã bán (cái)</th>
								<th className="py-3 px-4 text-right min-w-[130px]">Doanh thu</th>
								<th className="py-3 px-4 min-w-[140px]">Tỷ trọng sàn</th>
								{onSelectCategory && <th className="py-3 px-4 w-32 text-center">Hành động</th>}
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border/40 text-xs">
							{enrichedList.map((cat, index) => {
								const rankIndex = index + 1;
								const pct = cat.percentage || (totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 1000) / 10 : 0);

								return (
									<tr
										key={cat.categoryId}
										className="hover:bg-slate-50/80 transition-colors group"
									>
										{/* Thứ hạng */}
										<td className="py-3 px-4 text-center">
											<span
												className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${
													rankIndex === 1
														? "bg-amber-100 text-amber-800 border border-amber-300"
														: rankIndex === 2
														? "bg-slate-200 text-slate-700 border border-slate-300"
														: rankIndex === 3
														? "bg-orange-100 text-orange-800 border border-orange-300"
														: "text-slate-500 font-bold"
												}`}
											>
												{rankIndex}
											</span>
										</td>

										{/* Tên ngành hàng & ảnh */}
										<td className="py-3 px-4">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-md border border-brand-border overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
													{cat.iconUrl ? (
														<img
															src={cat.iconUrl}
															alt={cat.name}
															className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
															onError={(e) => {
																(e.target as HTMLElement).style.display = "none";
															}}
														/>
													) : (
														<Layers className="w-4 h-4 text-slate-400" />
													)}
												</div>
												<div className="min-w-0">
													<div className="font-black text-brand-dark hover:text-emerald-700 transition-colors truncate">
														{cat.name}
													</div>
													<div className="text-[10px] font-bold text-slate-400">
														Mã ngành: #{cat.categoryId}
													</div>
												</div>
											</div>
										</td>

										{/* Đã bán */}
										<td className="py-3 px-4 text-center">
											<span className="font-extrabold text-slate-800 text-xs">
												{cat.soldQuantity.toLocaleString("vi-VN")}
											</span>
										</td>

										{/* Doanh thu */}
										<td className="py-3 px-4 text-right font-black text-emerald-700">
											{cat.revenue.toLocaleString("vi-VN")} đ
										</td>

										{/* Tỷ trọng */}
										<td className="py-3 px-4">
											<div className="space-y-1">
												<div className="flex items-center justify-between text-[10px] font-bold">
													<span className="text-slate-500">{pct}%</span>
												</div>
												<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
													<div
														className="h-full bg-emerald-500 rounded-full transition-all duration-300"
														style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
													/>
												</div>
											</div>
										</td>

										{/* Nút hành động */}
										{onSelectCategory && (
											<td className="py-3 px-4 text-center">
												<button
													type="button"
													onClick={() => onSelectCategory(cat.categoryId)}
													className="px-2.5 py-1 text-[11px] font-black text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded-md transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs group-hover:shadow-xs"
													title="Chuyển sang phân tích chi tiết ngành hàng này"
												>
													<BarChart2 className="w-3.5 h-3.5" />
													<span>Phân tích</span>
												</button>
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

export default AdminCategoryPerformanceTable;
