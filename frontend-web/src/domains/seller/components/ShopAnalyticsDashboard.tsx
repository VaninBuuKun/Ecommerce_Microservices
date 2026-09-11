import { useState, useMemo } from "react";
import {
	DollarSign,
	ShoppingBag,
	TrendingUp,
	Package,
	Filter,
	Award,
	CreditCard,
	Wallet,
} from "lucide-react";

export interface ShopAnalyticsDashboardProps {
	shopId?: string | number | null;
	shopName?: string;
	isAdminView?: boolean;
	availableShops?: Array<{ id: string | number; name: string }>;
	onSelectShop?: (shopId: string | number | null) => void;
}

// Danh sách sản phẩm mẫu cho bộ lọc
const SAMPLE_PRODUCTS = [
	{
		id: "all",
		name: "Tất cả sản phẩm",
		price: 0,
		image: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=120&auto=format&fit=crop&q=80",
	},
	{
		id: "prod-1",
		name: "Bàn phím cơ không dây Bluetooth RGB Hot-swap",
		price: 950000,
		image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=80",
	},
	{
		id: "prod-2",
		name: "Chuột Gaming công thái học không dây 26000 DPI siêu nhẹ 49g",
		price: 690000,
		image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=120&auto=format&fit=crop&q=80",
	},
	{
		id: "prod-3",
		name: "Tấm lót chuột bàn di chuột cỡ lớn 90x40cm chống trượt viền may",
		price: 120000,
		image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=120&auto=format&fit=crop&q=80",
	},
	{
		id: "prod-4",
		name: "Giá đỡ màn hình máy tính công thái học xoay 360",
		price: 480000,
		image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=120&auto=format&fit=crop&q=80",
	},
	{
		id: "prod-5",
		name: "Tai nghe Gaming Chụp tai 7.1 Surround Mic lọc ồn",
		price: 850000,
		image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80",
	},
];

type PresetFilter = "today" | "3d" | "week" | "month" | "year" | "custom_month";

interface ChartDataPoint {
	label: string; // Tên hiển thị trục X
	revenue: number; // Doanh thu (VNĐ)
	orders: number; // Số đơn đặt hàng
	fullDate: string;
}

