import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Filter, ChevronRight, ChevronLeft, ShoppingBag, X } from "lucide-react";
import { useCategoriesQuery, useSearchProductsQuery } from "@/domains/catalog";

interface Product {
	id: string | number;
	name: string;
	price: number;
	discountPrice?: number;
	thumbnailUrl?: string;
	averageRating?: number;
	reviewCount?: number;
	sold?: number;
	soldQuantity?: number;
	shopId: number;
	categoryId?: number;
	categoryName?: string;
}

export function ExploreProductsPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const searchTermParam = searchParams.get("search") || "";
	const parentCategoryIdParam = searchParams.get("parentCategoryId") || searchParams.get("parentCategory") || "";
	const subCategoryIdParam = searchParams.get("subCategoryId") || searchParams.get("categoryId") || "";
	const minRatingParam = searchParams.get("minRating") || "";
	const sortParam = searchParams.get("sort") || searchParams.get("sortBy") || (searchTermParam ? "relevance" : "newest");

	const { data: categoriesData = [] } = useCategoriesQuery();

	// State cho SubCategory đang được chọn (lọc)
	const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(
		subCategoryIdParam ? Number(subCategoryIdParam) : null
	);

	// State Sắp Xếp
	const [sortBy, setSortBy] = useState<string>(sortParam);

	// State Bộ Lọc Đánh Giá
	const [minRating, setMinRating] = useState<number | null>(
		minRatingParam ? Number(minRatingParam) : null
	);

	// State Phân Trang
	const [page, setPage] = useState<number>(1);
	const pageSize = 36; // 9 dòng x 4 cột

	// Cập nhật khi URL search params thay đổi
	useEffect(() => {
		if (subCategoryIdParam) {
			setSelectedSubCategoryId(Number(subCategoryIdParam));
		}
		if (sortParam) {
			setSortBy(sortParam);
		}
		if (minRatingParam) {
			setMinRating(Number(minRatingParam));
		}
		setPage(1);
	}, [searchTermParam, subCategoryIdParam, sortParam, minRatingParam]);

	// Query Products dùng chung Search Pipeline với Header suggestions
	const {
		data: searchData,
		isLoading,
		isFetching,
	} = useSearchProductsQuery({
		q: searchTermParam || undefined,
		searchTerm: searchTermParam || undefined,
		categoryId: selectedSubCategoryId || undefined,
		minRating: minRating !== null ? minRating : undefined,
		page,
		pageSize,
		sortBy,
	});

	// Danh sách sản phẩm từ kết quả tìm kiếm
	const products: Product[] = useMemo(() => {
		return (searchData?.products?.items || searchData?.topProducts || []) as Product[];
	}, [searchData]);

	const totalCount = searchData?.products?.totalCount ?? products.length;
	const totalPages = searchData?.products?.totalPages ?? (totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1);

	// Hàm lấy subcategories an toàn từ parent category trong categoriesData
	const getSubCategoriesFromParent = (parentCat: any) => {
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

	// Danh mục cha nếu đi từ LandingPage hoặc ProductDetail
	const activeParentCategory = useMemo(() => {
		if (!parentCategoryIdParam) return null;
		return categoriesData.find((c: any) => Number(c.id) === Number(parentCategoryIdParam)) || null;
	}, [categoriesData, parentCategoryIdParam]);

	// Danh sách CategoryList tích lũy (Accumulated SubCategories):
	// QUY TẮC: Khi thu hẹp khoảng cách/filter thì categoryList LUÔN GIỮ NGUYÊN, nhiều nhất chỉ TĂNG THÊM không được giảm đi.
	const [accumulatedSubCategories, setAccumulatedSubCategories] = useState<Array<{ id: number; name: string }>>([]);

	// 1. Nếu có parentCategory -> lấy toàn bộ subcategories của parentCategory đó
	useEffect(() => {
		if (activeParentCategory) {
			const subs = getSubCategoriesFromParent(activeParentCategory);
			if (subs.length > 0) {
				setAccumulatedSubCategories(
					subs.map((s: any) => ({ id: Number(s.id), name: s.name }))
				);
			}
		}
	}, [activeParentCategory, categoriesData]);

	// 2. Tích lũy subcategories từ backend suggestions hoặc từ danh sách sản phẩm trả về
	useEffect(() => {
		if (!activeParentCategory) {
			setAccumulatedSubCategories((prev) => {
				const map = new Map<number, string>();
				prev.forEach((c) => map.set(c.id, c.name));

				// Bổ sung từ suggestedCategories của backend nếu có
				if (searchData?.suggestedCategories && searchData.suggestedCategories.length > 0) {
					searchData.suggestedCategories.forEach((sc) => {
						if (sc.id > 0 && !map.has(sc.id)) {
							map.set(sc.id, sc.name);
						}
					});
				}

				// Bổ sung từ sản phẩm hiện tại
				products.forEach((p) => {
					const catId = Number(p.categoryId);
					if (catId > 0 && !map.has(catId)) {
						const name = p.categoryName || `Danh mục ${catId}`;
						map.set(catId, name);
					}
				});

				return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
			});
		}
	}, [products, searchData?.suggestedCategories, activeParentCategory]);

	const renderStars = (rating: number = 5) => {
		const score = rating > 0 ? rating : 5;
		const rounded = Math.round(score);
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((s) => (
					<Star
						key={s}
						className={`w-2.5 h-2.5 ${
							s <= rounded
								? "fill-amber-400 text-amber-400 stroke-amber-400"
								: "fill-gray-200 text-gray-200 stroke-gray-200"
						}`}
					/>
				))}
			</div>
		);
	};

	const handleResetFilters = () => {
		setSelectedSubCategoryId(null);
		setMinRating(null);
		setSortBy(searchTermParam ? "relevance" : "newest");
		setPage(1);
		if (searchTermParam || parentCategoryIdParam) {
			navigate("/explore");
		}
	};

	const hasActiveFilters = Boolean(
		selectedSubCategoryId !== null ||
		minRating !== null ||
		searchTermParam ||
		parentCategoryIdParam
	);

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
			setPage(newPage);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	// Tạo danh sách số trang phân trang thông minh (có dấu ...)
	const renderPaginationButtons = () => {
		const buttons: (number | string)[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				buttons.push(i);
			}
		} else {
			buttons.push(1);
			if (page > 3) {
				buttons.push("dots-prev");
			}

			const start = Math.max(2, page - 1);
			const end = Math.min(totalPages - 1, page + 1);

			for (let i = start; i <= end; i++) {
				buttons.push(i);
			}

			if (page < totalPages - 2) {
				buttons.push("dots-next");
			}
			buttons.push(totalPages);
		}

		return buttons.map((btn, index) => {
			if (typeof btn === "string") {
				return (
					<span
						key={`dots-${index}`}
						className="w-8 h-8 flex items-center justify-center text-xs text-brand-muted select-none"
					>
						...
					</span>
				);
			}
			const isActive = btn === page;
			return (
				<button
					type="button"
					key={btn}
					onClick={() => handlePageChange(btn)}
					className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-md transition-colors cursor-pointer border ${
						isActive
							? "bg-brand-primary border-brand-primary text-brand-dark font-black shadow-xs"
							: "bg-white border-brand-border/80 text-brand-dark hover:bg-slate-50"
					}`}
				>
					{btn}
				</button>
			);
		});
	};

	return (
		<div className="pt-4 min-h-screen bg-brand-light font-sans text-brand-dark pb-16">
			{/* Breadcrumb Header */}
			<div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
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
						{searchTermParam && (
							<>
								<ChevronRight className="w-3 h-3 text-brand-muted" />
								<span className="text-brand-dark font-bold truncate max-w-xs">
									Từ khóa: "{searchTermParam}"
								</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Layout (2 Cột: Bên Trái là Sidebar Lọc, Bên Phải là Grid Sản Phẩm) */}
			<div className="max-w-7xl mx-auto px-4 md:px-6 mt-4 flex flex-col md:flex-row gap-6">
				{/* CỘT TRÁI: BỘ LỌC TÌM KIẾM (Full rounded-md, bỏ hẳn khoảng giá, 1 chạm đánh giá) */}
				<div className="w-full md:w-64 bg-white border border-brand-border/70 rounded-md p-4 shadow-2xs shrink-0 self-start space-y-5">
					<div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
							<Filter className="w-4 h-4 text-brand-primary" />
							<span>Bộ Lọc Tìm Kiếm</span>
						</h3>
						{hasActiveFilters && (
							<button
								type="button"
								onClick={handleResetFilters}
								className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
							>
								<X className="w-3 h-3" /> Xóa tất cả
							</button>
						)}
					</div>

					{/* 1. BỘ LỌC DANH MỤC CON (SUBCATEGORIES) */}
					<div className="space-y-2 text-left">
						<div className="flex items-center gap-1.5 text-brand-dark">
							<h4 className="text-xs font-extrabold uppercase tracking-wider">
								{activeParentCategory ? activeParentCategory.name : "Danh Mục Liên Quan"}
							</h4>
						</div>

						{accumulatedSubCategories.length > 0 ? (
							<div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
								{accumulatedSubCategories.map((subCat) => {
									const isChecked = selectedSubCategoryId === subCat.id;
									return (
										<button
											type="button"
											key={subCat.id}
											onClick={() => {
												setSelectedSubCategoryId(isChecked ? null : subCat.id);
												setPage(1);
											}}
											className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-2.5 ${
												isChecked
													? "bg-brand-primary/15 border-brand-primary text-brand-dark shadow-2xs font-extrabold"
													: "bg-slate-50/70 border-brand-border/40 text-slate-700 hover:bg-slate-100 hover:text-brand-dark"
											}`}
										>
											<span className="truncate">{subCat.name}</span>
											{isChecked && <span className="w-2 h-2 rounded-full bg-brand-primary-deep shrink-0" />}
										</button>
									);
								})}
							</div>
						) : (
							<p className="text-[11px] text-brand-muted font-medium py-1">
								{isLoading ? "Đang tải danh mục..." : "Không có danh mục con"}
							</p>
						)}
					</div>

					{/* 2. BỘ LỌC ĐÁNH GIÁ (Ratings - 1 chạm chọn ngay, full rounded-md) */}
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
							].map((item) => {
								const isChecked = minRating === item.val;
								return (
									<button
										type="button"
										key={String(item.val)}
										onClick={() => {
											setMinRating(isChecked ? null : item.val);
											setPage(1);
										}}
										className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold cursor-pointer transition-all border text-left ${
											isChecked
												? "bg-brand-primary/15 border-brand-primary text-brand-dark shadow-2xs font-extrabold"
												: "bg-slate-50/70 border-brand-border/40 text-slate-700 hover:bg-slate-100 hover:text-brand-dark"
										}`}
									>
										<div className="flex items-center gap-2">
											{item.val ? (
												<>
													<div className="flex items-center gap-0.5">
														{[1, 2, 3, 4, 5].map((s) => (
															<Star
																key={s}
																className={`w-3 h-3 ${
																	s <= Math.round(item.val!)
																		? "fill-amber-400 text-amber-400 stroke-amber-400"
																		: "fill-gray-200 text-gray-200 stroke-gray-200"
																}`}
															/>
														))}
													</div>
													<span>{item.label}</span>
												</>
											) : (
												<span>{item.label}</span>
											)}
										</div>
										{isChecked && (
											<span className="w-2 h-2 rounded-full bg-brand-primary-deep shrink-0" />
										)}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* CỘT PHẢI: TOP BAR + LƯỚI SẢN PHẨM (Full rounded-md) */}
				<div className="flex-1 space-y-4">
					{/* Top Bar Header: Bên Trái "Tìm thấy X sản phẩm", Bên Phải: 1 Select Box duy nhất */}
					<div className="bg-white border border-brand-border/70 rounded-md px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-3">
						{/* Bên trái: Hiển thị số lượng sản phẩm tìm thấy */}
						<div className="flex items-center gap-1.5">
							<span className="text-xs font-bold text-brand-dark">
								Tìm thấy <strong className="text-brand-primary font-black text-sm">{totalCount}</strong> sản phẩm
							</span>
						</div>

						{/* Bên phải: 1 Select Box duy nhất gom tất cả tiêu chí sắp xếp */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold text-brand-muted hidden sm:inline">
								Sắp xếp:
							</span>
							<select
								value={sortBy}
								onChange={(e) => {
									setSortBy(e.target.value);
									setPage(1);
								}}
								className="h-8.5 px-3 rounded-md text-xs font-extrabold border border-brand-border/80 bg-slate-50 text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs hover:bg-slate-100 transition-colors"
							>
								{searchTermParam && <option value="relevance">Phù hợp nhất 🎯</option>}
								<option value="newest">Mới nhất 🆕</option>
								<option value="oldest">Cũ nhất ⏳</option>
								<option value="price_asc">Giá thấp lên cao ⬆</option>
								<option value="price_desc">Giá cao xuống thấp ⬇</option>
								<option value="sold">Bán chạy nhất 🔥</option>
							</select>
						</div>
					</div>

					{/* Lưới Sản Phẩm: 36 items/page (9 dòng x 4 cột) */}
					{isLoading ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
							{Array.from({ length: 12 }).map((_, i) => (
								<div key={i} className="h-64 bg-slate-100 rounded-md animate-pulse" />
							))}
						</div>
					) : products.length === 0 ? (
						<div className="bg-white border border-brand-border/70 rounded-md p-12 text-center space-y-3">
							<ShoppingBag className="w-12 h-12 text-brand-muted/40 mx-auto" />
							<h3 className="text-sm font-bold text-brand-dark">Không tìm thấy sản phẩm phù hợp</h3>
							<p className="text-xs text-brand-muted max-w-sm mx-auto">
								Hãy thử thay đổi từ khóa hoặc xóa các bộ lọc để khám phá nhiều sản phẩm hơn.
							</p>
							<button
								type="button"
								onClick={handleResetFilters}
								className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black rounded-md text-xs shadow-xs transition-colors cursor-pointer border-none"
							>
								Xóa tất cả bộ lọc
							</button>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-left">
								{products.map((p: any) => {
									const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
									const discountPercent = hasDiscount
										? Math.round(((p.price - p.discountPrice) / p.price) * 100)
										: 0;
									const activePrice = hasDiscount ? p.discountPrice : p.price;

									return (
										<motion.div
											whileHover={{ y: -3 }}
											key={p.id}
											onClick={() => navigate(`/products/${p.id}`)}
											className="group flex flex-col bg-white border border-brand-border/60 hover:border-brand-primary rounded-md overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer justify-between relative"
										>
											{hasDiscount && (
												<div className="absolute top-2 right-2 z-10 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
													-{discountPercent}%
												</div>
											)}

											{/* Ảnh Thumbnail */}
											<div className="aspect-square w-full relative overflow-hidden bg-slate-50 border-b border-brand-border/40">
												<img
													src={
														p.thumbnailUrl ||
														"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
													}
													alt={p.name}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
												/>
											</div>

											{/* Thông tin sản phẩm */}
											<div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
												<div>
													{p.categoryName && (
														<span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider block mb-1">
															{p.categoryName}
														</span>
													)}
													<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary-deep transition-colors line-clamp-2 leading-snug min-h-[32px]">
														{p.name}
													</h3>
												</div>

												<div className="space-y-1.5 pt-1 border-t border-brand-border/30">
													<div className="flex items-center gap-1">
														{renderStars(p.averageRating)}
														<span className="text-brand-muted text-[9px] font-normal">
															({p.reviewCount || 0})
														</span>
													</div>

													<div className="flex items-baseline justify-between gap-1">
														<span className="font-extrabold text-red-600 text-sm leading-none">
															{activePrice?.toLocaleString("vi-VN")}đ
														</span>
														<span className="text-[10px] text-brand-muted font-medium whitespace-nowrap">
															Đã bán {p.sold || p.soldQuantity || 0}
														</span>
													</div>

													{/* Giá gốc gạch ngang */}
													<div className="h-3.5 flex items-center">
														{hasDiscount ? (
															<span className="text-[10px] text-gray-400 font-normal line-through leading-tight">
																{p.price?.toLocaleString("vi-VN")}đ
															</span>
														) : (
															<span className="invisible text-[10px] select-none">0đ</span>
														)}
													</div>
												</div>
											</div>
										</motion.div>
									);
								})}
							</div>

							{/* Phân Trang Số (Numbered Pagination) */}
							{totalPages > 1 && (
								<div className="pt-6 border-t border-brand-border/60 flex items-center justify-center gap-1.5 flex-wrap">
									<button
										type="button"
										disabled={page <= 1 || isLoading}
										onClick={() => handlePageChange(page - 1)}
										className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-white border border-brand-border/80 text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
									>
										<ChevronLeft className="w-3.5 h-3.5" />
										<span>Trước</span>
									</button>

									{renderPaginationButtons()}

									<button
										type="button"
										disabled={page >= totalPages || isLoading}
										onClick={() => handlePageChange(page + 1)}
										className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-white border border-brand-border/80 text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
									>
										<span>Sau</span>
										<ChevronRight className="w-3.5 h-3.5" />
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
