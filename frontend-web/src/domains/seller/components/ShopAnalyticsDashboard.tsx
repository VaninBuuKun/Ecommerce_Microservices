import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { toast } from "react-toastify";
import {
	useAdminRevenueChartQuery,
	useAdminTopProductsQuery,
	useAdminProductDetailQuery,
	AdminProductDeepDiveView,
} from "@/domains/admin";
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
	AnalyticsProductPerformanceTable,
	type PresetFilter,
	type SellerAnalyticsMode,
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
	controlledPreset?: PresetFilter;
	controlledMonth?: number;
	controlledYear?: number;
	hideFilterBar?: boolean;
}

export function ShopAnalyticsDashboard({
	shopId,
	shopName = "Cửa hàng của tôi",
	isAdminView = false,
	controlledPreset,
	controlledMonth,
	controlledYear,
	hideFilterBar = false,
}: ShopAnalyticsDashboardProps) {
	const location = useLocation();
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// Chế độ xem: Phân tích cửa hàng ("shop") hoặc Phân tích một sản phẩm ("product")
	const [sellerMode, setSellerMode] = useState<SellerAnalyticsMode>("shop");
	const [appliedProductId, setAppliedProductId] = useState<string>("");

	// Bộ lọc thời gian: hôm nay, 3 ngày qua, 7 ngày qua, tự chỉnh
	const [preset, setPreset] = useState<PresetFilter>("week");
	const [selectedYear, setSelectedYear] = useState<number>(currentYear);
	const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
	const [isCustomReady, setIsCustomReady] = useState(false);

	const effectivePreset = controlledPreset || preset;
	const effectiveMonth = controlledMonth || selectedMonth;
	const effectiveYear = controlledYear || selectedYear;

	// Lọc theo sản phẩm
	const [selectedProductId, setSelectedProductId] = useState<string>("all");
	const [customProducts, setCustomProducts] = useState<FilterProductItem[]>([]);

	// Hỗ trợ truyền productId qua URL query params (từ trang Quản lý sản phẩm)
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const paramPid = searchParams.get("productId")?.trim();
		if (paramPid) {
			setSellerMode("product");
			setAppliedProductId(paramPid);
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

	// Callback duy nhất khi bấm nút "Áp dụng" trên FilterBar của Seller
	const handleApplySellerFilter = ({
		mode: newMode,
		productId,
		preset: newPreset,
		month,
		year,
	}: {
		mode: SellerAnalyticsMode;
		productId?: string;
		preset: PresetFilter;
		month: number;
		year: number;
	}) => {
		setSellerMode(newMode);
		setPreset(newPreset);
		setSelectedMonth(month);
		setSelectedYear(year);
		setIsCustomReady(true);
		setAppliedProductId(productId || "");
		if (productId) {
			setSelectedProductId(productId);
		}
	};

	// Chuẩn bị tham số query theo filter được chọn
	const chartQueryParams = useMemo(() => {
		if (effectivePreset === "today") return { period: "today" };
		if (effectivePreset === "3d") return { period: "3d" };
		if (effectivePreset === "week") return { period: "7d" };
		if (effectivePreset === "custom") {
			return { year: effectiveYear, month: effectiveMonth };
		}
		return { period: "7d" };
	}, [effectivePreset, effectiveYear, effectiveMonth]);

	const isSingleShopSelected = Boolean(shopId);
	const shouldFetchChart =
		sellerMode === "shop" &&
		(effectivePreset !== "custom" || (controlledPreset ? true : isCustomReady));

	// Phân trang sản phẩm bán chạy của Seller (2 trang, mỗi trang 15 sản phẩm)
	const [sellerProductPage, setSellerProductPage] = useState<number>(1);

	// 1. Dữ liệu khi xem Shop cụ thể (Seller hoặc Admin chọn Shop)
	const { data: sellerChartRaw, isLoading: isSellerChartLoading } = useSellerRevenueChartQuery(
		shouldFetchChart ? (shopId || undefined) : undefined,
		shouldFetchChart ? chartQueryParams : undefined
	);
	const { data: sellerTopProducts = [], isLoading: isSellerTopLoading } = useSellerTopProductsQuery(
		sellerMode === "shop" ? (shopId || undefined) : undefined,
		30
	);
	const { data: sellerOverview } = useSellerOverviewQuery(
		sellerMode === "shop" ? (shopId || undefined) : undefined
	);

	// 2. Dữ liệu khi Admin xem Toàn Sàn (không chọn Shop nào)
	const { data: adminChartRaw, isLoading: isAdminChartLoading } = useAdminRevenueChartQuery(
		!isSingleShopSelected && isAdminView && shouldFetchChart ? chartQueryParams : undefined
	);
	const { data: adminTopProductsData, isLoading: isAdminTopLoading } = useAdminTopProductsQuery(
		!isSingleShopSelected && isAdminView ? { limit: 25 } : undefined
	);

	// 3. Dữ liệu khi xem Phân tích 1 Sản phẩm (chế độ "product" cho Seller)
	const { data: productDetailData, isLoading: isProductDetailLoading } = useAdminProductDetailQuery(
		sellerMode === "product" && appliedProductId ? appliedProductId : null,
		effectivePreset === "custom" ? "custom" : effectivePreset
	);

	const isChartLoading = isSingleShopSelected ? isSellerChartLoading : isAdminChartLoading;
	const isTopProductsLoading = isSingleShopSelected ? isSellerTopLoading : isAdminTopLoading;

	// Chuẩn hóa dữ liệu biểu đồ
	const activeChartRaw = isSingleShopSelected ? sellerChartRaw : adminChartRaw;
	
	// Chuẩn hóa danh sách top products thành array an toàn (bất kể sellerTopProducts dạng mảng hay adminTopProductsData dạng PaginatedProductsData { items: [...] })
	const activeTopProducts: any[] = useMemo(() => {
		if (isSingleShopSelected) {
			return Array.isArray(sellerTopProducts) ? sellerTopProducts : [];
		}
		if (adminTopProductsData && Array.isArray((adminTopProductsData as any).items)) {
			return (adminTopProductsData as any).items;
		}
		if (Array.isArray(adminTopProductsData)) {
			return adminTopProductsData;
		}
		return [];
	}, [isSingleShopSelected, sellerTopProducts, adminTopProductsData]);

	// Danh sách Top 10 sản phẩm của shop
	const top10Products: FilterProductItem[] = useMemo(() => {
		if (!Array.isArray(activeTopProducts)) return [];
		return activeTopProducts.slice(0, 10).map((p: any) => ({
			id: String(p.productId || p.id),
			name: p.productName || p.name || `Sản phẩm #${p.productId || p.id}`,
			revenue: Number(p.revenue) || 0,
			soldQuantity: Number(p.soldQuantity) || 0,
			thumbnailUrl: p.thumbnailUrl,
			parentCategoryId: p.parentCategoryId ? Number(p.parentCategoryId) : undefined,
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

	const chartData: ChartDataPoint[] = useMemo(() => {
		const rawPoints: any[] = Array.isArray(activeChartRaw)
			? activeChartRaw
			: Array.isArray((activeChartRaw as any)?.points)
				? (activeChartRaw as any).points
				: [];

		if (rawPoints.length === 0) return [];

		return rawPoints.map((p: any) => {
			const rawDate = String(p.date || "");
			let shortLabel = p.label;
			if (!shortLabel && rawDate) {
				const parts = rawDate.split("-");
				shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : rawDate;
			}

			if (selectedProductStat) {
				const prodSold = Number(selectedProductStat.soldQuantity) || 0;
				const prodRev = Number(selectedProductStat.revenue) || 0;
				if (prodSold === 0 && prodRev === 0) {
					return {
						label: shortLabel || rawDate,
						revenue: 0,
						orders: 0,
						fullDate: rawDate,
					};
				}
				const shopTotalRev = rawPoints.reduce((s: number, x: any) => s + (Number(x.revenue) || 0), 0);
				const ratio = shopTotalRev > 0 ? Math.min(1, prodRev / shopTotalRev) : 1;
				return {
					label: shortLabel || rawDate,
					revenue: Math.round((Number(p.revenue) || 0) * ratio),
					orders: (Number(p.orderCount) || 0) > 0 && ratio > 0 ? Math.max(1, Math.round((Number(p.orderCount) || 0) * ratio)) : 0,
					fullDate: rawDate,
				};
			}
			return {
				label: shortLabel || rawDate,
				revenue: Number(p.revenue) || 0,
				orders: Number(p.orderCount) || 0,
				fullDate: rawDate,
			};
		});
	}, [activeChartRaw, selectedProductStat]);

	// Tính toán KPI Tổng Doanh Thu, Số Đơn, Đã Bán (Đồng nhất dữ liệu kỳ lọc và sản phẩm giữa FE & BE)
	const totalRevenue = useMemo(() => {
		if (selectedProductStat) {
			return Number(selectedProductStat.revenue) || 0;
		}
		return chartData.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);
	}, [chartData, selectedProductStat]);

	const totalOrders = useMemo(() => {
		if (selectedProductStat) {
			const sold = Number(selectedProductStat.soldQuantity) || 0;
			return sold > 0 ? Math.max(1, Math.round(sold / 1.2)) : 0;
		}
		return chartData.reduce((sum, p) => sum + (Number(p.orders) || 0), 0);
	}, [chartData, selectedProductStat]);

	const totalSoldUnits = useMemo(() => {
		if (selectedProductStat) {
			return Number(selectedProductStat.soldQuantity) || 0;
		}
		// Khi xem tất cả sản phẩm: nếu kỳ lọc hiện tại không có đơn nào (0 đơn), số sản phẩm bán trong kỳ bắt buộc phải là 0
		if (totalOrders === 0) {
			return 0;
		}
		if (!Array.isArray(activeTopProducts)) {
			return 0;
		}
		const topSum = activeTopProducts.reduce((sum: number, p: any) => sum + (Number(p.soldQuantity) || 0), 0);
		return Math.max(totalOrders, topSum);
	}, [activeTopProducts, totalOrders, selectedProductStat]);

	const avgDailyRevenue = useMemo(() => {
		const pointsCount = chartData.length || 1;
		return Math.round(totalRevenue / pointsCount);
	}, [totalRevenue, chartData]);

	// Danh sách xếp hạng hiệu suất từng món
	const productPerformanceList: (ProductPerformanceItem & { parentCategoryId?: number })[] = useMemo(() => {
		const isSpecific = selectedProductId !== "all";
		const prods = availableFilterProducts.filter((p) => !isSpecific || p.id === selectedProductId);

		const mapped = prods.map((p) => {
			const sold = Number(p.soldQuantity) || 0;
			// Khi sản phẩm chưa có dữ liệu bán (sold === 0), số đơn đặt hàng bằng 0
			const orders = sold > 0 ? Math.max(1, Math.round(sold / 1.2)) : 0;

			return {
				id: p.id,
				name: p.name,
				revenue: Number(p.revenue) || 0,
				orders,
				sold,
				thumbnailUrl: p.thumbnailUrl,
				parentCategoryId: (p as any).parentCategoryId,
			};
		});

		return [...mapped].sort((a, b) => b.sold - a.sold || b.revenue - a.revenue);
	}, [availableFilterProducts, selectedProductId]);

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
		if (effectivePreset === "custom") {
			return `Doanh Thu Tháng ${effectiveMonth}/${effectiveYear}:`;
		}
		if (effectivePreset === "today") {
			return "Doanh Thu Hôm Nay:";
		}
		if (effectivePreset === "3d") {
			return "Doanh Thu 3 Ngày Qua:";
		}
		return "Doanh Thu 7 Ngày Qua:";
	}, [effectivePreset, effectiveMonth, effectiveYear]);

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-4 font-black text-brand-dark uppercase tracking-wider">
						{isAdminView ? `Thống kê doanh thu: ${shopName}` : "Báo cáo doanh thu & thống kê"}
					</h1>
					<p className="text-[12px] text-brand-muted font-bold mt-0.5">
						{isAdminView
							? "Dữ liệu giám sát hiệu suất và biến động doanh số thời gian thực từ cơ sở dữ liệu"
							: "Theo dõi chi tiết tăng trưởng doanh số, số lượng đơn hàng và hiệu suất bán hàng"}
					</p>
				</div>
			</div>

			{/* 1. THANH BỘ LỌC (ẨN KHI ĐƯỢC ĐIỀU KHIỂN TỪ BÊN NGOÀI BỞI ADMIN) */}
			{!hideFilterBar && (
				<AnalyticsFilterBar
					mode={sellerMode}
					onModeChange={(newMode) => {
						setSellerMode(newMode);
					}}
					preset={preset}
					selectedMonth={selectedMonth}
					selectedYear={selectedYear}
					activeProductId={appliedProductId}
					onApply={handleApplySellerFilter}
					shopId={shopId}
				/>
			)}

			{/* NỘI DUNG HIỂN THỊ THEO CHẾ ĐỘ SELLER */}
			{sellerMode === "product" ? (
				appliedProductId ? (
					<AdminProductDeepDiveView
						data={productDetailData}
						isLoading={isProductDetailLoading}
						productId={appliedProductId}
					/>
				) : (
					<div className="bg-white border border-brand-border rounded-md p-12 text-center shadow-xs space-y-3">
						<Package className="w-12 h-12 text-amber-400 mx-auto" />
						<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">
							Chưa chọn sản phẩm để phân tích
						</h3>
						<p className="text-xs text-brand-muted max-w-md mx-auto">
							Vui lòng nhập mã ID sản phẩm của cửa hàng và chọn mốc thời gian ở thanh bộ lọc phía trên, sau đó nhấn <strong className="text-brand-dark">Áp dụng</strong> để xem báo cáo chi tiết.
						</p>
					</div>
				)
			) : (
				<>
					{/* 2. 3 THẺ THÔNG SỐ KPI THEO MỐC THỜI GIAN ĐƯỢC CHỌN */}
					<AnalyticsKpiCards
						totalRevenue={totalRevenue}
						totalOrders={totalOrders}
						totalSoldUnits={totalSoldUnits}
						avgDailyRevenue={avgDailyRevenue}
						isChartLoading={isChartLoading}
						isTopProductsLoading={isTopProductsLoading}
						isCustomWaiting={effectivePreset === "custom" && !isCustomReady && !controlledPreset}
						todayOrders={isSingleShopSelected ? sellerOverview?.todayOrders : undefined}
					/>

					{/* 3. BIỂU ĐỒ DOANH THU SPLINE CURVE */}
					<AnalyticsRevenueChart
						preset={effectivePreset}
						chartTitle={chartTitle}
						totalRevenue={totalRevenue}
						selectedProductStat={selectedProductStat}
						selectedProductId={selectedProductId}
						selectedMonth={effectiveMonth}
						selectedYear={effectiveYear}
						isCustomReady={controlledPreset ? true : isCustomReady}
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

					{/* 4. THỐNG KÊ SỐ ĐƠN ĐẶT HÀNG (HÀNG RIÊNG FULL-WIDTH VỚI 3 TRẠNG THÁI THỰC TẾ) */}
					<AnalyticsOrderChart
						chartData={chartData}
						totalOrders={totalOrders}
						isChartLoading={isChartLoading}
						completedOrders={sellerOverview?.completedOrders}
						refundedOrders={sellerOverview?.refundedOrders}
						refundAmount={sellerOverview?.refundAmount}
						cancelledOrders={sellerOverview?.cancelledOrders}
					/>

					{/* 5. HIỆU SUẤT TỪNG MÓN HÀNG DẠNG TABLE TOP 30 (2 TRANG, MỖI TRANG 15 SẢN PHẨM) */}
					{!isAdminView && (() => {
						const sellerTop30 = productPerformanceList.slice(0, 30);
						const pagedProducts = sellerTop30.slice((sellerProductPage - 1) * 15, sellerProductPage * 15);
						return (
							<AnalyticsProductPerformanceTable
								products={pagedProducts.map((p) => ({
									id: String(p.id),
									name: (p.name && p.name.trim()) || `Sản phẩm #${p.id}`,
									thumbnailUrl: p.thumbnailUrl,
									soldQuantity: Number(p.sold) || 0,
									revenue: Number(p.revenue) || 0,
									parentCategoryId: (p as any).parentCategoryId,
								}))}
								isLoading={isTopProductsLoading}
								title="Top 30 Sản Phẩm Bán Chạy Nhất"
								subtitle="Xếp hạng chi tiết doanh thu và số lượng tiêu thụ (Hiển thị 15 sản phẩm/trang, tối đa 2 trang)"
								page={sellerProductPage}
								pageSize={15}
								totalCount={sellerTop30.length}
								totalPages={Math.max(1, Math.ceil(sellerTop30.length / 15))}
								onPageChange={(p) => setSellerProductPage(p)}
							/>
						);
					})()}
				</>
			)}
		</div>
	);
}

export default ShopAnalyticsDashboard;
