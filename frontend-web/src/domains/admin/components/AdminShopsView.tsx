import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Search, Filter, Ban, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../../../core";

export function AdminShopsView() {
	const [shops, setShops] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [banningId, setBanningId] = useState<number | null>(null);

	const fetchShops = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			params.append("pageNumber", String(page));
			params.append("pageSize", String(pageSize));
			if (searchTerm.trim()) params.append("searchTerm", searchTerm.trim());
			if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);

			const response = await api.get(`/shop/all?${params.toString()}`).catch(() => null);
			const data = response?.data;

			if (data && data.items) {
				setShops(data.items);
				setTotalCount(data.totalCount || 0);
			} else {
				const items = Array.isArray(data) ? data : [];
				setShops(items);
				setTotalCount(items.length);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách shop", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchShops();
	}, [page, statusFilter]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchShops();
	};

	const handleBanShop = async (shopId: number, shopName: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn KHÓA (BAN) gian hàng "${shopName}"?`)) return;

		try {
			setBanningId(shopId);
			await api.put(`/shop/${shopId}/ban`);
			toast.success(`Đã khóa gian hàng "${shopName}" thành công!`);
			fetchShops();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Không thể khóa gian hàng");
		} finally {
			setBanningId(null);
		}
	};

	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	// Tạo mảng số trang hiển thị dạng nút số
	const getPageNumbers = () => {
		const pages = [];
		const maxVisible = 5;
		let start = Math.max(1, page - Math.floor(maxVisible / 2));
		let end = Math.min(totalPages, start + maxVisible - 1);

		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	};

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý gian hàng (Shops)</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các cửa hàng người bán hoạt động kinh doanh trên hệ thống</p>
				</div>
				<button onClick={fetchShops} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent" title="Làm mới">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			{/* Filter & Search Bar */}
			<div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
				<form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-sm">
					<input
						type="text"
						placeholder="Tìm theo tên shop, mô tả hoặc ID..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary"
					/>
					<Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
				</form>

				{/* Align Filter icon inside input-like box or neatly adjacent */}
				<div className="relative inline-flex items-center w-full sm:w-auto">
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setPage(1);
						}}
						className="h-9 pl-9 pr-8 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary cursor-pointer font-bold text-brand-dark appearance-none shadow-xs"
					>
						<option value="All">Tất cả trạng thái</option>
						<option value="Active">Đang hoạt động (Active)</option>
						<option value="Pending">Chờ duyệt (Pending)</option>
						<option value="Suspended">Tạm dừng (Suspended)</option>
						<option value="Banned">Bị khóa (Banned)</option>
					</select>
					<Filter className="w-3.5 h-3.5 text-brand-muted absolute left-3 pointer-events-none" />
					<div className="absolute right-3 pointer-events-none text-brand-muted text-[10px]">▼</div>
				</div>
			</div>

			<div className="border border-brand-border rounded-md bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách shops...
					</div>
				) : shops.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không tìm thấy cửa hàng nào phù hợp.</div>
				) : (
					<>
						<table className="w-full text-xs text-left border-collapse table-fixed">
							<thead>
								<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
									<th className="p-3 w-[26%]">Gian hàng</th>
									<th className="p-3 w-[14%]">Customer ID</th>
									<th className="p-3 w-[28%]">Mô tả giới thiệu</th>
									<th className="p-3 w-[12%]">Ngày tạo</th>
									<th className="p-3 text-center w-[10%]">Trạng thái</th>
									<th className="p-3 text-center w-[10%]">Hành động</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border">
								{shops.map((s: any) => (
									<tr key={s.id} className="hover:bg-brand-light-soft/10 transition-colors">
										<td className="p-3">
											<div className="flex items-center gap-3">
												<img
													src={s.logoUrl || s.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${s.name}`}
													alt={s.name}
													className="w-9 h-9 rounded-md object-cover border border-brand-border bg-brand-light-soft shrink-0"
													onError={(e) => {
														(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${s.name}`;
													}}
												/>
												<div className="min-w-0">
													<a
														href={`/shops/${s.id}`}
														target="_blank"
														rel="noopener noreferrer"
														className="font-extrabold text-brand-dark text-xs hover:text-brand-primary-deep flex items-center gap-1 transition-colors group cursor-pointer"
														title="Xem trang gian hàng public"
													>
														<span className="truncate">{s.name}</span>
														<ExternalLink className="w-3 h-3 text-brand-muted group-hover:text-brand-primary-deep shrink-0" />
													</a>
													<p className="text-[10px] text-brand-muted font-mono">Shop ID: #{s.id}</p>
												</div>
											</div>
										</td>

										{/* Customer ID Column */}
										<td className="p-3 font-mono font-bold text-brand-dark text-[11px]">
											User #{s.ownerUserId}
										</td>

										{/* Description truncated with ... */}
										<td className="p-3 text-brand-muted font-medium" title={s.description}>
											<p className="truncate max-w-[240px]">
												{s.description || "Chưa cập nhật mô tả"}
											</p>
										</td>

										<td className="p-3 text-brand-muted font-bold text-[11px]">
											{new Date(s.createdDate).toLocaleDateString("vi-VN")}
										</td>

										<td className="p-3 text-center">
											<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${s.status === "Active"
												? "bg-emerald-50 text-emerald-700 border border-emerald-200"
												: s.status === "Banned"
													? "bg-red-50 text-red-700 border border-red-200"
													: "bg-yellow-50 text-yellow-700 border border-yellow-200"
												}`}>
												{s.status === "Active" ? "Hoạt động" : s.status === "Banned" ? "Đã khóa" : s.status}
											</span>
										</td>

										{/* Ban Action Button */}
										<td className="p-3 text-center">
											{s.status !== "Banned" ? (
												<button
													onClick={() => handleBanShop(s.id, s.name)}
													disabled={banningId === s.id}
													className="px-2.5 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-md text-[10px] font-black transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
													title="Khóa gian hàng này"
												>
													{banningId === s.id ? (
														<Loader2 className="w-3 h-3 animate-spin" />
													) : (
														<Ban className="w-3 h-3" />
													)}
													Khóa
												</button>
											) : (
												<span className="text-[10px] text-brand-muted font-bold italic">Đã bị khóa</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{/* Numbered Pagination Controls */}
						<div className="flex items-center justify-between p-3 border-t border-brand-border bg-brand-light-soft/30 text-xs">
							<span className="text-brand-muted font-bold text-[11px]">
								Tổng số: <strong className="text-brand-dark">{totalCount}</strong> gian hàng
							</span>
							<div className="flex items-center gap-1">
								<button
									type="button"
									disabled={page <= 1}
									onClick={() => setPage(page - 1)}
									className="px-2.5 py-1 border border-brand-border bg-white rounded-md disabled:opacity-40 hover:bg-brand-light-soft cursor-pointer font-bold text-[11px] transition-all"
								>
									&laquo;
								</button>

								{getPageNumbers().map((num) => (
									<button
										key={num}
										onClick={() => setPage(num)}
										className={`w-7 h-7 flex items-center justify-center rounded-md border text-[11px] font-black transition-all cursor-pointer ${page === num
											? "bg-brand-dark text-white border-brand-dark shadow-xs"
											: "bg-white border-brand-border text-brand-dark hover:bg-brand-light-soft"
											}`}
									>
										{num}
									</button>
								))}

								<button
									type="button"
									disabled={page >= totalPages}
									onClick={() => setPage(page + 1)}
									className="px-2.5 py-1 border border-brand-border bg-white rounded-md disabled:opacity-40 hover:bg-brand-light-soft cursor-pointer font-bold text-[11px] transition-all"
								>
									&raquo;
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

