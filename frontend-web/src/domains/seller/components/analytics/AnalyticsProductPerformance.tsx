import { Award, Package, Loader2, Inbox } from "lucide-react";

export interface ProductPerformanceItem {
	id: string;
	name: string;
	revenue: number;
	orders: number;
	sold: number;
	thumbnailUrl?: string;
}

interface AnalyticsProductPerformanceProps {
	productPerformanceList: ProductPerformanceItem[];
	isTopProductsLoading: boolean;
	productStatTab: "revenue" | "orders" | "sold";
	onTabChange: (tab: "revenue" | "orders" | "sold") => void;
}

export function AnalyticsProductPerformance({
	productPerformanceList,
	isTopProductsLoading,
	productStatTab,
	onTabChange,
}: AnalyticsProductPerformanceProps) {
	return (
		<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
				<div className="flex items-center gap-2">
					<Award className="w-4 h-4 text-amber-500" />
					<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">
						Hiệu Suất Từng Món Hàng
					</h3>
				</div>

				{/* 3 Tabs chuyển đổi tiêu chí thống kê */}
				<div className="flex items-center gap-1 bg-brand-light-soft p-0.5 rounded-md border border-brand-border">
					<button
						type="button"
						onClick={() => onTabChange("revenue")}
						className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors border-none ${
							productStatTab === "revenue"
								? "bg-white text-brand-dark shadow-2xs"
								: "text-slate-500 hover:text-brand-dark bg-transparent"
						}`}
					>
						Doanh thu
					</button>
					<button
						type="button"
						onClick={() => onTabChange("orders")}
						className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors border-none ${
							productStatTab === "orders"
								? "bg-white text-brand-dark shadow-2xs"
								: "text-slate-500 hover:text-brand-dark bg-transparent"
						}`}
					>
						Số đơn
					</button>
					<button
						type="button"
						onClick={() => onTabChange("sold")}
						className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors border-none ${
							productStatTab === "sold"
								? "bg-white text-brand-dark shadow-2xs"
								: "text-slate-500 hover:text-brand-dark bg-transparent"
						}`}
					>
						Số lượng bán
					</button>
				</div>
			</div>

			{/* Danh sách xếp hạng từng món */}
			{isTopProductsLoading ? (
				<div className="h-52 flex items-center justify-center">
					<Loader2 className="w-6 h-6 animate-spin text-amber-500" />
				</div>
			) : productPerformanceList.length === 0 ? (
				<div className="h-52 flex flex-col items-center justify-center gap-2 text-xs text-brand-muted font-bold">
					<Inbox className="w-7 h-7 text-slate-300" />
					<span>Chưa có dữ liệu bán hàng cho các sản phẩm trong kỳ này</span>
				</div>
			) : (
				<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
					{productPerformanceList.map((prod, idx) => {
						const topValue =
							productStatTab === "revenue"
								? productPerformanceList[0]?.revenue || 1
								: productStatTab === "orders"
									? productPerformanceList[0]?.orders || 1
									: productPerformanceList[0]?.sold || 1;

						const currValue =
							productStatTab === "revenue"
								? prod.revenue
								: productStatTab === "orders"
									? prod.orders
									: prod.sold;

						const barPercent = currValue > 0 ? Math.max((currValue / topValue) * 100, 4) : 0;

						return (
							<div key={prod.id} className="space-y-1.5 p-2 rounded-md hover:bg-slate-50 transition-colors">
								<div className="flex items-center justify-between text-xs gap-2">
									<div className="flex items-center gap-2 min-w-0">
										<span
											className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shrink-0 ${
												idx === 0
													? "bg-amber-100 text-amber-800"
													: idx === 1
														? "bg-slate-200 text-slate-700"
														: idx === 2
															? "bg-orange-100 text-orange-800"
															: "bg-slate-100 text-slate-500"
											}`}
										>
											{idx + 1}
										</span>
										{prod.thumbnailUrl ? (
											<img
												src={prod.thumbnailUrl}
												alt={prod.name}
												className="w-7 h-7 rounded object-cover border border-brand-border shrink-0"
											/>
										) : (
											<div className="w-7 h-7 rounded bg-brand-light-soft border border-brand-border flex items-center justify-center shrink-0 text-brand-primary">
												<Package className="w-3.5 h-3.5" />
											</div>
										)}
										<a
											href={`/products/${prod.id}`}
											target="_blank"
											rel="noreferrer"
											className="font-bold text-brand-dark truncate hover:text-brand-primary hover:underline transition-colors text-left"
											title={prod.name}
										>
											{prod.name}
										</a>
									</div>

									<div className="text-right shrink-0">
										<span className="font-extrabold text-brand-primary block">
											{productStatTab === "revenue"
												? `${prod.revenue.toLocaleString("vi-VN")}đ`
												: productStatTab === "orders"
													? `${prod.orders} đơn`
													: `${prod.sold} sản phẩm`}
										</span>
									</div>
								</div>

								{/* Progress bar so sánh */}
								<div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
									<div
										style={{ width: `${barPercent}%` }}
										className={`h-full rounded-full transition-all duration-300 ${
											idx === 0
												? "bg-amber-500"
												: idx === 1
													? "bg-blue-500"
													: "bg-brand-primary"
										}`}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
