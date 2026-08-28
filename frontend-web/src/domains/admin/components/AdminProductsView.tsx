import { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import { Loader2, RefreshCw } from "lucide-react";

export function AdminProductsView() {
	const [products, setProducts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await api.get("/products");
			const items = response.data?.value?.items || response.data?.items || response.data || [];
			setProducts(items);
		} catch (err) {
			console.error("Lỗi khi tải sản phẩm", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProducts();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý sản phẩm hệ thống</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách toàn bộ các sản phẩm đã đăng ký của các shop trên sàn</p>
				</div>
				<button onClick={fetchProducts} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách sản phẩm...
					</div>
				) : products.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có sản phẩm nào trên hệ thống.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/2">Sản phẩm</th>
								<th className="p-3 w-1/4">Giá bán</th>
								<th className="p-3 text-center w-1/8">Trạng thái</th>
								<th className="p-3 text-center w-1/8">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{products.map((p: any) => (
								<tr key={p.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3">
										<div className="flex items-center gap-3">
											<img 
												src={p.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"} 
												alt={p.name} 
												className="w-10 h-10 rounded object-cover border border-brand-border" 
												onError={(e) => {
													(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150";
												}}
											/>
											<div>
												<p className="font-bold text-brand-dark text-xs">{p.name}</p>
												<p className="text-[10px] text-brand-muted font-semibold mt-0.5">Shop ID: {p.shopId}</p>
											</div>
										</div>
									</td>
									<td className="p-3 font-black text-brand-dark">{Number(p.price || 0).toLocaleString("vi-VN")}đ</td>
									<td className="p-3 text-center">
										<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${p.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
											{p.status === "Active" ? "Hoạt động" : "Tạm ẩn"}
										</span>
									</td>
									<td className="p-3 text-center text-brand-muted font-semibold">-</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
