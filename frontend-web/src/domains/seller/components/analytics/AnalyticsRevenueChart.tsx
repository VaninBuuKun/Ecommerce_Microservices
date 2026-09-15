import { useState } from "react";
import { Calendar, Loader2, Inbox } from "lucide-react";
import type { PresetFilter, FilterProductItem } from "./AnalyticsFilterBar";

export interface ChartDataPoint {
	label: string;
	revenue: number;
	orders: number;
	fullDate: string;
}

interface SvgPoint {
	x: number;
	y: number;
	point: ChartDataPoint;
}

interface AnalyticsRevenueChartProps {
	preset: PresetFilter;
	chartTitle: string;
	totalRevenue: number;
	selectedProductStat: FilterProductItem | null;
	selectedProductId: string;
	selectedMonth: number;
	selectedYear: number;
	isCustomReady: boolean;
	onApplyCustom: () => void;
	isChartLoading: boolean;
	chartData: ChartDataPoint[];
	coords: SvgPoint[];
	splinePath: string;
	areaPath: string;
	yTicks: Array<{ value: number; y: number }>;
	svgWidth: number;
	svgHeight: number;
	paddingLeft: number;
	paddingRight: number;
	paddingTop: number;
	plotHeight: number;
}

// Hàm tính toán hiển thị nhãn trục X thông minh tránh đè chữ khi có nhiều mốc (tháng 28-31 ngày)
export function shouldShowXAxisLabel(index: number, total: number): boolean {
	if (total <= 8) return true;
	if (total <= 14) return index % 2 === 0 || index === total - 1;

	// Khi có từ 15 đến 31 mốc:
	// Bước nhảy lý tưởng là 5 ngày (hiển thị khoảng 6-7 nhãn: ngày 1, 6, 11, 16, 21, 26, 31)
	const step = Math.ceil((total - 1) / 6);

	// Luôn hiển thị mốc đầu tiên và mốc cuối cùng
	if (index === 0 || index === total - 1) return true;

	if (index % step === 0) {
		// Tránh bị trùng hoặc quá sát mốc cuối cùng (cách ít nhất 2 bước)
		if (total - 1 - index < 2) return false;
		return true;
	}
	return false;
}

