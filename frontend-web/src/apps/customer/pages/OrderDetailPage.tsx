import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
	Package,
	Truck,
	CheckCircle2,
	Clock,
	AlertCircle,
	ArrowLeft,
	MapPin,
	Phone,
	User,
	Store,
	FileText,
} from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

interface OrderDetail {
	id: string;
	orderId: string;
	shopId: number;
	shopName?: string;
	status: string;
	subTotal: number;
	shippingFee: number;
	discountAmount: number;
	grandTotal: number;
	recipientName: string;
	recipientPhone: string;
	shippingAddress: string;
	trackingCode?: string;
	items: Array<{
		id: string;
		productName: string;
		variantName?: string;
		unitPrice: number;
		quantity: number;
		thumbnailUrl?: string;
	}>;
	createdAt: string;
}

const ORDER_STATUS_STEPS = [
	{ key: "AwaitingPayment", label: "Chờ Thanh Toán", icon: Clock },
	{ key: "AwaitingConfirmation", label: "Chờ Xác Nhận", icon: FileText },
	{ key: "Processing", label: "Đang Xử Lý", icon: Package },
	{ key: "PackageReady", label: "Đóng Gói Xong", icon: Package },
	{ key: "Shipping", label: "Đang Giao Hàng", icon: Truck },
	{ key: "Delivered", label: "Đã Giao Hàng", icon: CheckCircle2 },
	{ key: "Completed", label: "Hoàn Thành", icon: CheckCircle2 },
];

