import { useMemo } from "react";
import { Package, Loader2, Inbox, ChevronLeft, ChevronRight, ExternalLink, TrendingUp } from "lucide-react";
import { useCategoriesQuery } from "@/domains/catalog";

export interface PerformanceProductItem {
	id: string | number;
	name: string;
	thumbnailUrl?: string;
	parentCategoryId?: number | string;
	soldQuantity: number;
	revenue: number;
}

interface AnalyticsProductPerformanceTableProps {
	products: PerformanceProductItem[];
	isLoading: boolean;
	title?: string;
	subtitle?: string;
	page?: number;
	pageSize?: number;
	totalCount?: number;
	totalPages?: number;
	onPageChange?: (newPage: number) => void;
	onSelectProduct?: (productId: string) => void;
}

export function AnalyticsProductPerformanceTable({
	products,
	isLoading,
	title = "Bảng Hiệu Suất Từng Sản Phẩm",
	subtitle = "Xếp hạng chi tiết doanh thu và số lượng tiêu thụ của từng mặt hàng",
	page = 1,
	pageSize = 15,
	totalCount,
	totalPages = 1,
	onPageChange,
	onSelectProduct,
}: AnalyticsProductPerformanceTableProps) {
	const effectiveTotal = totalCount ?? products.length;
	const startIndex = (page - 1) * pageSize;

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

	return (
		<div className="bg-white border border-brand-border rounded-md shadow-xs overflow-hidden">
			{/* Header */}
			<div className="p-4 sm:p-5 border-b border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
				<div>
					<div className="flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-brand-primary-deep" />
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
							{title}
						</h3>
						<span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-primary/15 text-brand-primary-deep border border-brand-primary/20">
							{effectiveTotal} sản phẩm
						</span>
					</div>
					<p className="text-[11px] text-brand-muted font-medium mt-0.5">
						{subtitle}
					</p>
				</div>
			</div>

			{/* Table Content */}
			{isLoading ? (
				<div className="h-64 flex flex-col items-center justify-center gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
					<span className="text-xs text-brand-muted font-bold">Đang tải danh sách sản phẩm...</span>
				</div>
			) : products.length === 0 ? (
				<div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-brand-muted font-bold">
					<Inbox className="w-8 h-8 text-slate-300" />
					<span>Chưa có dữ liệu sản phẩm trong kỳ phân tích này</span>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-brand-border/60 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
								<th className="py-3 px-4 w-12 text-center">#</th>
								<th className="py-3 px-4 min-w-[240px]">Sản phẩm</th>
								<th className="py-3 px-4 min-w-[100px]">Ngành hàng & Danh mục</th>
								<th className="py-3 px-4 min-w-[70px] text-center">Đã bán (cái)</th>
								<th className="py-3 px-4 text-right min-w-[130px]">Doanh thu</th>
								{onSelectProduct && <th className="py-3 px-4 w-40 text-center">Hành động</th>}
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border/40 text-xs">
							{products.map((item, idx) => {
								const rankIndex = startIndex + idx + 1;
								const itemId = item.id || (item as any).productId;
								const itemName = (item.name && item.name.trim()) || (item as any).productName || `Sản phẩm #${itemId}`;

								return (
									<tr
										key={itemId || idx}
										className="hover:bg-slate-50/60 transition-colors group"
									>
										{/* Thứ hạng */}
										<td className="py-3 px-4 text-center">
											<span
												className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${rankIndex === 1
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

										{/* Tên và ảnh sản phẩm */}
										<td className="py-3 px-4">
											<div className="flex items-center gap-3 min-w-0">
												{item.thumbnailUrl ? (
													<img
														src={item.thumbnailUrl}
														alt={itemName}
														className="w-10 h-10 rounded-md object-cover border border-brand-border shrink-0"
														onError={(e) => {
															(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
														}}
													/>
												) : (
													<div className="w-10 h-10 rounded-md bg-brand-light-soft border border-brand-border flex items-center justify-center shrink-0 text-brand-primary">
														<Package className="w-5 h-5" />
													</div>
												)}
												<div className="min-w-0 flex flex-col">
													<a
														href={`/products/${itemId}`}
														target="_blank"
														rel="noreferrer"
														className="font-bold text-brand-dark hover:text-brand-primary hover:underline transition-colors line-clamp-1 text-left"
														title={itemName}
													>
														{itemName}
													</a>
													<span className="text-[10px] font-mono text-brand-muted mt-0.5">
														Mã SP: #{itemId}
													</span>
												</div>
											</div>
										</td>

										{/* Ngành hàng */}
										<td className="py-3 px-4">
											<span className="text-xs font-bold text-slate-700">
												{(item.parentCategoryId && categoryMap.get(item.parentCategoryId)) || "Ngành hàng"}
											</span>
										</td>

										{/* Đã bán */}
										<td className="py-3 px-4 text-center">
											<span className="font-extrabold text-slate-800 text-xs">
												{item.soldQuantity.toLocaleString("vi-VN")}
											</span>
											{/* <span className="text-[10px] text-brand-muted block font-medium">sản phẩm</span> */}
										</td>

										{/* Doanh thu */}
										<td className="py-3 px-4 text-right">
											<span className="font-black text-brand-primary-deep text-xs">
												{item.revenue.toLocaleString("vi-VN")} đ
											</span>
										</td>

										{/* Hành động */}
										{onSelectProduct && (
											<td className="py-3 px-4 text-center">
												<button
													type="button"
													onClick={() => onSelectProduct(String(itemId))}
													className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-brand-primary hover:text-brand-dark text-slate-700 transition-all border border-slate-200 cursor-pointer shadow-2xs inline-flex items-center gap-1"
												>
													<span>Soi chi tiết</span>
													<ExternalLink className="w-3 h-3" />
												</button>
											</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination Footer */}
			{totalPages > 1 && (
				<div className="p-3 sm:px-5 border-t border-brand-border/60 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
					<span className="text-brand-muted font-bold text-[11px]">
						Hiển thị từ {startIndex + 1} đến {Math.min(startIndex + pageSize, effectiveTotal)} trên tổng số {effectiveTotal} sản phẩm
					</span>

					<div className="flex items-center gap-1.5">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => onPageChange && onPageChange(page - 1)}
							className="p-1.5 rounded border border-brand-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-slate-600 transition-colors"
						>
							<ChevronLeft className="w-3.5 h-3.5" />
						</button>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => onPageChange && onPageChange(p)}
								className={`w-7 h-7 rounded text-xs font-bold border transition-colors cursor-pointer ${p === page
									? "bg-brand-primary border-brand-primary text-brand-dark shadow-2xs"
									: "bg-white border-brand-border hover:bg-slate-100 text-slate-700"
									}`}
							>
								{p}
							</button>
						))}

						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => onPageChange && onPageChange(page + 1)}
							className="p-1.5 rounded border border-brand-border bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-slate-600 transition-colors"
						>
							<ChevronRight className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
