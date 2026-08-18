import { useState } from "react";
import { Package, ArrowLeftRight, Loader2, Calendar } from "lucide-react";
import { useCustomerOrdersQuery, useMyRefundsQuery } from "../hooks/useOrders";

export function MyOrdersTab({ customerId }: { customerId?: number }) {
	const { data: orders = [], isLoading } = useCustomerOrdersQuery(String(customerId || 1));

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Đơn hàng của tôi
				</h2>
				<p className="text-xs text-brand-muted">
					Theo dõi danh sách các đơn hàng và trạng thái vận chuyển của bạn.
				</p>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-12 text-xs text-brand-muted gap-2">
					<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải lịch sử mua hàng...
				</div>
			) : orders.length === 0 ? (
				<div className="text-center py-12 text-brand-muted font-bold text-xs space-y-2">
					<Package className="w-8 h-8 text-brand-muted mx-auto opacity-50" />
					<p>Bạn chưa có đơn hàng nào.</p>
				</div>
			) : (
				<div className="space-y-4">
					{orders.map((order: any) => (
						<div key={order.id} className="p-4 border border-brand-border rounded-2xl bg-white space-y-3 shadow-xs">
							<div className="flex items-center justify-between border-b border-brand-border pb-2 text-xs">
								<span className="font-mono font-bold text-brand-dark">Đơn hàng #{String(order.id).slice(0, 8).toUpperCase()}</span>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
									{order.status || "Đang xử lý"}
								</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<div className="flex items-center gap-1.5 text-brand-muted font-medium">
									<Calendar className="w-3.5 h-3.5" />
									{new Date(order.createdDate || Date.now()).toLocaleDateString("vi-VN")}
								</div>
								<div className="font-black text-brand-dark">
									Tổng tiền: <span className="text-brand-primary-deep text-sm">{(order.grandTotal || 0).toLocaleString("vi-VN")}đ</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export function RefundRequestsTab() {
	const { data: refunds = [], isLoading } = useMyRefundsQuery();

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Yêu cầu hoàn tiền
				</h2>
				<p className="text-xs text-brand-muted">
					Theo dõi các khiếu nại trả hàng / hoàn tiền của bạn gửi cho các shop.
				</p>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-12 text-xs text-brand-muted gap-2">
					<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách khiếu nại...
				</div>
			) : refunds.length === 0 ? (
				<div className="text-center py-12 text-brand-muted font-bold text-xs space-y-2">
					<ArrowLeftRight className="w-8 h-8 text-brand-muted mx-auto opacity-50" />
					<p>Bạn chưa gửi yêu cầu hoàn tiền nào.</p>
				</div>
			) : (
				<div className="space-y-4">
					{refunds.map((ref: any) => (
						<div key={ref.id} className="p-4 border border-brand-border rounded-2xl bg-white space-y-2 shadow-xs">
							<div className="flex items-center justify-between text-xs">
								<span className="font-bold text-brand-dark">Lý do: {ref.reason}</span>
								<span className="font-black text-brand-primary-deep">{(ref.refundAmount || 0).toLocaleString("vi-VN")}đ</span>
							</div>
							<p className="text-[11px] text-brand-muted font-medium">Trạng thái: <span className="font-bold text-brand-dark">{ref.status}</span></p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
