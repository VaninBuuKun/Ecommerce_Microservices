import { useSubOrderDetailQuery } from "../../hooks/useOrders";
import { Loader2, Calendar, User, MapPin } from "lucide-react";
import { getOrderStatusBadge, getPaymentStatusLabel } from "../VoucherHelpers";

export function SubOrderDetailView({ subOrderId, isSeller }: { subOrderId: string, isSeller: boolean }) {
	const { data: detail, isLoading } = useSubOrderDetailQuery(subOrderId, isSeller);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-brand-muted text-xs gap-2">
				<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
				Đang tải thông tin chi tiết hóa đơn...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="p-4 text-center text-red-600 font-bold text-xs">
				Không thể lấy chi tiết hóa đơn.
			</div>
		);
	}

	return (
		<div className="border border-brand-border/80 bg-white rounded-xl p-5 shadow-sm max-w-3xl mx-auto text-left relative overflow-hidden font-sans">
			{/* Ribbon status */}
			<div className="absolute top-4 right-4">
				{getOrderStatusBadge(detail.status)}
			</div>

			{/* Bill Header */}
			<div className="border-b border-brand-border pb-3 mb-4">
				<h3 className="text-sm font-black text-brand-dark uppercase tracking-wider">Hóa đơn bán lẻ</h3>
				<div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-brand-muted font-bold">
					<div className="flex items-center gap-1">
						<Calendar className="w-3.5 h-3.5 text-brand-primary" />
						<span>Ngày đặt: {new Date(detail.createdDate).toLocaleString("vi-VN")}</span>
					</div>
					<div>Mã ID: {detail.id}</div>
				</div>
			</div>

			{/* Address details */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-brand-border pb-4 mb-4">
				<div className="space-y-1.5">
					<h4 className="font-extrabold text-brand-dark text-xs uppercase tracking-wide">Thông tin giao nhận</h4>
					<div className="flex items-start gap-1.5 text-xs">
						<User className="w-3.5 h-3.5 text-brand-primary mt-0.5 flex-shrink-0" />
						<span className="font-bold text-brand-dark">
							Khách hàng: {detail.user?.fullName || `ID: ${detail.customerId}`}
							{detail.user?.email && ` (${detail.user.email})`}
						</span>
					</div>
					<div className="flex items-start gap-1.5 text-xs text-brand-muted font-bold">
						<MapPin className="w-3.5 h-3.5 text-brand-muted mt-0.5 flex-shrink-0" />
						<span>
							Người nhận: {detail.shippingAddress?.recipientName} ({detail.shippingAddress?.phone}) <br />
							Địa chỉ nhận hàng: {detail.shippingAddress?.addressLine || "N/A"}
						</span>
					</div>
				</div>
				<div className="space-y-1.5">
					<h4 className="font-extrabold text-brand-dark text-xs uppercase tracking-wide">Phương thức thanh toán</h4>
					<div className="inline-block px-2.5 py-1 bg-brand-light-soft text-brand-dark font-extrabold rounded-lg">
						{detail.paymentDto?.title || (detail.isOnlinePayment ? "Thanh toán trực tuyến" : "Thanh toán khi nhận hàng (COD)")}
					</div>
					{detail.paymentDto?.providerName && (
						<p className="text-[10px] text-brand-muted font-bold mt-1">Cổng thanh toán: {detail.paymentDto.providerName}</p>
					)}
					{detail.paymentDto?.status && (() => {
						const payStatus = getPaymentStatusLabel(detail.paymentDto.status);
						return (
							<p className={`text-[10px] font-bold mt-1 ${payStatus.color}`}>
								Trạng thái: {payStatus.text}
							</p>
						);
					})()}
				</div>
			</div>

			{/* Product Items */}
			<div className="space-y-2 mb-4">
				<h4 className="font-extrabold text-brand-dark text-xs uppercase tracking-wide mb-1.5">Danh sách sản phẩm</h4>
				<div className="border border-brand-border/60 rounded-lg overflow-hidden divide-y divide-brand-border/60">
					{detail.orderItems?.map((item: any) => (
						<div key={item.variantId} className="flex justify-between items-center p-3 hover:bg-brand-light-soft/10">
							<div>
								<div className="font-extrabold text-brand-dark text-xs">{item.productName}</div>
								{item.variantName && (
									<div className="text-[10px] font-bold text-brand-muted bg-brand-light-soft inline-block px-1.5 py-0.2 rounded mt-0.5">
										Phân loại: {item.variantName}
									</div>
								)}
							</div>
							<div className="text-right">
								<div className="font-extrabold text-brand-dark">{item.unitPrice.toLocaleString("vi-VN")}đ</div>
								<div className="text-[10px] text-brand-muted font-bold">Số lượng: {item.quantity}</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Totals payment section */}
			<div className="bg-brand-light-soft/30 rounded-xl p-4 border border-brand-border space-y-2.5">
				<div className="flex justify-between items-center text-xs font-bold text-brand-muted">
					<span>Cộng tiền hàng</span>
					<span className="text-brand-dark">{Number(detail.subTotal).toLocaleString("vi-VN")}đ</span>
				</div>
				<div className="flex justify-between items-center text-xs font-bold text-brand-muted">
					<span>Phí vận chuyển</span>
					<span className="text-brand-dark">{Number(detail.shippingFee).toLocaleString("vi-VN")}đ</span>
				</div>
				{detail.sellerDiscount > 0 && (
					<div className="flex justify-between items-center text-xs font-bold text-emerald-600">
						<span>Giảm giá của Shop</span>
						<span>-{Number(detail.sellerDiscount).toLocaleString("vi-VN")}đ</span>
					</div>
				)}
				{detail.platformDiscount > 0 && (
					<div className="flex justify-between items-center text-xs font-bold text-emerald-600">
						<span>Giảm giá từ Sàn</span>
						<span>-{Number(detail.platformDiscount).toLocaleString("vi-VN")}đ</span>
					</div>
				)}
				<div className="flex justify-between items-center border-t border-brand-border/60 pt-2.5">
					<span className="text-xs font-black text-brand-dark uppercase">Tổng thanh toán</span>
					<span className="text-sm font-black text-brand-primary-deep">{Number(detail.grandTotal).toLocaleString("vi-VN")}đ</span>
				</div>
			</div>
		</div>
	);
}
