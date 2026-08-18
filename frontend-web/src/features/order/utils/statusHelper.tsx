
export interface StatusStyle {
	text: string;
	color: string; // Tailwind class background & text
}

export const getOrderStatusInfo = (status: string): StatusStyle => {
	switch (status) {
		case "AwaitingPayment":
			return { text: "Chờ thanh toán", color: "bg-gray-100 text-gray-700" };
		case "AwaitingConfirmation":
			return { text: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" };
		case "Processing":
			return { text: "Đang chuẩn bị hàng", color: "bg-blue-100 text-blue-800" };
		case "PackageReady":
			return { text: "Chờ shipper lấy", color: "bg-purple-100 text-purple-800" };
		case "Shipping":
			return { text: "Đang vận chuyển", color: "bg-indigo-100 text-indigo-800" };
		case "Delivered":
			return { text: "Đã giao hàng", color: "bg-green-100 text-green-800" };
		case "Returning":
			return { text: "Đang hoàn hàng", color: "bg-pink-100 text-pink-800" };
		case "Refunded":
			return { text: "Đã hoàn tiền", color: "bg-rose-100 text-rose-800" };
		case "Completed":
			return { text: "Đã hoàn tất", color: "bg-emerald-100 text-emerald-800" };
		case "Cancelled":
			return { text: "Đã hủy đơn", color: "bg-red-100 text-red-800" };
		default:
			return { text: status, color: "bg-gray-100 text-gray-800" };
	}
};

export const getOrderStatusBadge = (status: string, className = "") => {
	const info = getOrderStatusInfo(status);
	return (
		<span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap ${info.color} ${className}`}>
			{info.text}
		</span>
	);
};

export const getPaymentStatusLabel = (status: string) => {
	switch (status?.toLowerCase()) {
		case "unpaid":
			return { text: "Chưa thanh toán", color: "text-amber-600" };
		case "paid":
			return { text: "Đã thanh toán", color: "text-emerald-600 font-extrabold" };
		case "failed":
			return { text: "Thanh toán thất bại", color: "text-red-600 font-extrabold" };
		default:
			return { text: status, color: "text-brand-muted" };
	}
};
