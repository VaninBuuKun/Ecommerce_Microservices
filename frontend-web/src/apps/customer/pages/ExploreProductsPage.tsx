import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Filter, ArrowUpDown, Flame, ChevronRight, ShoppingBag, Heart, RefreshCw, X, Layers, Check } from "lucide-react";
import { toast } from "react-toastify";
import { useWishlist, useCategoriesQuery, useInfiniteProductsQuery } from "@/domains/catalog";
import { useAddItemToCartMutation } from "@/domains/cart";

interface Product {
	id: number;
	name: string;
	price: number;
	discountPrice?: number;
	thumbnailUrl?: string;
	averageRating: number;
	reviewCount: number;
	soldQuantity: number;
	shopId: number;
	categoryName?: string;
}

export function ExploreProductsPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const searchTermParam = searchParams.get("search") || "";
	const parentCategoryIdParam = searchParams.get("parentCategoryId") || searchParams.get("parentCategory") || "";

	const { wishlistItems, toggleWishlist } = useWishlist();
	const addItemToCartMutation = useAddItemToCartMutation();
	const { data: categoriesData = [] } = useCategoriesQuery();

	// State cho Danh mục Cha & Con
	const [expandedParentId, setExpandedParentId] = useState<number | null>(
		parentCategoryIdParam ? Number(parentCategoryIdParam) : null
	);
	const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);

	// State Bộ Lọc Khác
	const [minRating, setMinRating] = useState<number | null>(null);

	// State Sắp Xếp (Mutually Exclusive: Price, Time, BestSelling)
	const [priceSort, setPriceSort] = useState<string>("");
	const [timeSort, setTimeSort] = useState<string>("");
	const [isBestSelling, setIsBestSelling] = useState<boolean>(false);

	// Calculated Active SortBy string sent to API
	const activeSortBy = isBestSelling
		? "sold"
		: priceSort
			? priceSort
			: timeSort
				? timeSort
				: "name";

	const limit = 12;

	// Hàm lấy danh sách danh mục con an toàn (hỗ trợ cả mảng phẳng và mảng cây)
	const getSubCategories = (parentCat: any) => {
		if (!parentCat) return [];
		if (Array.isArray(parentCat.subCategories) && parentCat.subCategories.length > 0) {
			return parentCat.subCategories;
		}
		if (Array.isArray(parentCat.children) && parentCat.children.length > 0) {
			return parentCat.children;
		}
		return categoriesData.filter(
			(c: any) => c.parentId && Number(c.parentId) === Number(parentCat.id)
		);
	};

	// Phân loại Danh Mục Cha (Parent Categories) & Danh Mục Con (Sub Categories)
	const parentCategories = categoriesData.filter((c: any) => !c.parentId);

	// Tự động chọn danh mục cha và con đầu tiên khi vừa vào trang Explore mà chưa chọn danh mục nào
	useEffect(() => {
		if (categoriesData.length > 0 && !expandedParentId && !parentCategoryIdParam) {
			const parentCats = categoriesData.filter((c: any) => !c.parentId);
			if (parentCats.length > 0) {
				setExpandedParentId(parentCats[0].id);
				const subCats = getSubCategories(parentCats[0]);
				if (subCats.length > 0) {
					setSelectedSubCategoryId(subCats[0].id);
				}
			}
		}
	}, [categoriesData, parentCategoryIdParam]);

	// Tìm Parent Category đang chọn nếu đi từ Landing Page hoặc chọn ở Sidebar
	const activeParentCategory = parentCategoryIdParam
		? categoriesData.find((c: any) => Number(c.id) === Number(parentCategoryIdParam))
		: expandedParentId
			? categoriesData.find((c: any) => Number(c.id) === Number(expandedParentId))
			: null;

	// Danh sách các danh mục con tương ứng với danh mục cha hiện tại
	const currentSubCategories = getSubCategories(activeParentCategory);

	// Tự động chọn Sub-Category đầu tiên nếu chưa chọn và đi từ Landing Page theo Parent Category
	const activeSubCategoryId = selectedSubCategoryId || (currentSubCategories.length > 0 ? currentSubCategories[0].id : null);

	// Query Products via TanStack Query (useInfiniteQuery) - CHỈ QUERY THEO SUB CATEGORY ID
	const {
		data: queryData,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	} = useInfiniteProductsQuery({
		limit,
		sortBy: activeSortBy,
		searchTerm: searchTermParam || undefined,
		categoryId: activeSubCategoryId || undefined,
		minRating: minRating !== null ? minRating : undefined,
	});

	// Flatten paginated pages into single products array
	const products: Product[] = (queryData?.pages.flatMap((page) => page.items || []) || []) as Product[];

	// Handlers for Mutually Exclusive Sorting
	const handlePriceSortChange = (val: string) => {
		setPriceSort(val);
		setTimeSort("");
		setIsBestSelling(false);
	};

	const handleTimeSortChange = (val: string) => {
		setTimeSort(val);
		setPriceSort("");
		setIsBestSelling(false);
	};

	const handleBestSellingClick = () => {
		setIsBestSelling(true);
		setPriceSort("");
		setTimeSort("");
	};

	const handleResetFilters = () => {
		setMinRating(null);
		setSelectedSubCategoryId(null);
		setExpandedParentId(null);
		setPriceSort("");
		setTimeSort("");
		setIsBestSelling(false);
		if (parentCategoryIdParam) {
			navigate("/explore");
		}
	};

	return (
		<div className="pt-4 min-h-screen bg-brand-light font-sans text-brand-dark pb-16">
			{/* Breadcrumb Header */}
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 text-xs text-brand-muted mb-1 font-semibold">
						<Link to="/" className="hover:text-brand-primary transition-colors">
							Trang chủ
						</Link>
						<ChevronRight className="w-3 h-3 text-brand-muted" />
						<Link to="/explore" className="hover:text-brand-primary transition-colors">
							Khám phá sản phẩm
						</Link>
						{activeParentCategory && (
							<>
								<ChevronRight className="w-3 h-3 text-brand-muted" />
								<span className="text-brand-dark font-extrabold">{activeParentCategory.name}</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Layout (2 Divs: Left Filter Sidebar & Right Products Grid) */}
			<div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 flex flex-col md:flex-row gap-6">
				{/* DIV TRÁI: BỘ LỌC TÌM KIẾM (LEFT SIDEBAR DIV) */}
				<div className="w-full md:w-64 bg-white border border-brand-border/70 rounded-lg p-4 shadow-2xs shrink-0 self-start space-y-5">
					<div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
							<Filter className="w-4 h-4 text-brand-primary" />
							<span>Bộ Lọc Tìm Kiếm</span>
						</h3>
						{(minRating !== null || selectedSubCategoryId !== null || parentCategoryIdParam || expandedParentId !== null || priceSort || timeSort || isBestSelling) && (
							<button
								onClick={handleResetFilters}
								className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
							>
								<X className="w-3 h-3" /> Xóa lọc
							</button>
						)}
					</div>

					{/* 1. BỘ LỌC DANH MỤC CHA (NGÀNH HÀNG CHÍNH) */}
					<div className="space-y-2 text-left">
						<div className="flex items-center gap-1.5 text-brand-dark">
							<Layers className="w-3.5 h-3.5 text-brand-primary" />
							<h4 className="text-xs font-extrabold uppercase tracking-wider">
								Ngành Hàng Chính
							</h4>
						</div>

						<div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
							<button
								onClick={() => {
									setExpandedParentId(null);
									setSelectedSubCategoryId(null);
								}}
								className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${expandedParentId === null
									? "bg-brand-dark text-white border-brand-dark shadow-2xs"
									: "bg-white border-brand-border/60 text-brand-muted hover:bg-slate-50 hover:text-brand-dark"
									}`}
							>
								<span>Tất cả ngành hàng</span>
								{expandedParentId === null && <Check className="w-3.5 h-3.5 text-brand-primary" />}
							</button>

							{parentCategories.map((parentCat: any) => {
								const isSelected = expandedParentId === parentCat.id;
								return (
									<button
										key={parentCat.id}
										onClick={() => {
											setExpandedParentId(parentCat.id);
											const subCats = getSubCategories(parentCat);
											if (subCats.length > 0) {
												setSelectedSubCategoryId(subCats[0].id);
											} else {
												setSelectedSubCategoryId(null);
											}
										}}
										className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${isSelected
											? "bg-brand-primary/10 border-brand-primary/60 text-brand-dark shadow-2xs"
											: "bg-white border-brand-border/60 text-brand-muted hover:bg-slate-50 hover:text-brand-dark"
											}`}
									>
										<span className="truncate">{parentCat.name}</span>
										{isSelected && <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />}
									</button>
								);
							})}
						</div>
					</div>

					{/* 2. BỘ LỌC DANH MỤC CON (CHI TIẾT) - DÙNG CHECKBOX */}
					{expandedParentId !== null && (
						<div className="space-y-2 text-left pt-3 border-t border-brand-border/60">
							<h4 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
								Danh Mục Chi Tiết
							</h4>
							{currentSubCategories.length > 0 ? (
								<div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
									{currentSubCategories.map((subCat: any) => {
										const isChecked = activeSubCategoryId === subCat.id;
										return (
											<label
												key={subCat.id}
												onClick={() => setSelectedSubCategoryId(subCat.id)}
												className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer border flex items-center gap-2.5 ${isChecked
													? "bg-brand-primary/10 border-brand-primary/40 text-brand-dark"
													: "bg-slate-50 border-brand-border/40 text-slate-600 hover:bg-slate-100"
													}`}
											>
												<input
													type="checkbox"
													checked={isChecked}
													onChange={() => setSelectedSubCategoryId(subCat.id)}
													className="w-3.5 h-3.5 accent-brand-primary rounded cursor-pointer animate-none"
												/>
												<span className="truncate">{subCat.name}</span>
											</label>
										);
									})}
								</div>
							) : (
								<p className="text-[11px] text-brand-muted font-semibold py-1">
									Ngành hàng này đang cập nhật danh mục con
								</p>
							)}
						</div>
					)}

					{/* 3. BỘ LỌC ĐÁNH GIÁ (RATINGS) - DÙNG CHECKBOX */}
					<div className="space-y-2 text-left pt-3 border-t border-brand-border/60">
						<h4 className="text-xs font-extrabold text-brand-dark uppercase tracking-wider">
							Đánh Giá Sản Phẩm
						</h4>
						<div className="space-y-1">
							{[
								{ label: "Tất cả đánh giá", val: null },
								{ label: "Từ 4.5 sao trở lên", val: 4.5 },
								{ label: "Từ 4.0 sao trở lên", val: 4.0 },
								{ label: "Từ 3.5 sao trở lên", val: 3.5 },
								{ label: "Từ 3.0 sao trở lên", val: 3.0 },
							].map((item) => {
								const isChecked = minRating === item.val;
								return (
									<label
										key={String(item.val)}
										className={`flex items-center gap-2.5 p-2 rounded-md text-xs font-bold cursor-pointer transition-all border ${isChecked
											? "bg-brand-primary/10 border-brand-primary/40 text-brand-dark"
											: "border-transparent hover:bg-slate-50 text-slate-600"
											}`}
									>
										<input
											type="checkbox"
											checked={isChecked}
											onChange={() => setMinRating(isChecked ? null : item.val)}
											className="w-3.5 h-3.5 accent-brand-primary rounded cursor-pointer"
										/>
										<span className="flex items-center gap-1">
											{item.val ? (
												<>
													<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
													<span>{item.label}</span>
												</>
											) : (
												<span>{item.label}</span>
											)}
										</span>
									</label>
								);
							})}
						</div>
					</div>
				</div>

				{/* DIV PHẢI: HEADER SẮP XẾP + DẠNG LƯỚI SẢN PHẨM (RIGHT MAIN CONTENT DIV) */}
				<div className="flex-1 space-y-4">
					{/* Header Bộ Lọc Sắp Xếp Ở Đầu Div Phải */}
					<div className="bg-white border border-brand-border/70 rounded-lg p-3 md:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-2.5">
							<span className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
								<ArrowUpDown className="w-4 h-4 text-brand-primary" />
								Sắp xếp:
							</span>

							{/* 1) Combo Box Giá */}
							<select
								value={priceSort}
								onChange={(e) => handlePriceSortChange(e.target.value)}
								className={`h-8 px-3 rounded-md text-xs font-bold border transition-all appearance-none cursor-pointer focus:outline-none ${priceSort
									? "bg-brand-primary/10 text-brand-dark border-brand-primary/60"
									: "bg-slate-50 border-brand-border/60 text-slate-700 hover:border-slate-300"
									}`}
							>
								<option value="">Giá: Mặc định</option>
								<option value="price_asc">Giá: Thấp đến Cao ⬆</option>
								<option value="price_desc">Giá: Cao đến Thấp ⬇</option>
							</select>

							{/* 2) Combo Box Thời Gian */}
							<select
								value={timeSort}
								onChange={(e) => handleTimeSortChange(e.target.value)}
								className={`h-8 px-3 rounded-md text-xs font-bold border transition-all appearance-none cursor-pointer focus:outline-none ${timeSort
									? "bg-brand-primary/10 text-brand-dark border-brand-primary/60"
									: "bg-slate-50 border-brand-border/60 text-slate-700 hover:border-slate-300"
									}`}
							>
								<option value="">Thời gian: Mặc định</option>
								<option value="newest">Mới Nhất 🆕</option>
								<option value="oldest">Cũ Nhất ⏳</option>
							</select>

							{/* 3) Button Bán Chạy */}
							<button
								type="button"
								onClick={handleBestSellingClick}
								className={`h-8 px-3 rounded-md text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${isBestSelling
									? "bg-brand-dark text-white border-brand-dark shadow-2xs"
									: "bg-slate-50 border-brand-border/60 text-slate-700 hover:border-slate-300"
									}`}
							>
								<Flame className={`w-3.5 h-3.5 ${isBestSelling ? "text-brand-primary fill-brand-primary" : "text-brand-muted"}`} />
								Bán Chạy
							</button>
						</div>

						{/* Quick Active Badge */}
						<span className="text-[10px] text-brand-muted font-bold bg-slate-50 px-2.5 py-1 rounded-md border border-brand-border/40">
							Tiêu chí:{" "}
							<strong className="text-brand-dark">
								{isBestSelling
									? "Bán chạy"
									: priceSort === "price_asc"
										? "Giá thấp -> cao"
										: priceSort === "price_desc"
											? "Giá cao -> thấp"
											: timeSort === "newest"
												? "Mới nhất"
												: timeSort === "oldest"
													? "Cũ nhất"
													: "Mặc định"}
							</strong>
						</span>
					</div>

					{/* Products Grid Section */}
					{isLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="h-64 bg-slate-100 rounded-lg animate-pulse" />
							))}
						</div>
					) : products.length === 0 ? (
						<div className="bg-white border border-brand-border/70 rounded-xl p-12 text-center space-y-3">
							<ShoppingBag className="w-10 h-10 text-brand-muted/40 mx-auto" />
							<h3 className="text-sm font-bold text-brand-dark">Không tìm thấy sản phẩm phù hợp</h3>
							<p className="text-xs text-brand-muted">Hãy thử thay đổi từ khóa hoặc xóa các bộ lọc để xem nhiều kết quả hơn.</p>
							<button
								onClick={handleResetFilters}
								className="px-4 py-2 bg-brand-dark text-white rounded-lg text-xs font-bold hover:bg-black transition-colors cursor-pointer border-none"
							>
								Xóa tất cả bộ lọc
							</button>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-left">
								{products.map((p: any) => {
									const isLiked = wishlistItems.some((w: any) => w.id === p.id);
									const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
									const discountPercent = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
									const activePrice = hasDiscount ? p.discountPrice : p.price;

									return (
										<motion.div
											whileHover={{ y: -3 }}
											key={p.id}
											onClick={() => navigate(`/products/${p.id}`)}
											className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
										>
											{hasDiscount && (
												<div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
													-{discountPercent}%
												</div>
											)}

											<div className="aspect-square w-full relative overflow-hidden bg-slate-50 border-b border-brand-border/40">
												<img
													src={
														p.thumbnailUrl ||
														"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
													}
													alt={p.name}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
												/>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														toggleWishlist(p);
													}}
													className="absolute top-2 left-2 z-10 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-2xs hover:bg-white transition-colors border-none cursor-pointer"
												>
													<Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
												</button>
											</div>

											<div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
												<div>
													{p.categoryName && (
														<span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">
															{p.categoryName}
														</span>
													)}
													<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
														{p.name}
													</h3>
												</div>

												<div className="space-y-1.5 border-t border-brand-border/40 pt-1.5">
													<div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
														<Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
														<span>{p.averageRating ? p.averageRating.toFixed(1) : "5.0"}</span>
														<span className="text-brand-muted text-[9px] font-normal">
															({p.reviewCount || 0})
														</span>
													</div>

													{/* Price Block */}
													<div className="pt-0.5 space-y-0.5">
														<div className="flex items-center gap-1.5">
															<span className="font-extrabold text-red-600 text-sm leading-none">
																{activePrice.toLocaleString("vi-VN")}đ
															</span>
														</div>
														{hasDiscount && (
															<div className="text-[11px] text-gray-400 font-normal line-through leading-tight">
																{p.price.toLocaleString("vi-VN")}đ
															</div>
														)}
													</div>

													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															addItemToCartMutation.mutate(
																{ variantId: p.id, quantity: 1 },
																{ onSuccess: () => toast.success("Đã thêm vào giỏ hàng!") }
															);
														}}
														className="w-full mt-2 py-1.5 bg-brand-light-soft hover:bg-brand-primary text-brand-dark rounded-md text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-brand-border/60"
													>
														<ShoppingBag className="w-3.5 h-3.5" />
														<span>Thêm vào giỏ</span>
													</button>
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>

							{/* Cursor Pagination Load More Button */}
							{hasNextPage && (
								<div className="pt-6 border-t border-brand-border/60 flex items-center justify-center">
									<button
										type="button"
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										className="px-8 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
									>
										{isFetchingNextPage ? (
											<>
												<RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
												<span>Đang tải...</span>
											</>
										) : (
											<span>Xem thêm</span>
										)}
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default ExploreProductsPage;