export function ShopAnalyticsDashboard({
	shopId,
	shopName = "Cửa hàng của tôi",
	isAdminView = false,
	availableShops = [],
	onSelectShop,
}: ShopAnalyticsDashboardProps) {
	// Bộ lọc thời gian
	const [preset, setPreset] = useState<PresetFilter>("custom_month");
	const [selectedYear, setSelectedYear] = useState<number>(2025);
	const [selectedMonth, setSelectedMonth] = useState<number>(2); // Mặc định Tháng 2/2025 giống screenshot
	const [selectedProductId, setSelectedProductId] = useState<string>("all");

	// Tab hiệu suất sản phẩm: Doanh thu | Số đơn đặt | Số lượng bán
	const [productStatTab, setProductStatTab] = useState<"revenue" | "orders" | "sold">("revenue");

	// Hover tooltip state cho biểu đồ
	const [hoveredPoint, setHoveredPoint] = useState<{
		point: ChartDataPoint;
		x: number;
		y: number;
	} | null>(null);

	// Tạo dữ liệu biểu đồ dựa trên bộ lọc
	const chartData = useMemo<ChartDataPoint[]>(() => {
		const points: ChartDataPoint[] = [];
		const isSpecificProduct = selectedProductId !== "all";
		const multiplier = isSpecificProduct ? 0.35 : 1.0;

		if (preset === "today") {
			// 8 mốc khung giờ hôm nay
			const hours = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
			const baseRevenues = [0, 0, 180000, 650000, 1200000, 890000, 2100000, 1400000];
			const baseOrders = [0, 0, 1, 3, 5, 4, 9, 6];
			hours.forEach((hr, i) => {
				points.push({
					label: hr,
					revenue: Math.round(baseRevenues[i] * multiplier),
					orders: Math.max(1, Math.round(baseOrders[i] * multiplier)),
					fullDate: `Hôm nay ${hr}`,
				});
			});
		} else if (preset === "3d") {
			// 3 ngày qua
			const days = ["Hôm kia (09/09)", "Hôm qua (10/09)", "Hôm nay (11/09)"];
			const baseRevenues = [4850000, 6200000, 5450000];
			const baseOrders = [18, 24, 21];
			days.forEach((day, i) => {
				points.push({
					label: day.slice(0, 7),
					revenue: Math.round(baseRevenues[i] * multiplier),
					orders: Math.max(1, Math.round(baseOrders[i] * multiplier)),
					fullDate: day,
				});
			});
		} else if (preset === "week") {
			// Tuần này (Thứ 2 -> Chủ nhật)
			const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
			const baseRevenues = [2400000, 3100000, 4200000, 3800000, 6500000, 8200000, 7100000];
			const baseOrders = [10, 12, 16, 14, 25, 32, 28];
			days.forEach((day, i) => {
				points.push({
					label: day,
					revenue: Math.round(baseRevenues[i] * multiplier),
					orders: Math.max(1, Math.round(baseOrders[i] * multiplier)),
					fullDate: `Ngày ${day} trong tuần`,
				});
			});
		} else if (preset === "year") {
			// Filter theo năm: Trục X là tháng 1 -> 12.
			// Lưu ý yêu cầu: "nếu những tháng chưa diễn ra thì thôi, chia đều ra"
			// Nếu năm chọn là năm hiện tại (2026), chỉ hiển thị tháng 1 -> 9 (tháng hiện tại).
			// Nếu năm chọn là 2025 hoặc quá khứ, hiển thị đủ 12 tháng.
			const maxMonth = selectedYear === 2026 ? 9 : 12;
			for (let m = 1; m <= maxMonth; m++) {
				let baseRev = 0;
				let baseOrd = 0;
				if (selectedYear === 2025) {
					// Dữ liệu mô phỏng năm 2025
					const revByMonth = [
						18500000, 24600000, 32000000, 28500000, 34200000, 41000000, 38900000, 45200000, 49800000, 56000000,
						62500000, 78000000,
					];
					baseRev = revByMonth[m - 1];
					baseOrd = Math.round(baseRev / 420000);
				} else {
					// Năm 2026 (đến tháng 9)
					const revByMonth = [
						42000000, 38000000, 46500000, 51000000, 58200000, 63000000, 69400000, 74200000, 81000000,
					];
					baseRev = revByMonth[m - 1] || 45000000;
					baseOrd = Math.round(baseRev / 480000);
				}
				points.push({
					label: `${m}`,
					revenue: Math.round(baseRev * multiplier),
					orders: Math.max(1, Math.round(baseOrd * multiplier)),
					fullDate: `Tháng ${m}/${selectedYear}`,
				});
			}
		} else {
			// Preset: Month (Tháng)
			// Trục X là các ngày trong tháng (1 -> 28/30/31)
			// Đặc biệt: Tháng 2 năm 2025 có 28 ngày giống ảnh chụp người dùng gửi!
			const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

			for (let d = 1; d <= daysInMonth; d++) {
				let rev = 0;
				let ord = 0;

				// Nếu là Tháng 2/2025: Mô phỏng chính xác đợt tăng vọt ngày 25 & 26 như ảnh của user!
				if (selectedYear === 2025 && selectedMonth === 2) {
					if (d === 25) {
						rev = 360000;
						ord = 3;
					} else if (d === 26) {
						rev = 178000;
						ord = 2;
					} else {
						rev = 0;
						ord = 0;
					}
				} else {
					// Dữ liệu tháng khác: Có doanh số đều đặn và đợt sale giữa/cuối tháng
					if (d === 15 || d === 25) {
						rev = Math.round((2800000 + (d % 3) * 600000) * multiplier);
						ord = Math.round(rev / 350000);
					} else if (d % 4 === 0) {
						rev = Math.round((1400000 + (d % 5) * 350000) * multiplier);
						ord = Math.round(rev / 320000);
					} else if (d % 2 === 0) {
						rev = Math.round((750000 + (d % 3) * 200000) * multiplier);
						ord = Math.round(rev / 300000);
					} else {
						rev = Math.round((250000 + (d % 2) * 150000) * multiplier);
						ord = 1;
					}
				}

				points.push({
					label: `${d}`,
					revenue: Math.round(rev * multiplier),
					orders: Math.round(ord * multiplier),
					fullDate: `Ngày ${d}/${selectedMonth}/${selectedYear}`,
				});
			}
		}

		return points;
	}, [preset, selectedYear, selectedMonth, selectedProductId]);

	// Tổng doanh thu và đơn hàng trong kỳ lọc
	const totalRevenue = useMemo(() => chartData.reduce((sum, p) => sum + p.revenue, 0), [chartData]);
	const totalOrders = useMemo(() => chartData.reduce((sum, p) => sum + p.orders, 0), [chartData]);
	const totalSoldUnits = useMemo(() => Math.round(totalOrders * 1.6), [totalOrders]);
	const avgDailyRevenue = useMemo(
		() => Math.round(totalRevenue / (chartData.length || 1)),
		[totalRevenue, chartData.length],
	);

	// Giá trị lớn nhất trên trục Y (để scale biểu đồ mượt mà)
	const maxRevenue = useMemo(() => {
		const peak = Math.max(...chartData.map((d) => d.revenue), 0);
		if (peak === 0) return 360000;
		// Làm tròn lên mốc chia 4 đẹp mắt
		const factor = Math.pow(10, Math.floor(Math.log10(peak)));
		return Math.ceil(peak / (factor / 2)) * (factor / 2);
	}, [chartData]);

	// Danh sách sản phẩm hiệu suất
	const productPerformanceList = useMemo(() => {
		const prods = SAMPLE_PRODUCTS.filter((p) => p.id !== "all");
		const isSpecific = selectedProductId !== "all";

		return prods
			.filter((p) => !isSpecific || p.id === selectedProductId)
			.map((p, idx) => {
				const revRatio = [0.38, 0.26, 0.16, 0.12, 0.08][idx] || 0.1;
				const pRev = isSpecific ? totalRevenue : Math.round(totalRevenue * revRatio);
				const pOrders = isSpecific ? totalOrders : Math.round(totalOrders * revRatio);
				const pSold = Math.round(pOrders * (1.2 + idx * 0.2));
				return {
					...p,
					revenue: pRev,
					orders: pOrders,
					sold: pSold,
					percentage: Math.round(revRatio * 100),
				};
			})
			.sort((a, b) => {
				if (productStatTab === "revenue") return b.revenue - a.revenue;
				if (productStatTab === "orders") return b.orders - a.orders;
				return b.sold - a.sold;
			});
	}, [totalRevenue, totalOrders, selectedProductId, productStatTab]);

	// SVG Dimensions
	const svgWidth = 860;
	const svgHeight = 240;
	const paddingLeft = 65;
	const paddingRight = 25;
	const paddingTop = 25;
	const paddingBottom = 35;
	const plotWidth = svgWidth - paddingLeft - paddingRight;
	const plotHeight = svgHeight - paddingTop - paddingBottom;

	// Tính toán tọa độ (x, y) cho từng điểm dữ liệu
	const coords = useMemo(() => {
		if (!chartData.length) return [];
		return chartData.map((point, index) => {
			const x =
				chartData.length === 1
					? paddingLeft + plotWidth / 2
					: paddingLeft + (index / (chartData.length - 1)) * plotWidth;
			const ratio = maxRevenue > 0 ? point.revenue / maxRevenue : 0;
			const y = paddingTop + plotHeight - ratio * plotHeight;
			return { x, y, point };
		});
	}, [chartData, maxRevenue, plotWidth, plotHeight]);

	// Tạo đường cong Cubic Bezier Spline mượt mà xuyên suốt các điểm (Smooth Spline Curve)
	const splinePath = useMemo(() => {
		if (coords.length === 0) return "";
		if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

		let path = `M ${coords[0].x} ${coords[0].y}`;
		for (let i = 0; i < coords.length - 1; i++) {
			const curr = coords[i];
			const next = coords[i + 1];
			const prev = coords[i - 1] || curr;
			const nextNext = coords[i + 2] || next;

			// Tension 0.2
			const cp1x = curr.x + (next.x - prev.x) * 0.2;
			const cp1y = curr.y + (next.y - prev.y) * 0.2;
			const cp2x = next.x - (nextNext.x - curr.x) * 0.2;
			const cp2y = next.y - (nextNext.y - curr.y) * 0.2;

			path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
		}
		return path;
	}, [coords]);

	// Vùng gradient dưới đường cong
	const areaPath = useMemo(() => {
		if (coords.length === 0) return "";
		const first = coords[0];
		const last = coords[coords.length - 1];
		const baselineY = paddingTop + plotHeight;
		return `${splinePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
	}, [coords, splinePath, plotHeight]);

	// 5 Mốc giá trị trục Y (0%, 25%, 50%, 75%, 100%)
	const yTicks = useMemo(() => {
		return [0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
			const value = Math.round(maxRevenue * fraction);
			const y = paddingTop + plotHeight - fraction * plotHeight;
			return { value, y };
		});
	}, [maxRevenue, plotHeight]);

	// Chuỗi tiêu đề chính của Card biểu đồ (giống ảnh mẫu người dùng gửi)
	const chartTitle = useMemo(() => {
		if (preset === "custom_month" || preset === "month") {
			return `Doanh Thu Tháng ${selectedMonth}:`;
		}
		if (preset === "year") {
			return `Doanh Thu Năm ${selectedYear}:`;
		}
		if (preset === "today") {
			return "Doanh Thu Hôm Nay:";
		}
		if (preset === "3d") {
			return "Doanh Thu 3 Ngày Qua:";
		}
		return "Doanh Thu Tuần Này:";
	}, [preset, selectedMonth, selectedYear]);

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Header chuẩn phong cách, đồng bộ với các trang khác */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-xl font-bold text-brand-dark mb-1">
						{isAdminView ? `Thống Kê Doanh Thu: ${shopName}` : "Báo Cáo Doanh Thu & Thống Kê"}
					</h1>
					<p className="text-xs text-brand-muted">
						{isAdminView
							? "Dữ liệu giám sát hiệu suất và biến động doanh số theo từng gian hàng"
							: "Theo dõi chi tiết tăng trưởng doanh số, số lượng đơn hàng và hiệu suất từng sản phẩm"}
					</p>
				</div>

				{/* Nếu ở chế độ Admin, có dropdown chọn xem theo Shop */}
				{isAdminView && availableShops.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-brand-muted">Xem shop:</span>
						<select
							value={shopId ? String(shopId) : "all"}
							onChange={(e) => {
								const val = e.target.value === "all" ? null : e.target.value;
								onSelectShop?.(val);
							}}
							className="px-3 py-1.5 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-xs"
						>
							<option value="all">Toàn Sàn (Tất cả shop)</option>
							{availableShops.map((s) => (
								<option key={s.id} value={String(s.id)}>
									{s.name}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* THANH BỘ LỌC ĐA NĂNG (Cards & Divs dùng hoàn toàn rounded-md) */}
			<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					{/* Nhóm nút chọn nhanh thời gian */}
					<div className="flex flex-wrap items-center gap-1.5">
						<button
							type="button"
							onClick={() => setPreset("today")}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								preset === "today"
									? "bg-brand-dark text-white border-brand-dark shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							Hôm nay
						</button>
						<button
							type="button"
							onClick={() => setPreset("3d")}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								preset === "3d"
									? "bg-brand-dark text-white border-brand-dark shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							3 ngày qua
						</button>
						<button
							type="button"
							onClick={() => setPreset("week")}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								preset === "week"
									? "bg-brand-dark text-white border-brand-dark shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							Tuần này
						</button>
						<button
							type="button"
							onClick={() => {
								setPreset("custom_month");
								setSelectedMonth(new Date().getMonth() + 1);
							}}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								preset === "custom_month" && selectedMonth === new Date().getMonth() + 1
									? "bg-brand-dark text-white border-brand-dark shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							Tháng này
						</button>
						<button
							type="button"
							onClick={() => setPreset("year")}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								preset === "year"
									? "bg-brand-dark text-white border-brand-dark shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							Theo Năm
						</button>
					</div>

					{/* Dropdown Lọc Theo Sản Phẩm */}
					<div className="flex items-center gap-2 w-full sm:w-auto">
						<Filter className="w-3.5 h-3.5 text-brand-muted shrink-0" />
						<span className="text-xs font-bold text-slate-600 shrink-0">Lọc sản phẩm:</span>
						<select
							value={selectedProductId}
							onChange={(e) => setSelectedProductId(e.target.value)}
							className="px-2.5 py-1.5 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer w-full sm:w-64 truncate shadow-xs"
						>
							{SAMPLE_PRODUCTS.map((prod) => (
								<option key={prod.id} value={prod.id}>
									{prod.name}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* 4 THẺ THÔNG SỐ KPI (rounded-md) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
						{totalRevenue.toLocaleString("vi-VN")}đ
					</div>
					<p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
						<TrendingUp className="w-3 h-3" /> +14.8% so với kỳ trước
					</p>
				</div>

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
						{totalOrders.toLocaleString("vi-VN")} đơn
					</div>
					<p className="text-[10px] text-brand-muted font-medium">
						Tỷ lệ hoàn thành: <strong className="text-brand-dark">96.5%</strong>
					</p>
				</div>

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
						{totalSoldUnits.toLocaleString("vi-VN")} cái
					</div>
					<p className="text-[10px] text-purple-600 font-bold">
						TB ~{(totalSoldUnits / (totalOrders || 1)).toFixed(1)} món / đơn
					</p>
				</div>

				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Doanh Thu Trung Bình
						</span>
						<div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
							<TrendingUp className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-emerald-600">
						{avgDailyRevenue.toLocaleString("vi-VN")}đ
					</div>
					<p className="text-[10px] text-brand-muted font-medium">Trung bình theo mốc thời gian</p>
				</div>
			</div>

			{/* BIỂU ĐỒ DOANH THU SPLINE CURVE CHÍNH (GIỐNG HÌNH ẢNH MINH HỌA) */}
			<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs space-y-4">
				{/* Top bar biểu đồ: Tiêu đề + Dropdown Năm/Tháng */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm sm:text-base font-bold text-brand-dark">
								{chartTitle}{" "}
								<span className="text-rose-500 font-extrabold ml-1">
									{totalRevenue.toLocaleString("vi-VN")}đ
								</span>
							</span>
						</div>
						{selectedProductId !== "all" && (
							<p className="text-[11px] text-brand-primary-deep font-semibold mt-0.5">
								Đang lọc: {SAMPLE_PRODUCTS.find((p) => p.id === selectedProductId)?.name}
							</p>
						)}
					</div>

					{/* Dropdowns Năm & Tháng (giống ảnh mẫu người dùng) */}
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
							<span>Năm:</span>
							<select
								value={selectedYear}
								onChange={(e) => {
									setSelectedYear(Number(e.target.value));
									if (preset !== "year") setPreset("custom_month");
								}}
								className="px-2 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
							>
								<option value={2026}>2026</option>
								<option value={2025}>2025</option>
								<option value={2024}>2024</option>
							</select>
						</div>

						{preset !== "year" && (
							<div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
								<span>Tháng:</span>
								<select
									value={selectedMonth}
									onChange={(e) => {
										setSelectedMonth(Number(e.target.value));
										setPreset("custom_month");
									}}
									className="px-2 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
								>
									{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
							</div>
						)}
					</div>
				</div>

				{/* VÙNG VẼ SVG SPLINE CURVE */}
				<div className="relative w-full overflow-x-auto select-none pt-2 pb-2">
					<div className="min-w-[700px]">
						<svg
							viewBox={`0 0 ${svgWidth} ${svgHeight}`}
							className="w-full h-64 overflow-visible"
						>
							<defs>
								{/* Gradient nền tím / chàm mờ dần phía dưới curve */}
								<linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
									<stop offset="60%" stopColor="#6366f1" stopOpacity="0.08" />
									<stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
								</linearGradient>
								{/* Shadow filter cho điểm node */}
								<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
									<feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#7c3aed" floodOpacity="0.4" />
								</filter>
							</defs>

							{/* Các đường Grid ngang + Nhãn giá trị trục Y */}
							{yTicks.map((tick, idx) => (
								<g key={idx}>
									<line
										x1={paddingLeft}
										y1={tick.y}
										x2={svgWidth - paddingRight}
										y2={tick.y}
										stroke="#f1f5f9"
										strokeWidth="1"
										strokeDasharray={idx === 0 ? "0" : "3,3"}
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
							{coords.map((c, i) => {
								const isPeak = c.point.revenue > 0;
								return (
									<g
										key={i}
										className="cursor-pointer group"
										onMouseEnter={() => setHoveredPoint({ point: c.point, x: c.x, y: c.y })}
										onMouseLeave={() => setHoveredPoint(null)}
									>
										{/* Hit target rộng hơn */}
										<circle cx={c.x} cy={c.y} r="8" fill="transparent" />

										{/* Vòng tròn node */}
										<circle
											cx={c.x}
											cy={c.y}
											r={isPeak ? 4.5 : 2}
											fill={isPeak ? "#ffffff" : "#7c3aed"}
											stroke="#7c3aed"
											strokeWidth={isPeak ? "2.5" : "1"}
											filter={isPeak ? "url(#glow)" : undefined}
											className="transition-transform group-hover:scale-150 duration-150"
										/>

										{/* Nhãn trục X ở dưới */}
										<text
											x={c.x}
											y={paddingTop + plotHeight + 16}
											textAnchor="middle"
											fontSize="10"
											fontWeight={isPeak ? "bold" : "normal"}
											fill={isPeak ? "#475569" : "#94a3b8"}
										>
											{c.point.label}
										</text>
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
				</div>

				{/* Legend Chú Thích Giống Hình Minh Họa */}
				<div className="flex items-center justify-center gap-2 pt-2 border-t border-brand-border/40">
					<div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
						<span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-purple-300 inline-block" />
						<span>-o- Doanh_thu</span>
					</div>
				</div>
			</div>

			{/* 2 BIỂU ĐỒ BỔ SUNG: SỐ ĐƠN ĐẶT HÀNG & HIỆU SUẤT TỪNG MÓN */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 1. Biểu đồ Thống Kê Số Lượng Đơn Đặt Hàng */}
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

					<div className="h-52 flex items-end gap-1.5 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-100">
						{chartData.map((item, idx) => {
							const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);
							const heightPercent = Math.max((item.orders / maxOrders) * 100, 6);
							return (
								<div
									key={idx}
									className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 h-full justify-end group relative"
								>
									{/* Tooltip */}
									<span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
										{item.fullDate}: {item.orders} đơn
									</span>

									{/* Cột số đơn */}
									<div
										style={{ height: `${heightPercent}%` }}
										className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all duration-200"
									/>
									<span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">
										{item.label}
									</span>
								</div>
							);
						})}
					</div>

					{/* Trạng thái đơn hàng phân bổ */}
					<div className="grid grid-cols-3 gap-2 pt-1 text-center">
						<div className="p-2 bg-emerald-50 border border-emerald-100 rounded-md">
							<span className="text-[10px] text-emerald-700 font-bold block">Thành công</span>
							<span className="text-xs font-black text-emerald-800">
								{Math.round(totalOrders * 0.94)}
							</span>
						</div>
						<div className="p-2 bg-amber-50 border border-amber-100 rounded-md">
							<span className="text-[10px] text-amber-700 font-bold block">Đang giao</span>
							<span className="text-xs font-black text-amber-800">
								{Math.max(1, Math.round(totalOrders * 0.04))}
							</span>
						</div>
						<div className="p-2 bg-rose-50 border border-rose-100 rounded-md">
							<span className="text-[10px] text-rose-700 font-bold block">Đã hủy</span>
							<span className="text-xs font-black text-rose-800">
								{Math.max(0, Math.round(totalOrders * 0.02))}
							</span>
						</div>
					</div>
				</div>

				{/* 2. Biểu đồ Hiệu Suất Từng Món (Doanh thu / Đơn hàng / Số lượng bán) */}
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
								onClick={() => setProductStatTab("revenue")}
								className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
									productStatTab === "revenue"
										? "bg-white text-brand-dark shadow-2xs"
										: "text-slate-500 hover:text-brand-dark"
								}`}
							>
								Doanh thu
							</button>
							<button
								type="button"
								onClick={() => setProductStatTab("orders")}
								className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
									productStatTab === "orders"
										? "bg-white text-brand-dark shadow-2xs"
										: "text-slate-500 hover:text-brand-dark"
								}`}
							>
								Số đơn
							</button>
							<button
								type="button"
								onClick={() => setProductStatTab("sold")}
								className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
									productStatTab === "sold"
										? "bg-white text-brand-dark shadow-2xs"
										: "text-slate-500 hover:text-brand-dark"
								}`}
							>
								Số lượng bán
							</button>
						</div>
					</div>

					{/* Danh sách xếp hạng từng món */}
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

							const barPercent = Math.max((currValue / topValue) * 100, 8);

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
											<img
												src={prod.image}
												alt={prod.name}
												className="w-7 h-7 rounded object-cover border border-brand-border shrink-0"
											/>
											<span className="font-bold text-brand-dark truncate">{prod.name}</span>
										</div>

										<div className="text-right shrink-0">
											<span className="font-extrabold text-brand-primary-deep block">
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
				</div>
			</div>

			{/* KHỐI PHÂN BỔ PHƯƠNG THỨC THANH TOÁN (rounded-md) */}
			<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2 mb-3">
					Phân Bổ Kênh Thanh Toán
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-md border border-brand-border text-emerald-600">
							<CreditCard className="w-4 h-4" />
						</div>
						<div>
							<span className="text-[10px] text-brand-muted font-bold block">COD (Tiền mặt)</span>
							<span className="text-xs font-extrabold text-brand-dark">48.5%</span>
						</div>
					</div>
					<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-md border border-brand-border text-pink-600">
							<Wallet className="w-4 h-4" />
						</div>
						<div>
							<span className="text-[10px] text-brand-muted font-bold block">Ví MoMo</span>
							<span className="text-xs font-extrabold text-brand-dark">26.2%</span>
						</div>
					</div>
					<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-md border border-brand-border text-blue-600">
							<CreditCard className="w-4 h-4" />
						</div>
						<div>
							<span className="text-[10px] text-brand-muted font-bold block">VNPAY-QR</span>
							<span className="text-xs font-extrabold text-brand-dark">18.1%</span>
						</div>
					</div>
					<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-2.5">
						<div className="p-2 bg-white rounded-md border border-brand-border text-purple-600">
							<Wallet className="w-4 h-4" />
						</div>
						<div>
							<span className="text-[10px] text-brand-muted font-bold block">Ví Shop</span>
							<span className="text-xs font-extrabold text-brand-dark">7.2%</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ShopAnalyticsDashboard;
