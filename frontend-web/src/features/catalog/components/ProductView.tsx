import React, { useState } from "react";
import {
	Plus,
	Edit,
	Trash2,
	ChevronDown,
	ChevronRight,
	Search,
	Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyProductsQuery } from "../hooks";
import { useProductUIStore } from "../stores/productUIStore";
import { CreateProductModal } from "./CreateProductModal";

export function ProductsView() {
	const navigate = useNavigate();
	const { shopId } = useParams<{ shopId?: string }>();
	const numericShopId = shopId ? Number(shopId) : 0;

	// UI State
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	// Get UI state from Zustand
	const { expandedRows, toggleExpandRow, searchTerm, setSearchTerm } =
		useProductUIStore();

	const [searchInput, setSearchInput] = useState(searchTerm);

	// Load products for the active shop via TanStack Query
	const { data, isLoading, isError, error } = useMyProductsQuery({
		ShopId: numericShopId,
		page,
		pageSize,
	});

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchTerm(searchInput);
		setPage(1); // Reset to first page
	};

	// Local filtering for client search in shop products
	const displayedProducts = React.useMemo(() => {
		if (!data) return [];
		if (!searchTerm.trim()) return data;
		return data.filter((product) =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	// Navigate to product edit page
	const handleEditProduct = (productId: string) => {
		navigate(
			`/seller/${shopId || "default"}/dashboard/products/edit/${productId}`,
		);
	};

	// Helpers
	const formatStock = (stock: number): string => {
		if (stock >= 1000) {
			return `${(stock / 1000).toFixed(0)}k`;
		}
		return stock.toLocaleString("vi-VN");
	};

	const formatPrice = (price: number): string => {
		return `₫${price.toLocaleString("vi-VN")}`;
	};

	return (
		<div className="space-y-4 text-left font-sans select-none">
			{/* Header */}
			<div className="flex justify-between items-center pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">
						Quản lý Sản phẩm
					</h2>
					<p className="text-[11px] text-brand-muted">
						Xem, sửa đổi và theo dõi hàng tồn kho của bạn trực
						tuyến.
					</p>
				</div>
				<button
					onClick={() => setIsCreateOpen(true)}
					className="h-8 px-3 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark text-xs font-semibold rounded flex items-center gap-1 cursor-pointer transition-all duration-200"
				>
					<Plus className="w-3.5 h-3.5" />
					Thêm sản phẩm mới
				</button>
			</div>

			{/* Search Bar */}
			<form
				onSubmit={handleSearchSubmit}
				className="flex gap-2 p-3 bg-brand-light-soft border border-brand-border rounded-xl"
			>
				<div className="relative flex-1 max-w-sm">
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Tìm theo tên sản phẩm..."
						className="w-full h-8 pl-8 pr-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary transition-colors"
					/>
					<Search className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-2.5" />
				</div>
				<button
					type="submit"
					className="h-8 px-3 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary-deep text-xs font-bold rounded cursor-pointer transition-colors"
				>
					Tìm kiếm
				</button>
			</form>

			{/* Loading & Error States */}
			{isLoading && (
				<div className="flex flex-col items-center justify-center py-12 text-brand-muted text-xs gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
					Đang tải danh sách sản phẩm của shop...
				</div>
			)}

			{isError && (
				<div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
					Có lỗi xảy ra:{" "}
					{error?.message || "Không thể tải danh sách sản phẩm"}
				</div>
			)}

			{/* Products Table */}
			{!isLoading && !isError && data && (
				<div className="border border-brand-border rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-white">
					<table className="w-full text-xs text-left border-collapse">
						<thead className="bg-brand-light-soft border-b border-brand-border text-brand-dark font-bold">
							<tr>
								<th className="p-3">Tên sản phẩm</th>
								<th className="p-3 w-28">Doanh số</th>
								<th className="p-3 w-28">Giá</th>
								<th className="p-3 w-28">Kho hàng</th>
								<th className="p-3 w-24 text-right">
									Thao tác
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border/60">
							{displayedProducts.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="p-8 text-center text-brand-muted"
									>
										Không tìm thấy sản phẩm nào.
									</td>
								</tr>
							) : (
								displayedProducts.map((product) => {
									const isExpanded =
										!!expandedRows[product.id];
									const hasVariants =
										product.variants &&
										product.variants.length > 0;
									const totalStock = hasVariants
										? product.variants.reduce(
												(acc, v: any) =>
													acc +
													(v.availableStock || 0),
												0,
											)
										: (product.availableStock ?? 0);

									const minPrice = hasVariants
										? Math.min(
												...product.variants.map(
													(v: any) => v.price,
												),
											)
										: (product.price ?? 0);

									return (
										<React.Fragment key={product.id}>
											{/* Parent Row (Product) */}
											<tr className="hover:bg-gray-50/20 transition-colors align-top">
												<td className="p-3 pt-4">
													<div className="flex gap-2.5 items-start">
														{/* Nút Toggle Expand giữ nguyên vị trí */}
														{hasVariants ? (
															<button
																type="button"
																onClick={() =>
																	toggleExpandRow(
																		product.id,
																	)
																}
																className="p-1 hover:bg-gray-200/60 rounded text-brand-muted cursor-pointer transition-colors shrink-0 mt-0.5"
															>
																{isExpanded ? (
																	<ChevronDown className="w-3.5 h-3.5" />
																) : (
																	<ChevronRight className="w-3.5 h-3.5" />
																)}
															</button>
														) : (
															<div className="w-5.5 h-5.5 shrink-0" />
														)}

														{/* Ảnh sản phẩm */}
														<div className="relative shrink-0">
															<img
																src={
																	product.thumbnailUrl ||
																	product.mainImageUrl ||
																	"https://via.placeholder.com/60"
																}
																alt={
																	product.name
																}
																className="w-18 h-18 object-cover rounded border border-brand-border bg-gray-50"
															/>
														</div>

														{/* Khối chứa Badge + Tên sản phẩm */}
														<div className="flex flex-col items-start gap-1 text-left max-w-sm">
															{/* Status Badge đè sát trên góc cùng với ảnh */}
															<span
																className={`px-1.5 py-0.2 font-semibold text-[8px] uppercase tracking-wide inline-block opacity-80 ${
																	product.status ===
																	"Active"
																		? "bg-green-50 text-green-700 border border-green-200/80"
																		: product.status ===
																			  "Draft"
																			? "bg-amber-50 text-amber-700 border border-amber-200/80"
																			: "bg-gray-300 text-gray-800 border border-gray-200"
																}`}
															>
																{product.status ===
																"Active"
																	? "Đang hoạt động"
																	: product.status ===
																		  "Draft"
																		? "Bản nháp"
																		: "Đã ẩn"}
															</span>

															{/* Tên sản phẩm đâm nét hơn (font-extrabold) */}
															<h4 className="font-extrabold text-brand-dark text-sm leading-snug hover:text-brand-primary-deep cursor-pointer truncate w-full">
																{product.name}
															</h4>
														</div>
													</div>
												</td>
												<td className="p-3 pt-4 text-brand-dark font-medium">
													0
												</td>
												<td className="p-3 pt-4 text-brand-dark">
													{formatPrice(minPrice)}
												</td>
												<td className="p-3 pt-4 text-brand-muted">
													{formatStock(totalStock)}
												</td>
												<td className="p-3 pt-4 text-right">
													<div className="flex items-center justify-end gap-1.5">
														<button
															type="button"
															onClick={() =>
																handleEditProduct(
																	product.id,
																)
															}
															className="p-1.5 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
															title="Chỉnh sửa sản phẩm"
														>
															<Edit className="w-4 h-4" />
														</button>
														<button
															type="button"
															className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
															title="Xóa sản phẩm"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</td>
											</tr>

											{/* Child Rows (Variants) */}
											{isExpanded &&
												product.variants &&
												product.variants.map(
													(variant: any) => {
														const variantName =
															variant.variantName ||
															"Mặc định";

														return (
															<tr
																key={
																	variantName
																}
																className="bg-gray-50/20 border-t-0 hover:bg-gray-50/60 transition-colors align-top"
															>
																<td className="p-3 pl-11 pb-3.5">
																	<div className="flex items-start gap-2.5">
																		<img
																			src={
																				variant.thumbnailUrl ||
																				product.thumbnailUrl ||
																				product.mainImageUrl ||
																				"https://via.placeholder.com/32"
																			}
																			alt={
																				variantName
																			}
																			className="w-7 h-7 object-cover rounded border border-brand-border bg-white shrink-0"
																		/>
																		<div className="space-y-0.5 text-left max-w-xs">
																			<span className="text-brand-dark font-medium block truncate">
																				{
																					variantName
																				}
																			</span>
																		</div>
																	</div>
																</td>
																<td className="p-3 text-brand-dark font-medium">
																	0
																</td>
																<td className="p-3 text-brand-dark font-medium">
																	{formatPrice(
																		variant.price ??
																			0,
																	)}
																</td>
																<td className="p-3 text-brand-muted font-medium">
																	{formatStock(
																		variant.availableStock ??
																			0,
																	)}
																</td>
																<td className="p-3"></td>
															</tr>
														);
													},
												)}
										</React.Fragment>
									);
								})
							)}
						</tbody>
					</table>

					{/* Pagination Footer */}
					<div className="flex items-center justify-between p-3 border-t border-brand-border bg-brand-light-soft text-xs">
						<span className="text-brand-muted">Trang {page}</span>
						<div className="flex gap-2">
							<button
								type="button"
								disabled={page === 1}
								onClick={() => setPage(page - 1)}
								className="px-3 py-1 border border-brand-border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer font-bold transition-all"
							>
								Trước
							</button>
							<button
								type="button"
								disabled={!data || data.length < pageSize}
								onClick={() => setPage(page + 1)}
								className="px-3 py-1 border border-brand-border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer font-bold transition-all"
							>
								Sau
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Create Product Modal */}
			<CreateProductModal
				open={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				shopId={numericShopId}
			/>
		</div>
	);
}
