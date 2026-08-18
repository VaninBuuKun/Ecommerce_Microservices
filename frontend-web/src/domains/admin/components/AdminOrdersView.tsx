import { useState, useEffect } from "react";
import api from "@/core/api/axiosInstance";
import { Loader2, RefreshCw } from "lucide-react";
import { getOrderStatusBadge } from "@/domains/order";

export function AdminOrdersView() {
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const response = await api.get("/v1/orders/customer/1"); 
			const items = response.data?.value || response.data || [];
			setOrders(items);
		} catch (err) {
			console.error("Lỗi khi tải đơn hàng", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide">Quản lý đơn hàng toàn sàn</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">Danh sách các hóa đơn mua sắm và trạng thái xử lý vận chuyển</p>
				</div>
				<button onClick={fetchOrders} className="p-1.5 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent">
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			<div className="border border-brand-border rounded-lg bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				{loading ? (
					<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách đơn hàng...
					</div>
				) : orders.length === 0 ? (
					<div className="text-center py-16 text-brand-muted font-bold text-xs">Không có đơn hàng nào trên hệ thống.</div>
				) : (
					<table className="w-full text-xs text-left border-collapse">
						<thead>
							<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
								<th className="p-3 w-1/4">Mã đơn con</th>
								<th className="p-3 w-1/4">Cửa hàng</th>
								<th className="p-3 w-1/4 text-right">Tổng giá trị</th>
								<th className="p-3 text-center w-1/6">Trạng thái</th>
								<th className="p-3 text-center w-1/12">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-brand-border">
							{orders.map((o: any) => (
								<tr key={o.id} className="hover:bg-brand-light-soft/10 transition-colors">
									<td className="p-3 font-mono font-bold text-brand-dark">#{o.id.split("-")[0].toUpperCase()}</td>
									<td className="p-3 text-brand-dark font-extrabold">{o.shopName || "Cửa hàng"}</td>
									<td className="p-3 text-right font-black text-brand-dark">{Number(o.grandTotal).toLocaleString("vi-VN")}đ</td>
									<td className="p-3 text-center">{getOrderStatusBadge(o.status)}</td>
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
