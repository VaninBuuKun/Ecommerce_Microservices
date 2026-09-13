import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
	useAdminRevenueChartQuery,
	useAdminTopProductsQuery,
} from "@/domains/admin/hooks/useAdminAnalytics";
import {
	useSellerRevenueChartQuery,
	useSellerTopProductsQuery,
	useSellerOverviewQuery,
} from "@/domains/seller/hooks/useSellerAnalytics";
import { productApi } from "@/domains/catalog/api/productApi";
import {
	AnalyticsFilterBar,
	AnalyticsKpiCards,
	AnalyticsRevenueChart,
	AnalyticsOrderChart,
	AnalyticsProductPerformance,
	AnalyticsPaymentChannels,
	type PresetFilter,
	type FilterProductItem,
	type SearchProductResult,
	type ChartDataPoint,
	type ProductPerformanceItem,
} from "./analytics";

export interface ShopAnalyticsDashboardProps {
	shopId?: string | number | null;
	shopName?: string;
	isAdminView?: boolean;
	availableShops?: Array<{ id: string | number; name: string }>;
	onSelectShop?: (shopId: string | number | null) => void;
}

export function ShopAnalyticsDashboard({
	shopId,
	shopName = "Cửa hàng của tôi",
	isAdminView = false,
}: ShopAnalyticsDashboardProps) {
	const location = useLocation();
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// Bộ lọc thời gian: hôm nay, 3 ngày qua, 7 ngày qua, tự chỉnh
	const [preset, setPreset] = useState<PresetFilter>("week");
	const [selectedYear, setSelectedYear] = useState<number>(currentYear);
	const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
	const [isCustomReady, setIsCustomReady] = useState(false);

	// Lọc theo sản phẩm
	const [selectedProductId, setSelectedProductId] = useState<string>("all");
	const [customProducts, setCustomProducts] = useState<FilterProductItem[]>([]);

	// Tab hiệu suất sản phẩm: Doanh thu | Số đơn đặt | Số lượng bán
	const [productStatTab, setProductStatTab] = useState<"revenue" | "orders" | "sold">("revenue");

	// Hỗ trợ truyền productId qua URL query params (từ trang Quản lý sản phẩm)
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const paramPid = searchParams.get("productId")?.trim();
		if (paramPid) {
			setSelectedProductId(paramPid);
			productApi
				.getProductById(paramPid)
				.then((prod) => {
					if (prod && prod.id) {
						setCustomProducts((prev) => {
							if (prev.some((p) => p.id === String(prod.id))) return prev;
							return [
								{
									id: String(prod.id),
									name: prod.name,
									thumbnailUrl: prod.thumbnailUrl || (prod as any).imageUrl,
									revenue: 0,
									soldQuantity: (prod as any).sold || 0,
								},
								...prev,
							];
						});
					}
				})
				.catch(() => {
					setCustomProducts((prev) => {
						if (prev.some((p) => p.id === paramPid)) return prev;
						return [...prev, { id: paramPid, name: `Sản phẩm #${paramPid}`, revenue: 0, soldQuantity: 0 }];
					});
				});
		}
	}, [location.search]);

	// Chuẩn bị tham số query theo filter được chọn
	const chartQueryParams = useMemo(() => {
		if (preset === "today") return { period: "today" };
		if (preset === "3d") return { period: "3d" };
		if (preset === "week") return { period: "7d" };
		if (preset === "custom") {
			return { year: selectedYear, month: selectedMonth };
		}
		return { period: "7d" };
	}, [preset, selectedYear, selectedMonth]);

	const isSingleShopSelected = Boolean(shopId);
	const shouldFetchChart = preset !== "custom" || isCustomReady;

	// 1. Dữ liệu khi xem Shop cụ thể (Seller hoặc Admin chọn Shop)
	const { data: sellerChartRaw, isLoading: isSellerChartLoading } = useSellerRevenueChartQuery(
		shouldFetchChart ? (shopId || undefined) : undefined,
		shouldFetchChart ? chartQueryParams : undefined
	);
	const { data: sellerTopProducts = [], isLoading: isSellerTopLoading } = useSellerTopProductsQuery(
		shopId || undefined,
		25
	);
	const { data: sellerOverview } = useSellerOverviewQuery(shopId || undefined);

	// 2. Dữ liệu khi Admin xem Toàn Sàn (không chọn Shop nào)
	const { data: adminChartRaw, isLoading: isAdminChartLoading } = useAdminRevenueChartQuery(
		!isSingleShopSelected && isAdminView && shouldFetchChart ? chartQueryParams : undefined
	);
	const { data: adminTopProducts = [], isLoading: isAdminTopLoading } = useAdminTopProductsQuery(
		!isSingleShopSelected && isAdminView ? 25 : undefined
	);

	const isChartLoading = isSingleShopSelected ? isSellerChartLoading : isAdminChartLoading;
	const isTopProductsLoading = isSingleShopSelected ? isSellerTopLoading : isAdminTopLoading;

	// Chuẩn hóa dữ liệu biểu đồ
	const activeChartRaw = isSingleShopSelected ? sellerChartRaw : adminChartRaw;
	const activeTopProducts = isSingleShopSelected ? sellerTopProducts : adminTopProducts;

	const chartData: ChartDataPoint[] = useMemo(() => {
		if (!activeChartRaw?.points) return [];
		return activeChartRaw.points.map((p: any) => ({
			label: p.label || p.date,
			revenue: Number(p.revenue) || 0,
			orders: Number(p.orderCount) || 0,
			fullDate: p.date,
		}));
	}, [activeChartRaw]);

	// Danh sách Top 10 sản phẩm của shop
	const top10Products: FilterProductItem[] = useMemo(() => {
		return activeTopProducts.slice(0, 10).map((p: any) => ({
			id: String(p.productId || p.id),
			name: p.productName || p.name || `Sản phẩm #${p.productId || p.id}`,
			revenue: Number(p.revenue) || 0,
			soldQuantity: Number(p.soldQuantity) || 0,
			thumbnailUrl: p.thumbnailUrl,
		}));
	}, [activeTopProducts]);

	// Danh sách tổng hợp sản phẩm lọc
	const availableFilterProducts = useMemo(() => {
		const map = new Map<string, FilterProductItem>();
		top10Products.forEach((p) => map.set(p.id, p));
		customProducts.forEach((p) => {
			if (!map.has(p.id)) map.set(p.id, p);
		});
		return Array.from(map.values());
	}, [top10Products, customProducts]);

	// Sản phẩm đang được chọn
	const selectedProductStat = useMemo(() => {
		if (selectedProductId === "all") return null;
		return availableFilterProducts.find((p) => p.id === selectedProductId) || null;
	}, [selectedProductId, availableFilterProducts]);

	// Thêm sản phẩm từ ô tìm kiếm
	const handleAddCustomProduct = (item: SearchProductResult) => {
		setCustomProducts((prev) => {
			if (prev.some((p) => p.id === item.id)) return prev;
			return [
				{
					id: item.id,
					name: item.name,
					thumbnailUrl: item.thumbnailUrl,
					revenue: 0,
					soldQuantity: item.sold || 0,
				},
				...prev,
			];
		});
		setSelectedProductId(item.id);
		toast.success(`Đã thêm và lọc theo sản phẩm: ${item.name}`);
	};

	// Tính toán KPI Tổng Doanh Thu, Số Đơn, Đã Bán
	const totalRevenue = useMemo(() => {
		if (selectedProductStat) {
			return Number(selectedProductStat.revenue) || 0;
		}
		return chartData.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);
	}, [chartData, selectedProductStat]);

	const totalOrders = useMemo(() => {
		if (selectedProductStat) {
			return Math.max(1, Math.round((Number(selectedProductStat.soldQuantity) || 0) / 1.2));
		}
		return chartData.reduce((sum, p) => sum + (Number(p.orders) || 0), 0);
	}, [chartData, selectedProductStat]);

	const totalSoldUnits = useMemo(() => {
		if (selectedProductStat) {
			return Number(selectedProductStat.soldQuantity) || 0;
		}
		const topSum = activeTopProducts.reduce((sum: number, p: any) => sum + (Number(p.soldQuantity) || 0), 0);
		return Math.max(topSum, totalOrders);
	}, [activeTopProducts, totalOrders, selectedProductStat]);

	const avgDailyRevenue = useMemo(() => {
		const pointsCount = chartData.length || 1;
		return Math.round(totalRevenue / pointsCount);
	}, [totalRevenue, chartData]);

	// Danh sách xếp hạng hiệu suất từng món
	const productPerformanceList: ProductPerformanceItem[] = useMemo(() => {
		const isSpecific = selectedProductId !== "all";
		const prods = availableFilterProducts.filter((p) => !isSpecific || p.id === selectedProductId);

		const mapped = prods.map((p) => ({
			id: p.id,
			name: p.name,
			revenue: Number(p.revenue) || 0,
			orders: Math.max(1, Math.round((Number(p.soldQuantity) || 0) / 1.2)),
			sold: Number(p.soldQuantity) || 0,
			thumbnailUrl: p.thumbnailUrl,
		}));

		if (productStatTab === "revenue") {
			return [...mapped].sort((a, b) => b.revenue - a.revenue);
		}
		if (productStatTab === "orders") {
			return [...mapped].sort((a, b) => b.orders - a.orders);
		}
		return [...mapped].sort((a, b) => b.sold - a.sold);
	}, [availableFilterProducts, selectedProductId, productStatTab]);

	// Cấu hình kích thước SVG biểu đồ
	const svgWidth = 700;
	const svgHeight = 220;
	const paddingLeft = 55;
	const paddingRight = 20;
	const paddingTop = 15;
	const paddingBottom = 30;
	const plotWidth = svgWidth - paddingLeft - paddingRight;
	const plotHeight = svgHeight - paddingTop - paddingBottom;

	// Giá trị doanh thu lớn nhất cho trục Y
	const maxRevenue = useMemo(() => {
		const values = chartData.map((d) => d.revenue);
		const max = Math.max(...values, 100000);
		return Math.ceil(max / 100000) * 100000;
	}, [chartData]);

	// Tọa độ các điểm (x, y) trên SVG
	const coords = useMemo(() => {
		if (chartData.length === 0) return [];
		return chartData.map((d, i) => {
			const x =
				chartData.length === 1
					? paddingLeft + plotWidth / 2
					: paddingLeft + (i / (chartData.length - 1)) * plotWidth;
			const fraction = maxRevenue > 0 ? d.revenue / maxRevenue : 0;
			const y = paddingTop + plotHeight - fraction * plotHeight;
			return { x, y, point: d };
		});
	}, [chartData, maxRevenue, plotWidth, plotHeight]);

	// Đường cong Spline Bezier
	const splinePath = useMemo(() => {
		if (coords.length === 0) return "";
		if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

		let path = `M ${coords[0].x} ${coords[0].y}`;
		for (let i = 0; i < coords.length - 1; i++) {
			const curr = coords[i];
			const next = coords[i + 1];
			const prev = i > 0 ? coords[i - 1] : curr;
			const nextNext = i < coords.length - 2 ? coords[i + 2] : next;

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

	// Tiêu đề của Card biểu đồ
	const chartTitle = useMemo(() => {
		if (preset === "custom") {
			return `Doanh Thu Tháng ${selectedMonth}/${selectedYear}:`;
		}
		if (preset === "today") {
			return "Doanh Thu Hôm Nay:";
		}
		if (preset === "3d") {
			return "Doanh Thu 3 Ngày Qua:";
		}
		return "Doanh Thu 7 Ngày Qua:";
	}, [preset, selectedMonth, selectedYear]);

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-xl font-bold text-brand-dark mb-1">
						{isAdminView ? `Thống Kê Doanh Thu: ${shopName}` : "Báo Cáo Doanh Thu & Thống Kê"}
					</h1>
					<p className="text-xs text-brand-muted">
						{isAdminView
							? "Dữ liệu giám sát hiệu suất và biến động doanh số thời gian thực từ cơ sở dữ liệu"
							: "Theo dõi chi tiết tăng trưởng doanh số, số lượng đơn hàng và hiệu suất bán hàng"}
					</p>
				</div>
			</div>

			{/* 1. THANH BỘ LỌC (TÌM KIẾM TRÁI, BỘ LỌC PHẢI) */}
			<AnalyticsFilterBar
				preset={preset}
				onPresetChange={(newPreset) => {
					setPreset(newPreset);
					setIsCustomReady(newPreset !== "custom");
				}}
				selectedProductId={selectedProductId}
				onSelectProduct={(id) => setSelectedProductId(id)}
				selectedProductStat={selectedProductStat}
				top10Products={top10Products}
				customProducts={customProducts}
				onAddCustomProduct={handleAddCustomProduct}
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				onMonthChange={(m) => {
					setSelectedMonth(m);
					setIsCustomReady(false);
				}}
				onYearChange={(y) => {
					setSelectedYear(y);
					setIsCustomReady(false);
				}}
				isCustomReady={isCustomReady}
				onApplyCustom={() => setIsCustomReady(true)}
				shopId={shopId}
			/>

			{/* 2. 3 THẺ THÔNG SỐ KPI THEO MỐC THỜI GIAN ĐƯỢC CHỌN */}
			<AnalyticsKpiCards
				totalRevenue={totalRevenue}
				totalOrders={totalOrders}
				totalSoldUnits={totalSoldUnits}
				avgDailyRevenue={avgDailyRevenue}
				isChartLoading={isChartLoading}
				isTopProductsLoading={isTopProductsLoading}
				isCustomWaiting={preset === "custom" && !isCustomReady}
				todayOrders={isSingleShopSelected ? sellerOverview?.todayOrders : undefined}
			/>

			{/* 3. BIỂU ĐỒ DOANH THU SPLINE CURVE */}
			<AnalyticsRevenueChart
				preset={preset}
				chartTitle={chartTitle}
				totalRevenue={totalRevenue}
				selectedProductStat={selectedProductStat}
				selectedProductId={selectedProductId}
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				isCustomReady={isCustomReady}
				onApplyCustom={() => setIsCustomReady(true)}
				isChartLoading={isChartLoading}
				chartData={chartData}
				coords={coords}
				splinePath={splinePath}
				areaPath={areaPath}
				yTicks={yTicks}
				svgWidth={svgWidth}
				svgHeight={svgHeight}
				paddingLeft={paddingLeft}
				paddingRight={paddingRight}
				paddingTop={paddingTop}
				plotHeight={plotHeight}
			/>

			{/* 4. 2 BIỂU ĐỒ BỔ SUNG: SỐ ĐƠN ĐẶT HÀNG & HIỆU SUẤT TỪNG SẢN PHẨM */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<AnalyticsOrderChart
					chartData={chartData}
					totalOrders={totalOrders}
					isChartLoading={isChartLoading}
				/>
				<AnalyticsProductPerformance
					productPerformanceList={productPerformanceList}
					isTopProductsLoading={isTopProductsLoading}
					productStatTab={productStatTab}
					onTabChange={setProductStatTab}
				/>
			</div>

			{/* 5. KHỐI PHÂN BỔ PHƯƠNG THỨC THANH TOÁN */}
			<AnalyticsPaymentChannels />
		</div>
	);
}

export default ShopAnalyticsDashboard;
