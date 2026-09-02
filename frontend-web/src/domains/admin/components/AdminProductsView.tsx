import { useState } from "react";
import { Loader2, RefreshCw, Search, Package, Store } from "lucide-react";
import { useAdminProductsQuery } from "@/domains/admin";
import { Pagination } from "@/shared/components/Pagination";

export function AdminProductsView() {
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [shopIdFilter, setShopIdFilter] = useState<string>("");

	const { data, isLoading, refetch, isFetching } = useAdminProductsQuery({
		page,
		pageSize,
		searchTerm: searchTerm.trim() || undefined,
		status: statusFilter || undefined,
		shopId: shopIdFilter ? Number(shopIdFilter) : undefined,
	});

	const products = data?.items || [];
	const totalCount = data?.totalCount || 0;
	const totalPages = data?.totalPages || Math.ceil(totalCount / pageSize) || 1;

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Header */}
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Quản lý sản phẩm hệ thống
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Danh sách toàn bộ các sản phẩm của tất cả các gian hàng trên sàn
					</p>
				</div>
				<button
					onClick={() => refetch()}
					disabled={isFetching}
					className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent disabled:opacity-50"
					title="Làm mới danh sách"
				>
					<RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-brand-primary" : ""}`} />
				</button>
			</div>

			{/* Filter Bar */}
			<div className="bg-white border border-brand-border rounded-md p-3 flex flex-col md:flex-row gap-3 items-end">
				<div className="flex-1 w-full space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Tìm kiếm sản phẩm
					</label>
					<div className="relative">
						<input
							type="text"
							placeholder="Nhập tên sản phẩm hoặc từ khóa..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setPage(1);
							}}
							className="w-full h-8 pl-8 pr-3 text-xs bg-brand-light-soft/30 border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-semibold"
						/>
						<Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-muted" />
					</div>
				</div>

				<div className="w-full md:w-36 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Lọc theo Shop
					</label>
					<input
						type="number"
						placeholder="Nhập Shop ID..."
						value={shopIdFilter}
						onChange={(e) => {
							setShopIdFilter(e.target.value);
							setPage(1);
						}}
						className="w-full h-8 px-2.5 text-xs bg-brand-light-soft/30 border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-semibold"
					/>
				</div>

				<div className="w-full md:w-36 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Trạng thái
					</label>
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setPage(1);
						}}
						className="w-full h-8 px-2.5 text-xs bg-brand-light-soft/30 border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
					>
						<option value="">Tất cả trạng thái</option>
						<option value="Active">Hoạt động (Active)</option>
						<option value="Inactive">Tạm ẩn (Inactive)</option>
					</select>
				</div>
			</div>

			{/* Products Table */}
			<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{isLoading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách sản phẩm...
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-16 text-brand-muted space-y-2">
						<Package className="w-10 h-10 mx-auto text-brand-muted/50" />
						<p className="font-bold text-xs">Không tìm thấy sản phẩm nào phù hợp.</p>
					</div>
				) : (
					<div>
						<div className="overflow-x-auto">
							<table className="w-full text-xs text-left border-collapse">
								<thead>
									<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
										<th className="p-3 w-12 text-center">ID</th>
										<th className="p-3 min-w-[220px]">Sản phẩm</th>
										<th className="p-3 w-36">Gian hàng</th>
										<th className="p-3 w-32 text-right">Giá niêm yết</th>
										<th className="p-3 w-24 text-center">Đã bán</th>
										<th className="p-3 w-28 text-center">Trạng thái</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border/60">
									{products.map((p: any) => (
										<tr key={p.id} className="hover:bg-brand-light-soft/10 transition-colors">
											<td className="p-3 text-center font-mono font-bold text-brand-muted text-[11px]">
												#{p.id}
											</td>
											<td className="p-3">
												<div className="flex items-center gap-3">
													<img
														src={p.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
														alt={p.name}
														className="w-10 h-10 rounded-md object-cover border border-brand-border shrink-0"
														onError={(e) => {
															(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150";
														}}
													/>
													<div className="min-w-0">
														<p className="font-bold text-brand-dark text-xs truncate max-w-[280px]" title={p.name}>
															{p.name}
														</p>
														{p.categoryName && (
															<p className="text-[10px] text-brand-muted font-medium mt-0.5">
																Danh mục: {p.categoryName}
															</p>
														)}
													</div>
												</div>
											</td>
											<td className="p-3">
												<div className="flex items-center gap-1 text-[11px] font-bold text-brand-dark">
													<Store className="w-3 h-3 text-brand-muted shrink-0" />
													<span>Shop #{p.shopId}</span>
												</div>
											</td>
											<td className="p-3 text-right font-black text-brand-dark">
												{Number(p.price || 0).toLocaleString("vi-VN")}đ
											</td>
											<td className="p-3 text-center font-bold text-brand-muted">
												{p.sold ?? 0}
											</td>
											<td className="p-3 text-center">
												<span
													className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase inline-block ${
														p.status === "Active"
															? "bg-emerald-50 text-emerald-700 border border-emerald-200"
															: "bg-slate-100 text-slate-700 border border-slate-200"
													}`}
												>
													{p.status === "Active" ? "Hoạt động" : "Tạm ẩn"}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Unified Pagination */}
						<div className="px-4 py-2 border-t border-brand-border bg-brand-light-soft/20 text-xs">
							<Pagination
								currentPage={page}
								totalPages={totalPages}
								totalCount={totalCount}
								pageSize={pageSize}
								onPageChange={setPage}
								showQuickJumper
								showTotal
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
