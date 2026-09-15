import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
	ShoppingBag,
	Store,
	TrendingUp,
	ShieldAlert,
	Package,
	Wallet,
	CreditCard,
	Truck,
	DollarSign,
	Monitor,
	StoreIcon,
	Layers,
} from "lucide-react";
import {
	useAdminOverviewQuery,
	useAdminTopProductsQuery,
	useAdminProductDetailQuery,
	useAdminShopProductsQuery,
	useAdminCategoriesQuery,
} from "../hooks/useAdminAnalytics";
import { useAdminShopsQuery } from "../hooks/useAdmin";
import { useCategoriesQuery } from "@/domains/catalog";
import { ShopAnalyticsDashboard, AnalyticsProductPerformanceTable } from "@/domains/seller";
import {
	AdminAnalyticsFilterBar,
	AdminProductDeepDiveView,
	AdminCategoryPerformanceTable,
	type AdminAnalyticsMode,
	type PresetFilter,
} from "./analytics";
import { MoneyCollectFilled, MoneyCollectTwoTone } from "@ant-design/icons";

export function AdminOverviewView() {
	const [searchParams, setSearchParams] = useSearchParams();

	// 1. Quản lý Chế độ phân tích (Platform / Category / Shop / Product)
	const urlMode = (searchParams.get("mode") as AdminAnalyticsMode) || "platform";
	const mode: AdminAnalyticsMode =
		urlMode === "category" || urlMode === "shop" || urlMode === "product" ? urlMode : "platform";

	// 2. Quản lý Shop ID và Product ID từ URL
	const urlShopId = searchParams.get("shopId")?.trim() || "";
	const urlProductId = searchParams.get("productId")?.trim() || "";

	// 3. Quản lý Danh mục cha (cho Category mode)
	const urlCategory = searchParams.get("cat")?.trim() || "all";
	const [selectedParentCategory, setSelectedParentCategory] = useState<number | string>(
		urlCategory === "all" ? "all" : isNaN(Number(urlCategory)) ? "all" : Number(urlCategory)
	);

	// 4. Quản lý Mốc thời gian
	const urlPreset = (searchParams.get("preset") as PresetFilter) || "week";
	const [preset, setPreset] = useState<PresetFilter>(urlPreset);

	const now = new Date();
	const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
	const [isCustomReady, setIsCustomReady] = useState(false);

	// 5. Phân trang cho Top sản phẩm sàn (khi ở mode platform: 2 trang, mỗi trang 15 sản phẩm)
	const [platformProductPage, setPlatformProductPage] = useState<number>(1);

	// 5.1 Phân trang cho Top sản phẩm ngành hàng (khi ở mode category: 2 trang, mỗi trang 15 sản phẩm)
	const [categoryProductPage, setCategoryProductPage] = useState<number>(1);

	// 6. Phân trang cho sản phẩm của Shop (khi ở mode shop)
	const [shopProductPage, setShopProductPage] = useState<number>(1);

	// Queries
	const { data: overview, isLoading: isOverviewLoading } = useAdminOverviewQuery();
	const { data: shopsData, isLoading: isShopsLoading } = useAdminShopsQuery({ pageSize: 100 });
	const { data: catalogCategories = [] } = useCategoriesQuery();

	// Danh mục cha lấy trực tiếp từ API Catalog (CSDL)
	const categoryList = useMemo(() => {
		const parents = catalogCategories.filter((c: any) => !c.parentId);
		return parents.length > 0 ? parents : catalogCategories;
	}, [catalogCategories]);

	const availableCategories = useMemo(() => {
		return categoryList.map((c: any) => ({ id: c.id, name: c.name }));
	}, [categoryList]);

	// Tự động gán category mặc định nếu ở mode category nhưng chưa có ID
	const effectiveCategoryId = useMemo(() => {
		if (selectedParentCategory !== "all") return selectedParentCategory;
		return categoryList[0]?.id || "all";
	}, [selectedParentCategory, categoryList]);

	// Tự động gán danh mục cha đầu tiên vào URL khi mở chế độ category mà chưa chọn
	useEffect(() => {
		if (
			mode === "category" &&
			(selectedParentCategory === "all" || !selectedParentCategory) &&
			categoryList.length > 0
		) {
			const firstId = categoryList[0].id;
			setSelectedParentCategory(firstId);
			const next = new URLSearchParams(searchParams);
			next.set("cat", String(firstId));
			setSearchParams(next, { replace: true });
		}
	}, [mode, selectedParentCategory, categoryList, searchParams, setSearchParams]);

	// Tham số lọc cho Categories Query (cho Component thống kê ngành hàng)
	const categoriesParams = useMemo(() => {
		if (preset === "custom" && isCustomReady) {
			return { period: "custom", year: selectedYear, month: selectedMonth };
		}
		return { period: preset };
	}, [preset, isCustomReady, selectedYear, selectedMonth]);

	const { data: categoriesStats = [], isLoading: isCategoriesStatsLoading } = useAdminCategoriesQuery(categoriesParams);

	// Query Top 30 sản phẩm sàn (2 trang, mỗi trang 15)
	const { data: platformTopProductsData, isLoading: isTopProductsLoading } = useAdminTopProductsQuery({
		page: platformProductPage,
		pageSize: 15,
	});

	// Query Top 30 sản phẩm theo ngành hàng (2 trang, mỗi trang 15)
	const { data: categoryTopProductsData, isLoading: isCategoryProductsLoading } = useAdminTopProductsQuery({
		page: categoryProductPage,
		pageSize: 15,
		parentCategoryId: effectiveCategoryId !== "all" ? Number(effectiveCategoryId) : undefined,
	});

	// Query chi tiết 1 sản phẩm (khi ở mode product)
	const { data: productDetailData, isLoading: isProductDetailLoading } = useAdminProductDetailQuery(
		urlProductId || null,
		preset
	);

	// Query sản phẩm của 1 shop có phân trang (khi ở mode shop)
	const { data: shopProductsData, isLoading: isShopProductsLoading } = useAdminShopProductsQuery(
		urlShopId || null,
		shopProductPage,
		15
	);

	const availableShops = (shopsData?.items || []).map((s: any) => ({
		id: s.id,
		name: s.name || `Shop #${s.id}`,
	}));

	const currentShopName = urlShopId
		? availableShops.find((s) => String(s.id) === String(urlShopId))?.name || `Shop #${urlShopId}`
		: "Toàn Sàn";

	const selectedCategoryInfo = useMemo(() => {
		return categoryList.find((c: any) => String(c.id) === String(effectiveCategoryId)) || null;
	}, [categoryList, effectiveCategoryId]);

	const selectedCategoryName = selectedCategoryInfo?.name || (effectiveCategoryId !== "all" ? `Ngành hàng #${effectiveCategoryId}` : "Ngành hàng");

	const selectedCategoryStat = useMemo(() => {
		return categoriesStats.find((c: any) => String(c.categoryId) === String(effectiveCategoryId)) || null;
	}, [categoriesStats, effectiveCategoryId]);

	const totalShopsCount =
		typeof shopsData?.totalCount === "number"
			? shopsData.totalCount
			: (overview?.totalShops ?? 0);

	// Helper chuyển Mode
	const handleModeChange = (newMode: AdminAnalyticsMode) => {
		const next = new URLSearchParams(searchParams);
		next.set("mode", newMode);
		if (newMode === "platform") {
			next.delete("shopId");
			next.delete("productId");
			next.delete("cat");
		} else if (newMode === "category") {
			next.delete("shopId");
			next.delete("productId");
			if (!next.get("cat") || next.get("cat") === "all") {
				const firstCat = categoryList[0]?.id;
				if (firstCat) {
					next.set("cat", String(firstCat));
					setSelectedParentCategory(firstCat);
				}
			}
		} else if (newMode === "shop") {
			next.delete("productId");
			next.delete("cat");
		} else if (newMode === "product") {
			next.delete("shopId");
			next.delete("cat");
		}
		setSearchParams(next);
	};

	// Helper chọn nhanh category từ bảng thống kê
	const handleSelectCategory = (catId: number | string) => {
		setSelectedParentCategory(catId);
		setCategoryProductPage(1);
		const next = new URLSearchParams(searchParams);
		next.set("mode", "category");
		next.set("cat", String(catId));
		next.delete("shopId");
		next.delete("productId");
		setSearchParams(next);
	};

	// Helper áp dụng Shop ID
	const handleApplyShopId = (id: string) => {
		const next = new URLSearchParams(searchParams);
		next.set("mode", "shop");
		if (id) {
			next.set("shopId", id);
		} else {
			next.delete("shopId");
		}
		setShopProductPage(1);
		setSearchParams(next);
	};

	// Helper áp dụng bộ lọc Admin duy nhất (áp dụng chung cho cả Mode, Category/ShopId/ProductId và Mốc thời gian)
	const handleApplyAdminFilter = ({
		mode: appliedMode,
		categoryId,
		shopId,
		productId,
		preset: newPreset,
		month,
		year,
	}: {
		mode: AdminAnalyticsMode;
		categoryId?: number | string;
		shopId?: string;
		productId?: string;
		preset: PresetFilter;
		month: number;
		year: number;
	}) => {
		setPreset(newPreset);
		setSelectedMonth(month);
		setSelectedYear(year);
		setIsCustomReady(true);

		const next = new URLSearchParams(searchParams);
		next.set("mode", appliedMode);
		next.set("preset", newPreset);

		if (appliedMode === "platform") {
			setPlatformProductPage(1);
			next.delete("cat");
			next.delete("shopId");
			next.delete("productId");
		} else if (appliedMode === "category") {
			const cat = categoryId || effectiveCategoryId || categoryList[0]?.id;
			if (cat && cat !== "all") {
				setSelectedParentCategory(cat);
				next.set("cat", String(cat));
			} else {
				next.delete("cat");
			}
			setCategoryProductPage(1);
			next.delete("shopId");
			next.delete("productId");
		} else if (appliedMode === "shop") {
			setShopProductPage(1);
			if (shopId) next.set("shopId", shopId);
			else next.delete("shopId");
			next.delete("cat");
			next.delete("productId");
		} else if (appliedMode === "product") {
			if (productId) next.set("productId", productId);
			else next.delete("productId");
			next.delete("cat");
			next.delete("shopId");
		}

		setSearchParams(next);
	};

	// Helper áp dụng Product ID
	const handleApplyProductId = (id: string) => {
		const next = new URLSearchParams(searchParams);
		next.set("mode", "product");
		if (id) {
			next.set("productId", id);
		} else {
			next.delete("productId");
		}
		setSearchParams(next);
	};

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-4 font-black text-brand-dark uppercase tracking-wider">
						Tổng quan & Thống kê hệ thống
					</h1>
					<p className="text-[12px] text-brand-muted font-bold mt-0.5">
						Theo dõi toàn diện doanh thu sàn, cửa hàng, sản phẩm và dòng tiền vận chuyển thời gian thực
					</p>
				</div>
				<span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-md flex items-center gap-1.5 shadow-2xs">
					<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
					Hệ thống trực tuyến
				</span>
			</div>

			{/* 4 Thẻ KPI Tổng Thể Toàn Hệ Thống */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 1. Tổng GMV */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng GMV Toàn Sàn
						</span>
						<div className="w-8 h-8 rounded-md bg-brand-light-soft text-brand-primary-deep flex items-center justify-center border border-brand-border">
							<MoneyCollectTwoTone className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isOverviewLoading ? "..." : (overview?.totalGmv || 0).toLocaleString("vi-VN")} đ
					</div>
					<p className="text-[10px] text-brand-muted font-bold">
						Doanh thu sàn: {isOverviewLoading ? "..." : (overview?.netPlatformRevenue || 0).toLocaleString("vi-VN")} đ
					</p>
				</div>

				{/* 2. Tổng Đơn Hàng */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Đơn Hàng
						</span>
						<div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
							<ShoppingBag className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isOverviewLoading ? "..." : (overview?.totalOrders || 0).toLocaleString("vi-VN")} đơn
					</div>
					<p className="text-[10px] text-brand-muted font-bold">
						Hôm nay: +{overview?.todayNewOrders || 0} đơn mới
					</p>
				</div>

				{/* 3. Tổng Số Shop */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Tổng Cửa Hàng
						</span>
						<div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
							<StoreIcon className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-brand-dark">
						{isShopsLoading ? "..." : totalShopsCount.toLocaleString("vi-VN")} shop
					</div>
					<p className="text-[10px] text-purple-600 font-bold">
						Người bán đang hoạt động
					</p>
				</div>

				{/* 4. Phí Vận Chuyển Đối Soát GHN */}
				<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-1.5">
					<div className="flex items-center justify-between text-brand-muted">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Phí Ship Đối Soát GHN
						</span>
						<div className="w-8 h-8 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
							<Truck className="w-4 h-4" />
						</div>
					</div>
					<div className="text-xl font-black text-orange-600">
						{isOverviewLoading
							? "..."
							: (overview?.totalShippingFee || 0).toLocaleString("vi-VN")}{" "}
						đ
					</div>
					<p className="text-[10px] text-orange-700 font-bold">
						Thu hộ trả đối tác vận chuyển
					</p>
				</div>
			</div>

			{/* THANH BỘ LỌC ADMIN 2 TẦNG (3 CHẾ ĐỘ: SÀN / SHOP / SẢN PHẨM) */}
			<AdminAnalyticsFilterBar
				mode={mode}
				onModeChange={handleModeChange}
				preset={preset}
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				selectedParentCategoryId={selectedParentCategory}
				categories={availableCategories}
				activeShopId={urlShopId}
				activeProductId={urlProductId}
				onApply={handleApplyAdminFilter}
			/>

			{/* NỘI DUNG CHÍNH RENDER THEO CHẾ ĐỘ ĐANG CHỌN */}

			{/* CHẾ ĐỘ 1: PHÂN TÍCH TOÀN SÀN (MẶC ĐỊNH) */}
			{mode === "platform" && (
				<div className="space-y-6">
					{/* Dashboard Toàn Sàn (Doanh thu sàn, Spline chart, Order chart) */}
					<ShopAnalyticsDashboard
						shopId={null}
						shopName="Toàn Sàn"
						isAdminView={true}
						controlledPreset={preset}
						controlledMonth={selectedMonth}
						controlledYear={selectedYear}
						hideFilterBar={true}
					/>

					{/* BẢNG THỐNG KÊ HIỆU SUẤT THEO NGÀNH HÀNG (CACHE CATE, ẢNH, TÊN, ID, ĐÃ BÁN, DOANH THU, TỶ TRỌNG) */}
					<AdminCategoryPerformanceTable
						categoriesStats={categoriesStats}
						isLoading={isCategoriesStatsLoading}
						onSelectCategory={handleSelectCategory}
					/>

					{/* BẢNG TOP 30 SẢN PHẨM BÁN CHẠY TOÀN SÀN (2 TRANG, MỖI TRANG 15 SẢN PHẨM) */}
					<AnalyticsProductPerformanceTable
						products={(platformTopProductsData?.items || []).map((p: any) => ({
							id: String(p.id || p.productId),
							name: (p.name && p.name.trim()) || p.productName || `Sản phẩm #${p.id || p.productId}`,
							thumbnailUrl: p.thumbnailUrl,
							parentCategoryId: p.parentCategoryId,
							soldQuantity: Number(p.soldQuantity) || 0,
							revenue: Number(p.revenue) || 0,
						}))}
						isLoading={isTopProductsLoading}
						title="Top 30 Sản Phẩm Bán Chạy Nhất Toàn Sàn"
						subtitle="Tổng hợp 30 sản phẩm tạo doanh thu & số lượng bán lớn nhất toàn sàn (2 trang, mỗi trang 15 sản phẩm)"
						page={platformProductPage}
						pageSize={15}
						totalCount={platformTopProductsData?.totalCount ?? 30}
						totalPages={platformTopProductsData?.totalPages ?? 2}
						onPageChange={(p) => setPlatformProductPage(p)}
						onSelectProduct={(pId) => handleApplyProductId(pId)}
					/>
				</div>
			)}

			{/* CHẾ ĐỘ 2: PHÂN TÍCH NGÀNH HÀNG / DANH MỤC */}
			{mode === "category" && (
				<div className="space-y-6">
					{/* Thẻ tóm tắt thông tin ngành hàng đã chọn */}
					<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 rounded-lg border border-brand-border bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
								{selectedCategoryInfo?.iconUrl || selectedCategoryInfo?.imageUrl ? (
									<img
										src={selectedCategoryInfo.iconUrl || selectedCategoryInfo.imageUrl}
										alt={selectedCategoryName}
										className="w-full h-full object-cover"
										onError={(e) => {
											(e.target as HTMLElement).style.display = "none";
										}}
									/>
								) : (
									<Layers className="w-7 h-7 text-emerald-600" />
								)}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-base font-black text-brand-dark">
										{selectedCategoryName}
									</h2>
									<span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
										Mã ngành: #{effectiveCategoryId}
									</span>
								</div>
								<p className="text-xs text-brand-muted font-bold mt-1">
									Số liệu thống kê chi tiết của ngành hàng trong mốc thời gian đã chọn
								</p>
							</div>
						</div>

						{/* Số liệu tóm tắt nhanh của ngành hàng */}
						<div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-brand-border/60 pt-3 md:pt-0 md:pl-6 text-xs">
							<div>
								<span className="text-slate-400 font-medium block text-[11px]">Đã bán trong kỳ</span>
								<span className="text-base font-black text-brand-dark">
									{isCategoriesStatsLoading
										? "..."
										: (selectedCategoryStat?.soldQuantity || 0).toLocaleString("vi-VN")}{" "}
									<span className="text-xs font-bold text-slate-500">cái</span>
								</span>
							</div>

							<div>
								<span className="text-slate-400 font-medium block text-[11px]">Doanh thu ngành</span>
								<span className="text-base font-black text-emerald-700">
									{isCategoriesStatsLoading
										? "..."
										: (selectedCategoryStat?.revenue || 0).toLocaleString("vi-VN")}{" "}
									<span className="text-xs font-bold">đ</span>
								</span>
							</div>

							<div>
								<span className="text-slate-400 font-medium block text-[11px]">Tỷ trọng toàn sàn</span>
								<span className="text-base font-black text-blue-700">
									{isCategoriesStatsLoading
										? "..."
										: `${selectedCategoryStat?.percentage || 0}%`}
								</span>
							</div>
						</div>
					</div>

					{/* BẢNG TOP 30 SẢN PHẨM BÁN CHẠY CỦA NGÀNH HÀNG NÀY (2 TRANG, MỖI TRANG 15 SẢN PHẨM) */}
					<AnalyticsProductPerformanceTable
						products={(categoryTopProductsData?.items || []).map((p: any) => ({
							id: String(p.id || p.productId),
							name: (p.name && p.name.trim()) || p.productName || `Sản phẩm #${p.id || p.productId}`,
							thumbnailUrl: p.thumbnailUrl,
							parentCategoryId: p.parentCategoryId,
							soldQuantity: Number(p.soldQuantity) || 0,
							revenue: Number(p.revenue) || 0,
						}))}
						isLoading={isCategoryProductsLoading}
						title={`Top 30 Sản Phẩm Bán Chạy - ${selectedCategoryName}`}
						subtitle={`Tổng hợp 30 sản phẩm có doanh thu & sản lượng cao nhất thuộc ngành hàng ${selectedCategoryName} (2 trang, mỗi trang 15 sản phẩm)`}
						page={categoryProductPage}
						pageSize={15}
						totalCount={categoryTopProductsData?.totalCount ?? 30}
						totalPages={categoryTopProductsData?.totalPages ?? 2}
						onPageChange={(p) => setCategoryProductPage(p)}
						onSelectProduct={(pId) => handleApplyProductId(pId)}
					/>
				</div>
			)}

			{/* CHẾ ĐỘ 2: PHÂN TÍCH MỘT SHOP CỤ THỂ */}
			{mode === "shop" && (
				<div className="space-y-6">
					{urlShopId ? (
						<>
							{/* Dashboard của Shop */}
							<ShopAnalyticsDashboard
								shopId={urlShopId}
								shopName={currentShopName}
								isAdminView={true}
								controlledPreset={preset}
								controlledMonth={selectedMonth}
								controlledYear={selectedYear}
								hideFilterBar={true}
							/>

							{/* DANH SÁCH SẢN PHẨM CỦA SHOP CÓ PHÂN TRANG */}
							<AnalyticsProductPerformanceTable
								products={(shopProductsData?.items || []).map((p: any) => ({
									id: String(p.id || p.productId),
									name: (p.name && p.name.trim()) || p.productName || `Sản phẩm #${p.id || p.productId}`,
									thumbnailUrl: p.thumbnailUrl,
									parentCategoryId: p.parentCategoryId,
									soldQuantity: Number(p.soldQuantity) || 0,
									revenue: Number(p.revenue) || 0,
								}))}
								isLoading={isShopProductsLoading}
								title={`Danh Sách Sản Phẩm - ${currentShopName}`}
								subtitle="Hiệu suất bán hàng chi tiết của các mặt hàng thuộc cửa hàng này"
								page={shopProductPage}
								pageSize={15}
								totalCount={shopProductsData?.totalCount}
								totalPages={shopProductsData?.totalPages || 1}
								onPageChange={(p) => setShopProductPage(p)}
								onSelectProduct={(pId) => handleApplyProductId(pId)}
							/>
						</>
					) : (
						<div className="bg-white border border-brand-border rounded-md p-12 text-center shadow-xs space-y-3">
							<Store className="w-12 h-12 text-purple-300 mx-auto" />
							<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">
								Chưa chọn mã cửa hàng
							</h3>
							<p className="text-xs text-brand-muted max-w-md mx-auto">
								Vui lòng nhập chính xác mã Shop ID vào ô tìm kiếm ở thanh bộ lọc phía trên để tải toàn bộ số liệu và báo cáo riêng của cửa hàng.
							</p>
						</div>
					)}
				</div>
			)}

			{/* CHẾ ĐỘ 3: PHÂN TÍCH MỘT SẢN PHẨM CHUYÊN SÂU */}
			{mode === "product" && (
				<div className="space-y-6">
					{urlProductId ? (
						<AdminProductDeepDiveView
							data={productDetailData}
							isLoading={isProductDetailLoading}
							productId={urlProductId}
						/>
					) : (
						<div className="bg-white border border-brand-border rounded-md p-12 text-center shadow-xs space-y-3">
							<Package className="w-12 h-12 text-amber-300 mx-auto" />
							<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">
								Chưa chọn sản phẩm
							</h3>
							<p className="text-xs text-brand-muted max-w-md mx-auto">
								Vui lòng dán đường dẫn URL sản phẩm hoặc nhập trực tiếp mã Product ID vào ô tìm kiếm phía trên để soi chi tiết hiệu suất bán hàng.
							</p>
						</div>
					)}
				</div>
			)}

			{/* Lối Tắt Quản Trị Hệ Thống Nhanh */}
			<div className="border border-brand-border bg-white rounded-md p-4 shadow-xs space-y-3">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider border-b border-brand-border/60 pb-2">
					Lối Tắt Quản Trị Hệ Thống Nhanh
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<Link
						to="/admin/kyc"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<ShieldAlert className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Duyệt KYC</span>
							<span className="text-[10px] text-brand-muted font-bold">Hồ sơ người bán</span>
						</div>
					</Link>

					<Link
						to="/admin/products"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<Package className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Kho Hàng Toàn Sàn</span>
							<span className="text-[10px] text-brand-muted font-bold">Kiểm duyệt sản phẩm</span>
						</div>
					</Link>

					<Link
						to="/admin/wallets"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<Wallet className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Ví Tiền & Quyết Toán</span>
							<span className="text-[10px] text-brand-muted font-bold">Số dư hệ thống</span>
						</div>
					</Link>

					<Link
						to="/admin/payment-methods"
						className="p-3 border border-brand-border hover:border-brand-primary rounded-md flex items-center gap-2.5 hover:bg-brand-primary/5 transition-colors group"
					>
						<div className="p-2 bg-brand-light-soft rounded-md text-brand-primary-deep group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors">
							<CreditCard className="w-4 h-4" />
						</div>
						<div>
							<span className="text-xs font-bold text-brand-dark block">Cổng Thanh Toán</span>
							<span className="text-[10px] text-brand-muted font-bold">Cấu hình thanh toán</span>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default AdminOverviewView;