export function AnalyticsRevenueChart({
	preset,
	chartTitle,
	totalRevenue,
	selectedProductStat,
	selectedProductId,
	selectedMonth,
	selectedYear,
	isCustomReady,
	onApplyCustom,
	isChartLoading,
	chartData,
	coords,
	splinePath,
	areaPath,
	yTicks,
	svgWidth,
	svgHeight,
	paddingLeft,
	paddingRight,
	paddingTop,
	plotHeight,
}: AnalyticsRevenueChartProps) {
	// Hover tooltip state
	const [hoveredPoint, setHoveredPoint] = useState<{
		point: ChartDataPoint;
		x: number;
		y: number;
	} | null>(null);

	const isCustomWaiting = preset === "custom" && !isCustomReady;

	return (
		<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs space-y-4">
			{/* Top bar biểu đồ: Tiêu đề + Huy hiệu mốc thời gian */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
				<div>
					<div className="flex items-center gap-2">
						<span className="text-sm sm:text-base font-bold text-brand-dark">
							{chartTitle}{" "}
							<span className="text-rose-500 font-extrabold ml-1">
								{isCustomWaiting ? "---" : `${totalRevenue.toLocaleString("vi-VN")}đ`}
							</span>
						</span>
					</div>
					{selectedProductId !== "all" && (
						<p className="text-[11px] text-brand-primary font-semibold mt-0.5">
							Đang lọc: {selectedProductStat?.name}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
						{preset === "today"
							? "Dữ liệu 24h"
							: preset === "3d"
								? "Dữ liệu 3 ngày"
								: preset === "week"
									? "Dữ liệu 7 ngày"
									: `Tháng ${selectedMonth}/${selectedYear}`}
					</span>
				</div>
			</div>

			{/* VÙNG VẼ SVG SPLINE CURVE HOẶC LOADING HOẶC PROMPT TỰ CHỈNH */}
			<div className="relative w-full overflow-x-auto select-none pt-2 pb-2">
				{isCustomWaiting ? (
					<div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4 bg-slate-50/70 rounded-md border border-dashed border-slate-200">
						<div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary-deep flex items-center justify-center">
							<Calendar className="w-6 h-6" />
						</div>
						<div className="space-y-1">
							<h4 className="text-sm font-bold text-brand-dark">Chế độ xem Tự chỉnh</h4>
							<p className="text-xs text-brand-muted max-w-md">
								Vui lòng chọn <strong>Tháng {selectedMonth}</strong> và <strong>Năm {selectedYear}</strong> ở bộ lọc bên trên rồi nhấn nút <strong>"Xem phân tích"</strong> để tải dữ liệu biểu đồ.
							</p>
						</div>
						<button
							type="button"
							onClick={onApplyCustom}
							className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer border-none"
						>
							Xem phân tích ngay
						</button>
					</div>
				) : isChartLoading ? (
					<div className="h-64 flex flex-col items-center justify-center gap-2">
						<Loader2 className="w-6 h-6 animate-spin text-purple-600" />
						<span className="text-xs text-brand-muted font-bold">Đang tải biểu đồ spline...</span>
					</div>
				) : chartData.length === 0 ? (
					<div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-brand-muted font-bold">
						<Inbox className="w-8 h-8 text-slate-300" />
						<span>Không có dữ liệu trong khoảng thời gian này</span>
					</div>
				) : (
					<div className="relative">
						<svg
							viewBox={`0 0 ${svgWidth} ${svgHeight}`}
							className="w-full h-auto min-w-[500px]"
							style={{ overflow: "visible" }}
						>
							<defs>
								{/* Gradient cho vùng diện tích dưới đường cong */}
								<linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
									<stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
								</linearGradient>

								{/* Glow filter cho node điểm cao nhất */}
								<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
									<feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#7c3aed" floodOpacity="0.5" />
								</filter>
							</defs>

							{/* Đường lưới ngang (Grid Lines) cho trục Y */}
							{yTicks.map((tick, i) => (
								<g key={i}>
									<line
										x1={paddingLeft}
										y1={tick.y}
										x2={svgWidth - paddingRight}
										y2={tick.y}
										stroke="#f1f5f9"
										strokeDasharray={i === 0 ? "none" : "3 3"}
										strokeWidth="1"
									/>
									<text
										x={paddingLeft - 10}
										y={tick.y + 4}
										textAnchor="end"
										fontSize="10"
										fontWeight="bold"
										fill="#94a3b8"
									>
										{tick.value.toLocaleString("vi-VN")}
									</text>
								</g>
							))}

							{/* Trục X và Trục Y chính */}
							<line
								x1={paddingLeft}
								y1={paddingTop + plotHeight}
								x2={svgWidth - paddingRight}
								y2={paddingTop + plotHeight}
								stroke="#cbd5e1"
								strokeWidth="1.5"
							/>
							<line
								x1={paddingLeft}
								y1={paddingTop}
								x2={paddingLeft}
								y2={paddingTop + plotHeight}
								stroke="#cbd5e1"
								strokeWidth="1.5"
							/>

							{/* Vùng diện tích Gradient dưới đường cong */}
							{areaPath && <path d={areaPath} fill="url(#curveGradient)" />}

							{/* Đường cong Spline Bezier */}
							{splinePath && (
								<path
									d={splinePath}
									fill="none"
									stroke="#7c3aed"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							)}

							{/* Các điểm node tương tác trên đường cong */}
							{/* Các điểm node tương tác trên đường cong */}
							{coords.map((c, i) => {
								const isPeak = c.point.revenue > 0;
								const isHovered = hoveredPoint?.point.fullDate === c.point.fullDate;
								const showLabel = shouldShowXAxisLabel(i, coords.length);

								return (
									<g
										key={i}
										className="cursor-pointer"
										onMouseEnter={() => setHoveredPoint({ point: c.point, x: c.x, y: c.y })}
										onMouseLeave={() => setHoveredPoint(null)}
									>
										{/* Vùng bắt hover rộng rãi */}
										<circle cx={c.x} cy={c.y} r="8" fill="transparent" />

										{/* Điểm tròn trên đường cong */}
										<circle
											cx={c.x}
											cy={c.y}
											r={isPeak ? 4.5 : 2}
											fill={isPeak || isHovered ? "#ffffff" : "#7c3aed"}
											stroke="#7c3aed"
											strokeWidth={isPeak || isHovered ? "2.5" : "1"}
											filter={isPeak || isHovered ? "url(#glow)" : undefined}
											className="transition-all duration-150"
										/>

										{/* Vạch chia nhỏ (tick mark) trên trục X */}
										{showLabel && (
											<line
												x1={c.x}
												y1={paddingTop + plotHeight}
												x2={c.x}
												y2={paddingTop + plotHeight + 4}
												stroke="#cbd5e1"
												strokeWidth="1.5"
											/>
										)}

										{/* Nhãn mốc thời gian */}
										{showLabel && (
											<text
												x={c.x}
												y={paddingTop + plotHeight + 16}
												textAnchor="middle"
												fontSize="10"
												fontWeight={isHovered ? "bold" : "normal"}
												fill={isHovered ? "#7c3aed" : "#94a3b8"}
											>
												{c.point.label}
											</text>
										)}
									</g>
								);
							})}
						</svg>

						{/* Tooltip khi rê chuột vào điểm node */}
						{hoveredPoint && (
							<div
								style={{
									left: `${(hoveredPoint.x / svgWidth) * 100}%`,
									top: `${hoveredPoint.y - 45}px`,
								}}
								className="absolute -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-2.5 rounded-md shadow-lg pointer-events-none z-20 whitespace-nowrap"
							>
								<div className="font-bold text-[11px] text-purple-300">
									{hoveredPoint.point.fullDate}
								</div>
								<div className="font-extrabold text-white text-xs">
									{hoveredPoint.point.revenue.toLocaleString("vi-VN")}đ
								</div>
								<div className="text-[10px] text-slate-300">
									{hoveredPoint.point.orders} đơn đặt hàng
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Legend Chú Thích */}
			<div className="flex items-center justify-center gap-2 pt-2 border-t border-brand-border/40">
				<div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
					<span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-purple-300 inline-block" />
					<span>-o- Doanh thu thực tế ({chartData.length} mốc ghi nhận)</span>
				</div>
			</div>
		</div>
	);
}