export function OrderDetailPage() {
	const { subOrderId } = useParams<{ subOrderId: string }>();
	const [order, setOrder] = useState<OrderDetail | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchOrderDetail = async () => {
			if (!subOrderId) return;
			try {
				setIsLoading(true);
				const res = await api.get(`/orders/suborder/${subOrderId}/detail`);
				const data = res.data?.value || res.data;
				setOrder(data);
			} catch (err: any) {
				console.error("Lỗi tải chi tiết đơn hàng:", err);
				toast.error("Không thể tải thông tin chi tiết đơn hàng.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchOrderDetail();
	}, [subOrderId]);

	if (isLoading) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-brand-muted text-xs">
				<div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
				Đang tải thông tin đơn hàng...
			</div>
		);
	}

	if (!order) {
		return (
			<div className="max-w-md mx-auto py-16 px-6 text-center space-y-4 font-sans">
				<AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
				<h2 className="text-base font-bold text-brand-dark">Không tìm thấy thông tin đơn hàng</h2>
				<p className="text-xs text-brand-muted">Mã đơn hàng không hợp lệ hoặc đã bị di dời.</p>
				<Link
					to="/orders"
					className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-brand-dark text-xs font-bold rounded-xl"
				>
					<ArrowLeft className="w-4 h-4" /> Quay lại danh sách đơn hàng
				</Link>
			</div>
		);
	}

	// Status Index for Timeline
	const currentStatusIndex = ORDER_STATUS_STEPS.findIndex(
		(s) => s.key.toLowerCase() === (order.status || "").toLowerCase()
	);

	return (
		<div className="min-h-screen bg-brand-light font-sans text-brand-dark pb-16">
			{/* Header */}
			<div className="bg-white border-b border-brand-border px-6 py-4 shadow-xs">
				<div className="max-w-5xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link
							to="/orders"
							className="p-2 hover:bg-brand-light-soft rounded-xl transition-colors text-brand-muted hover:text-brand-dark"
						>
							<ArrowLeft className="w-5 h-5" />
						</Link>
						<div>
							<h1 className="text-lg font-black text-brand-dark tracking-tight">
								Theo Dõi Đơn Hàng #{order.id}
							</h1>
							<p className="text-xs text-brand-muted font-bold">
								Đơn hàng tổng #{order.orderId} • Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
							</p>
						</div>
					</div>
					<span className="px-3 py-1 bg-brand-primary/10 text-brand-dark border border-brand-primary/30 text-xs font-extrabold rounded-full">
						{order.status}
					</span>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-6 text-left">
				{/* 1. TIMELINE TRẠNG THÁI GIAO HÀNG */}
				<div className="bg-white border border-brand-border rounded-2xl p-6 shadow-xs space-y-6">
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
						<Truck className="w-4 h-4 text-brand-primary" />
						Hành Trình Vận Chuyển Đơn Hàng
					</h2>

					<div className="relative flex items-center justify-between max-w-3xl mx-auto px-2">
						{/* Progress line */}
						<div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-0" />
						<div
							className="absolute top-1/2 left-0 h-1 bg-brand-primary -translate-y-1/2 -z-0 transition-all duration-500"
							style={{
								width: `${currentStatusIndex >= 0 ? (currentStatusIndex / (ORDER_STATUS_STEPS.length - 1)) * 100 : 0}%`,
							}}
						/>

						{ORDER_STATUS_STEPS.map((step, idx) => {
							const Icon = step.icon;
							const isPassed = currentStatusIndex >= idx;
							const isCurrent = currentStatusIndex === idx;

							return (
								<div key={step.key} className="flex flex-col items-center gap-2 relative z-10">
									<div
										className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
											isCurrent
												? "bg-brand-dark text-white ring-4 ring-brand-primary/30 font-black shadow-md scale-110"
												: isPassed
												? "bg-brand-primary text-brand-dark font-bold"
												: "bg-slate-100 text-slate-400"
										}`}
									>
										<Icon className="w-4 h-4" />
									</div>
									<span
										className={`text-[10px] font-bold text-center leading-tight max-w-[70px] ${
											isCurrent ? "text-brand-dark font-black" : isPassed ? "text-brand-dark" : "text-slate-400"
										}`}
									>
										{step.label}
									</span>
								</div>
							);
						})}
					</div>

					{order.trackingCode && (
						<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold">
							<span className="text-brand-muted">Mã vận đơn GHN Logistics:</span>
							<span className="font-mono text-brand-dark bg-white px-2.5 py-1 rounded border border-slate-300">
								{order.trackingCode}
							</span>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* 2. THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ */}
					<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-3 md:col-span-1">
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-2.5">
							<MapPin className="w-4 h-4 text-brand-primary" />
							Địa Chỉ Nhận Hàng
						</h3>
						<div className="space-y-2 text-xs">
							<div className="flex items-center gap-2 font-bold text-brand-dark">
								<User className="w-3.5 h-3.5 text-brand-muted shrink-0" />
								<span>{order.recipientName}</span>
							</div>
							<div className="flex items-center gap-2 font-semibold text-brand-muted">
								<Phone className="w-3.5 h-3.5 text-brand-muted shrink-0" />
								<span>{order.recipientPhone}</span>
							</div>
							<p className="text-[11px] text-brand-dark font-medium leading-relaxed pt-1 border-t border-slate-100">
								{order.shippingAddress}
							</p>
						</div>
					</div>

					{/* 3. DANH SÁCH SẢN PHẨM ĐƠN HÀNG */}
					<div className="bg-white border border-brand-border rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
						<div className="flex items-center justify-between border-b border-brand-border pb-2.5">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-2">
								<Store className="w-4 h-4 text-brand-primary" />
								Sản Phẩm Đã Đặt ({order.items.length})
							</h3>
							{order.shopName && (
								<span className="text-[11px] font-extrabold text-brand-primary-deep bg-brand-primary/10 px-2.5 py-0.5 rounded-md">
									{order.shopName}
								</span>
							)}
						</div>

						<div className="divide-y divide-slate-100">
							{order.items.map((item) => (
								<div key={item.id} className="py-3 flex items-center gap-3">
									<img
										src={item.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80"}
										alt={item.productName}
										className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-50"
									/>
									<div className="flex-1 min-w-0">
										<h4 className="text-xs font-bold text-brand-dark truncate">{item.productName}</h4>
										{item.variantName && (
											<span className="text-[10px] text-brand-muted font-semibold block mt-0.5">
												Phân loại: {item.variantName}
											</span>
										)}
										<span className="text-[11px] text-brand-muted font-bold block mt-1">
											x{item.quantity} • {item.unitPrice.toLocaleString("vi-VN")}đ
										</span>
									</div>
									<span className="text-xs font-black text-brand-dark shrink-0">
										{(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
									</span>
								</div>
							))}
						</div>

						{/* Thanh Toán Summary */}
						<div className="pt-3 border-t border-brand-border/60 space-y-1.5 text-xs font-semibold text-brand-dark">
							<div className="flex justify-between text-brand-muted">
								<span>Tạm tính sản phẩm:</span>
								<span>{order.subTotal.toLocaleString("vi-VN")}đ</span>
							</div>
							<div className="flex justify-between text-brand-muted">
								<span>Phí vận chuyển:</span>
								<span>+{order.shippingFee.toLocaleString("vi-VN")}đ</span>
							</div>
							{order.discountAmount > 0 && (
								<div className="flex justify-between text-emerald-600">
									<span>Giảm giá voucher:</span>
									<span>-{order.discountAmount.toLocaleString("vi-VN")}đ</span>
								</div>
							)}
							<div className="flex justify-between font-black text-sm text-red-600 pt-2 border-t border-slate-200">
								<span>Tổng thanh toán:</span>
								<span>{order.grandTotal.toLocaleString("vi-VN")}đ</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default OrderDetailPage;
