import { useState, useEffect, useRef } from "react";
import {
	Search,
	Loader2,
	X,
	Plus,
	Calendar,
	Filter,
	ChevronDown,
	Check,
	Package,
} from "lucide-react";
import { productApi } from "@/domains/catalog/api/productApi";

export type PresetFilter = "today" | "3d" | "week" | "custom";

export interface FilterProductItem {
	id: string;
	name: string;
	revenue: number;
	soldQuantity: number;
	thumbnailUrl?: string;
}

export interface SearchProductResult {
	id: string;
	name: string;
	thumbnailUrl?: string;
	price?: number;
	sold?: number;
}

interface AnalyticsFilterBarProps {
	preset: PresetFilter;
	onPresetChange: (preset: PresetFilter) => void;
	selectedProductId: string;
	onSelectProduct: (productId: string) => void;
	selectedProductStat: FilterProductItem | null;
	top10Products: FilterProductItem[];
	customProducts: FilterProductItem[];
	onAddCustomProduct: (item: SearchProductResult) => void;
	selectedMonth: number;
	selectedYear: number;
	onMonthChange: (month: number) => void;
	onYearChange: (year: number) => void;
	isCustomReady: boolean;
	onApplyCustom: () => void;
	shopId?: string | number | null;
}

export function AnalyticsFilterBar({
	preset,
	onPresetChange,
	selectedProductId,
	onSelectProduct,
	selectedProductStat,
	top10Products,
	customProducts,
	onAddCustomProduct,
	selectedMonth,
	selectedYear,
	onMonthChange,
	onYearChange,
	isCustomReady,
	onApplyCustom,
	shopId,
}: AnalyticsFilterBarProps) {
	const currentYear = new Date().getFullYear();

	// Dropdown chọn sản phẩm
	const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
	const productDropdownRef = useRef<HTMLDivElement>(null);

	// Tìm kiếm sản phẩm từ CSDL bên trái (Debounce 300ms)
	const [searchKeyword, setSearchKeyword] = useState("");
	const [debouncedKeyword, setDebouncedKeyword] = useState("");
	const [searchResults, setSearchResults] = useState<SearchProductResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	// Debounce từ khóa tìm kiếm
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedKeyword(searchKeyword.trim());
		}, 300);
		return () => clearTimeout(timer);
	}, [searchKeyword]);

	// Gọi API CSDL khi debouncedKeyword thay đổi (so sánh lowercase)
	useEffect(() => {
		const lowerKeyword = debouncedKeyword.toLowerCase().trim();
		if (!lowerKeyword) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		let isCancelled = false;
		const fetchDbProducts = async () => {
			setIsSearching(true);
			try {
				let items: any[] = [];
				if (shopId) {
					const res = await productApi.getMyProducts({
						shopId: Number(shopId),
						searchTerm: lowerKeyword,
						pageSize: 8,
					});
					items = Array.isArray(res) ? res : res?.items || [];
				} else {
					const res = await productApi.getProducts({
						searchTerm: lowerKeyword,
						pageSize: 8,
					});
					items = res?.items || [];
				}

				if (items.length === 0 && (/^\d+$/.test(lowerKeyword) || lowerKeyword.length > 5)) {
					try {
						const byId = await productApi.getProductById(lowerKeyword);
						if (byId && byId.id) items = [byId];
					} catch {
						// Bỏ qua nếu không tìm thấy theo id
					}
				}

				if (!isCancelled) {
					setSearchResults(
						items.map((p) => ({
							id: String(p.id),
							name: p.name,
							thumbnailUrl: p.thumbnailUrl || (p as any).imageUrl,
							price: p.price,
							sold: p.sold ?? 0,
						}))
					);
					setIsSearchOpen(true);
				}
			} catch {
				if (!isCancelled) setSearchResults([]);
			} finally {
				if (!isCancelled) setIsSearching(false);
			}
		};

		fetchDbProducts();
		return () => {
			isCancelled = true;
		};
	}, [debouncedKeyword, shopId]);

	// Đóng dropdown khi click bên ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
				setIsSearchOpen(false);
			}
			if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
				setIsProductDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Danh sách tổng hợp sản phẩm để kiểm tra xem đã thêm chưa
	const allFilterProducts = [...top10Products, ...customProducts];

	return (
		<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-3">
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
				{/* BÊN TRÁI: Ô SEARCH SẢN PHẨM TỪ DB (DEBOUNCE 300MS, TÊN, ID, THUMBNAIL, NHẤN THÊM) */}
				<div ref={searchContainerRef} className="relative w-full lg:w-80">
					<div className="relative flex items-center">
						<Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 pointer-events-none" />
						<input
							type="text"
							placeholder="Tìm sản phẩm từ CSDL (tên, ID)..."
							value={searchKeyword}
							onChange={(e) => {
								setSearchKeyword(e.target.value);
								if (!isSearchOpen && e.target.value.trim()) setIsSearchOpen(true);
							}}
							onFocus={() => {
								if (searchResults.length > 0) setIsSearchOpen(true);
							}}
							className="w-full pl-8 pr-8 py-1.5 bg-white border border-brand-border rounded-md text-xs text-brand-dark placeholder:text-slate-400 focus:outline-none focus:border-brand-primary shadow-xs"
						/>
						{isSearching ? (
							<Loader2 className="w-3.5 h-3.5 text-brand-primary animate-spin absolute right-3" />
						) : searchKeyword ? (
							<button
								type="button"
								onClick={() => {
									setSearchKeyword("");
									setSearchResults([]);
									setIsSearchOpen(false);
								}}
								className="text-slate-400 hover:text-slate-600 absolute right-3 p-0.5 cursor-pointer border-none bg-transparent"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						) : null}
					</div>

					{/* Dropdown danh sách kết quả tìm kiếm CSDL */}
					{isSearchOpen && searchKeyword.trim().length > 0 && (
						<div className="absolute left-0 top-full mt-1.5 w-84 sm:w-96 bg-white border border-brand-border rounded-md shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
							<div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-2 py-1 border-b border-brand-border/60 mb-1 flex items-center justify-between">
								<span>Kết quả tìm kiếm CSDL</span>
								<span>{searchResults.length} sản phẩm</span>
							</div>
							{isSearching ? (
								<div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-brand-muted font-medium">
									<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
									Đang tìm kiếm sản phẩm...
								</div>
							) : searchResults.length === 0 ? (
								<div className="py-6 text-center text-xs text-brand-muted">
									Không tìm thấy sản phẩm nào trong CSDL phù hợp.
								</div>
							) : (
								<div className="space-y-1">
									{searchResults.map((item) => {
										const isAlreadyAdded = allFilterProducts.some((p) => p.id === item.id);
										const isCurrentSelected = selectedProductId === item.id;
										return (
											<div
												key={item.id}
												className="p-2 hover:bg-brand-light-soft rounded-md flex items-center justify-between gap-2.5 transition-colors"
											>
												<div className="flex items-center gap-2.5 min-w-0">
													<img
														src={item.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60"}
														alt={item.name}
														className="w-9 h-9 rounded object-cover border border-brand-border shrink-0"
														onError={(e) => {
															(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
														}}
													/>
													<div className="flex flex-col min-w-0">
														<span className="text-xs font-bold text-brand-dark truncate">
															{item.name}
														</span>
														<div className="flex items-center gap-2 text-[10px] text-brand-muted font-medium">
															<span className="font-mono">#{item.id}</span>
															{item.sold !== undefined && item.sold > 0 && (
																<span>Đã bán: {item.sold}</span>
															)}
														</div>
													</div>
												</div>

												{isCurrentSelected ? (
													<span className="text-[11px] font-bold text-brand-primary-deep bg-brand-primary/10 px-2 py-1 rounded shrink-0">
														Đang chọn
													</span>
												) : isAlreadyAdded ? (
													<button
														type="button"
														onClick={() => {
															onSelectProduct(item.id);
															setIsSearchOpen(false);
															setSearchKeyword("");
														}}
														className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-brand-dark bg-slate-100 hover:bg-slate-200 rounded cursor-pointer transition-colors shrink-0 border-none"
													>
														Chọn
													</button>
												) : (
													<button
														type="button"
														onClick={() => {
															onAddCustomProduct(item);
															setIsSearchOpen(false);
															setSearchKeyword("");
														}}
														className="px-2.5 py-1 text-xs font-bold text-brand-dark bg-brand-primary hover:bg-brand-primary-deep rounded flex items-center gap-1 shadow-2xs cursor-pointer transition-colors shrink-0 border-none"
													>
														<Plus className="w-3 h-3" />
														<span>Thêm</span>
													</button>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

				{/* BÊN PHẢI: BỘ LỌC THỜI GIAN (SELECT) & BỘ LỌC SẢN PHẨM (TOP 10 CỦA SHOP CÓ THUMBNAIL, ID, TÊN) */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Dropdown Thời Gian: Hôm nay, 3 ngày qua, 7 ngày qua, Tự chỉnh */}
					<div className="flex items-center gap-2 bg-brand-light-soft border border-brand-border rounded-md px-3 py-1.5 shadow-2xs">
						<Calendar className="w-3.5 h-3.5 text-brand-muted shrink-0" />
						<span className="text-xs font-bold text-slate-600 shrink-0">Thời gian:</span>
						<select
							value={preset}
							onChange={(e) => onPresetChange(e.target.value as PresetFilter)}
							className="bg-transparent border-none text-xs font-bold text-brand-dark focus:outline-none cursor-pointer"
						>
							<option value="today">Hôm nay</option>
							<option value="3d">3 ngày qua</option>
							<option value="week">7 ngày qua</option>
							<option value="custom">Tự chỉnh</option>
						</select>
					</div>

					{/* Dropdown Lọc Sản Phẩm (Top 10 shop có Tên, ID, Thumbnail) */}
					<div ref={productDropdownRef} className="relative">
						<button
							type="button"
							onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
							className="flex items-center gap-2 bg-brand-light-soft hover:bg-slate-100 border border-brand-border rounded-md px-3 py-1.5 shadow-2xs transition-colors cursor-pointer text-left"
						>
							<Filter className="w-3.5 h-3.5 text-brand-muted shrink-0" />
							<span className="text-xs font-bold text-slate-600 shrink-0">Sản phẩm:</span>
							{selectedProductId === "all" ? (
								<span className="text-xs font-bold text-brand-dark max-w-[140px] sm:max-w-[180px] truncate">
									Tất cả sản phẩm
								</span>
							) : (
								<div className="flex items-center gap-1.5 max-w-[150px] sm:max-w-[200px] truncate">
									<img
										src={selectedProductStat?.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60"}
										alt=""
										className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
										onError={(e) => {
											(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
										}}
									/>
									<span className="text-xs font-bold text-brand-dark truncate">
										{selectedProductStat?.name}
									</span>
									<span className="text-[10px] font-mono text-slate-500 shrink-0">
										#{selectedProductStat?.id}
									</span>
								</div>
							)}
							<ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
						</button>

						{/* Menu chọn sản phẩm (Top 10 shop & Đã thêm từ tìm kiếm) */}
						{isProductDropdownOpen && (
							<div className="absolute right-0 top-full mt-1.5 w-80 sm:w-88 bg-white border border-brand-border rounded-md shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
								{/* Tất cả sản phẩm */}
								<button
									type="button"
									onClick={() => {
										onSelectProduct("all");
										setIsProductDropdownOpen(false);
									}}
									className={`w-full flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors border-none text-left ${
										selectedProductId === "all"
											? "bg-brand-primary/10 text-brand-primary-deep font-bold"
											: "hover:bg-brand-light-soft text-brand-dark bg-transparent"
									}`}
								>
									<div className="flex items-center gap-2">
										<div className="w-7 h-7 rounded bg-brand-primary/10 text-brand-primary-deep flex items-center justify-center font-bold">
											<Package className="w-3.5 h-3.5" />
										</div>
										<div className="flex flex-col text-left">
											<span className="font-bold">Tất cả sản phẩm</span>
											<span className="text-[10px] text-brand-muted">Toàn bộ doanh thu & đơn hàng</span>
										</div>
									</div>
									{selectedProductId === "all" && <Check className="w-4 h-4 text-brand-primary-deep" />}
								</button>

								<div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-2 py-1.5 border-b border-brand-border/60 mt-1 mb-1">
									Top 10 sản phẩm của shop
								</div>

								<div className="space-y-1">
									{top10Products.length === 0 ? (
										<div className="py-2 text-center text-brand-muted text-[11px]">
											Chưa có dữ liệu sản phẩm của shop
										</div>
									) : (
										top10Products.map((p, idx) => {
											const isSelected = selectedProductId === p.id;
											return (
												<button
													key={p.id}
													type="button"
													onClick={() => {
														onSelectProduct(p.id);
														setIsProductDropdownOpen(false);
													}}
													className={`w-full flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors border-none text-left ${
														isSelected
															? "bg-brand-primary/10 text-brand-primary-deep font-bold"
															: "hover:bg-brand-light-soft text-brand-dark bg-transparent"
													}`}
												>
													<div className="flex items-center gap-2 min-w-0">
														<span className="text-[10px] font-bold text-slate-400 w-4 text-center shrink-0">
															{idx + 1}
														</span>
														<img
															src={p.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60"}
															alt=""
															className="w-7 h-7 rounded object-cover border border-brand-border shrink-0"
															onError={(e) => {
																(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
															}}
														/>
														<div className="flex flex-col text-left min-w-0">
															<span className="font-bold truncate">{p.name}</span>
															<div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-normal">
																<span className="font-mono">#{p.id}</span>
																<span>•</span>
																<span>Đã bán {p.soldQuantity}</span>
															</div>
														</div>
													</div>
													{isSelected && <Check className="w-4 h-4 text-brand-primary-deep shrink-0" />}
												</button>
											);
										})
									)}
								</div>

								{/* Danh sách sản phẩm thêm từ tìm kiếm */}
								{customProducts.length > 0 && (
									<div className="mt-2 pt-1 border-t border-brand-border/60">
										<div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-2 py-1 mb-1">
											Sản phẩm đã thêm từ tìm kiếm ({customProducts.length})
										</div>
										<div className="space-y-1">
											{customProducts.map((p) => {
												const isSelected = selectedProductId === p.id;
												return (
													<button
														key={p.id}
														type="button"
														onClick={() => {
															onSelectProduct(p.id);
															setIsProductDropdownOpen(false);
														}}
														className={`w-full flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors border-none text-left ${
															isSelected
																? "bg-brand-primary/10 text-brand-primary-deep font-bold"
																: "hover:bg-brand-light-soft text-brand-dark bg-transparent"
														}`}
													>
														<div className="flex items-center gap-2 min-w-0">
															<img
																src={p.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60"}
																alt=""
																className="w-7 h-7 rounded object-cover border border-brand-border shrink-0"
																onError={(e) => {
																	(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop&q=60";
																}}
															/>
															<div className="flex flex-col text-left min-w-0">
																<span className="font-bold truncate">{p.name}</span>
																<span className="text-[10px] font-mono text-slate-400">#{p.id}</span>
															</div>
														</div>
														{isSelected && <Check className="w-4 h-4 text-brand-primary-deep shrink-0" />}
													</button>
												);
											})}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* DÒNG DƯỚI: KHI CHỌN "TỰ CHỈNH" THÌ HIỆN BỘ LỌC THÁNG, NĂM Ở DƯỚI */}
			{preset === "custom" && (
				<div className="pt-3 border-t border-brand-border/60 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
					<span className="text-xs font-bold text-brand-dark">Chọn mốc thời gian tự chỉnh:</span>
					<div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
						<span className="text-brand-muted">Tháng:</span>
						<select
							value={selectedMonth}
							onChange={(e) => onMonthChange(Number(e.target.value))}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
						>
							{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
								<option key={m} value={m}>
									Tháng {m}
								</option>
							))}
						</select>
					</div>

					<div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
						<span className="text-brand-muted">Năm:</span>
						<select
							value={selectedYear}
							onChange={(e) => onYearChange(Number(e.target.value))}
							className="px-2.5 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
						>
							<option value={currentYear}>{currentYear}</option>
							<option value={currentYear - 1}>{currentYear - 1}</option>
							<option value={currentYear - 2}>{currentYear - 2}</option>
						</select>
					</div>

					<button
						type="button"
						onClick={onApplyCustom}
						className={`px-3.5 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer transition-all border-none ${
							isCustomReady
								? "bg-slate-200 text-slate-700 hover:bg-slate-300"
								: "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark ring-2 ring-brand-primary/30"
						}`}
					>
						{isCustomReady ? "Cập nhật biểu đồ" : "Xem phân tích"}
					</button>
				</div>
			)}
		</div>
	);
}
