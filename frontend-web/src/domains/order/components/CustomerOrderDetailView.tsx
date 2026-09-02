import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
	Loader2,
	AlertTriangle,
	Truck,
	Check,
	X,
	Package,
	Calendar,
	User,
	MapPin,
	ShieldCheck,
	Clock
} from "lucide-react";
import {
	useSubOrderDetailQuery,
	useCancelCustomerSubOrderMutation,
	useCompleteSubOrderMutation,
	useCreateRefundMutation,
	useConfirmSubOrderMutation,
	useRejectSubOrderMutation,
	getOrderStatusBadge,
	getPaymentStatusLabel,
} from "@/domains/order";
import { useResolveLocationsQuery, useShipmentBySubOrderQuery } from "@/domains/shipping";
import { PackageReadyModal } from "./sellerOrder/PackageReadyModal";
import { CancelOrderModal } from "./sellerOrder/CancelOrderModal";
import { usePackageReadySubOrderMutation } from "../hooks/useOrders";
import { toast } from "react-toastify";

interface CustomerOrderDetailViewProps {
	subOrderId: string;
	onBack: () => void;
	isSeller?: boolean;
	isAdmin?: boolean;
	onStatusUpdated?: () => void;
}

export function CustomerOrderDetailView({
	subOrderId,
	onBack,
	isSeller = false,
	isAdmin = false,
	onStatusUpdated,
}: CustomerOrderDetailViewProps) {
	const navigate = useNavigate();

	// 1. ALL HOOKS CALLED AT TOP LEVEL UNCONDITIONALLY (Strict Rules of Hooks)
	const { data: detail, isLoading, refetch } = useSubOrderDetailQuery(subOrderId, isSeller);
	const { data: shipment, isLoading: isShipmentLoading } = useShipmentBySubOrderQuery(subOrderId);

	// Customer mutations
	const cancelMutation = useCancelCustomerSubOrderMutation();
	const completeMutation = useCompleteSubOrderMutation();
	const refundMutation = useCreateRefundMutation();

	// Seller mutations
	const confirmSubOrderMutation = useConfirmSubOrderMutation();
	const rejectSubOrderMutation = useRejectSubOrderMutation();
	const packageReadyMutation = usePackageReadySubOrderMutation();

	// Local State
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showCompleteModal, setShowCompleteModal] = useState(false);
	const [showRefundModal, setShowRefundModal] = useState(false);
	const [showNoWalletModal, setShowNoWalletModal] = useState(false);
	const [reason, setReason] = useState("");
	const [errorMessage, setErrorMessage] = useState("");

	// Seller Action Modals state
	const [showSellerRejectModal, setShowSellerRejectModal] = useState(false);
	const [showPackageModal, setShowPackageModal] = useState(false);
	const [pkgWeight, setPkgWeight] = useState(500);
	const [pkgLength, setPkgLength] = useState(10);
	const [pkgWidth, setPkgWidth] = useState(10);
	const [pkgHeight, setPkgHeight] = useState(10);

	// Ward resolution
	const wardId = Number(detail?.shippingAddress?.wardId || 0);
	const { data: resolvedLocations } = useResolveLocationsQuery(wardId > 0 ? [wardId] : []);
	const locationInfo = resolvedLocations && resolvedLocations.length > 0 ? resolvedLocations[0] : null;

	const fullAddressDisplay = useMemo(() => {
		const baseLine = detail?.shippingAddress?.addressLine || "";
		if (locationInfo) {
			return `${baseLine ? `${baseLine}, ` : ""}${locationInfo.wardName}, ${locationInfo.districtName}, ${locationInfo.provinceName}`;
		}
		return baseLine || "N/A";
	}, [detail?.shippingAddress, locationInfo]);

	// Auto compute pre-filled package metrics from items snapshot
	const totalSnapshotWeight = useMemo(() => {
		if (!detail?.orderItems) return 500;
		const sum = detail.orderItems.reduce((acc: number, item: any) => {
			const itemW = item.weightInGrams > 0 ? item.weightInGrams : 500;
			return acc + itemW * (item.quantity || 1);
		}, 0);
		return sum > 0 ? sum : 500;
	}, [detail?.orderItems]);

	const maxSnapshotLength = useMemo(() => {
		if (!detail?.orderItems) return 20;
		const maxL = detail.orderItems.reduce((max: number, item: any) => Math.max(max, item.length || 0), 0);
		return maxL > 0 ? maxL : 20;
	}, [detail?.orderItems]);

	const maxSnapshotWidth = useMemo(() => {
		if (!detail?.orderItems) return 15;
		const maxW = detail.orderItems.reduce((max: number, item: any) => Math.max(max, item.width || 0), 0);
		return maxW > 0 ? maxW : 15;
	}, [detail?.orderItems]);

	const totalSnapshotHeight = useMemo(() => {
		if (!detail?.orderItems) return 10;
		const sumH = detail.orderItems.reduce((acc: number, item: any) => {
			const itemH = item.height > 0 ? item.height : 5;
			return acc + itemH * (item.quantity || 1);
		}, 0);
		return sumH > 0 ? sumH : 10;
	}, [detail?.orderItems]);

	const handleOpenPackagingModal = () => {
		setPkgWeight(totalSnapshotWeight);
		setPkgLength(maxSnapshotLength);
		setWidth(maxSnapshotWidth);
		setPkgHeight(totalSnapshotHeight);
		setShowPackageModal(true);
	};

	const setWidth = (w: number) => setPkgWidth(w);

	// 2. CONDITIONAL RENDERING AFTER ALL HOOKS
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin chi tiết đơn hàng...
			</div>
		);
	}

	if (!detail) {
		return (
			<div className="p-8 text-center text-red-600 font-bold text-xs space-y-4">
				<p>Không thể lấy chi tiết đơn hàng #{String(subOrderId).split("-")[0]}</p>
				<button
					onClick={onBack}
					className="text-xs text-brand-primary hover:underline font-extrabold cursor-pointer"
				>
					&lt;&lt; {isSeller ? "Quay lại danh sách đơn hàng Shop" : "Quay lại đơn hàng của tôi"}
				</button>
			</div>
		);
	}

	const items = detail.orderItems || [];

	const orderTimeStr = detail.createdDate
		? new Date(detail.createdDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
		  " " +
		  new Date(detail.createdDate).toLocaleDateString("vi-VN")
		: "N/A";

	const isCod = !detail.isOnlinePayment || detail.paymentDto?.providerName?.toLowerCase() === "cod";

	// Customer Handlers
	const handleCancelOrder = () => {
		if (!reason.trim()) {
			setErrorMessage("Vui lòng nhập lý do hủy đơn hàng.");
			return;
		}
		cancelMutation.mutate(
			{ subOrderId: detail.id, reason: reason.trim() },
			{
				onSuccess: () => {
					setShowCancelModal(false);
					setReason("");
					setErrorMessage("");
					toast.success("Đã gửi yêu cầu hủy đơn hàng!");
					refetch();
					onStatusUpdated?.();
				},
				onError: (err: any) => {
					setErrorMessage(err?.response?.data?.message || err?.response?.data || "Đã xảy ra lỗi khi hủy đơn.");
				},
			}
		);
	};

	const handleCompleteOrder = () => {
		completeMutation.mutate(detail.id, {
			onSuccess: () => {
				setShowCompleteModal(false);
				setErrorMessage("");
				toast.success("Xác nhận đã nhận hàng thành công!");
				refetch();
				onStatusUpdated?.();
			},
			onError: (err: any) => {
				setErrorMessage(err?.response?.data?.message || err?.response?.data || "Đã xảy ra lỗi khi hoàn tất đơn.");
			},
		});
	};

	const handleRefundOrder = () => {
		if (!reason.trim()) {
			setErrorMessage("Vui lòng nhập lý do yêu cầu hoàn tiền.");
			return;
		}
		refundMutation.mutate(
			{ subOrderId: detail.id, reason: reason.trim() },
			{
				onSuccess: () => {
					setShowRefundModal(false);
					setReason("");
					setErrorMessage("");
					toast.success("Đã gửi yêu cầu trả hàng / hoàn tiền thành công!");
					refetch();
					onStatusUpdated?.();
				},
				onError: (err: any) => {
					const errorMsg =
						err?.response?.data?.message || err?.response?.data || "Đã xảy ra lỗi khi yêu cầu hoàn tiền.";
					if (errorMsg.toLowerCase().includes("ví") || errorMsg.toLowerCase().includes("wallet")) {
						setShowRefundModal(false);
						setShowNoWalletModal(true);
					} else {
						setErrorMessage(errorMsg);
					}
				},
			}
		);
	};

	// Seller Handlers
	const handleSellerConfirm = async () => {
		try {
			await confirmSubOrderMutation.mutateAsync(detail.id);
			toast.success("Xác nhận đơn hàng thành công!");
			refetch();
			onStatusUpdated?.();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Lỗi khi xác nhận đơn");
		}
	};

	const handleSellerRejectSubmit = async (rejectReason: string) => {
		try {
			await rejectSubOrderMutation.mutateAsync({
				subOrderId: detail.id,
				reason: rejectReason,
			});
			toast.success("Đã từ chối / hủy đơn hàng thành công.");
			setShowSellerRejectModal(false);
			refetch();
			onStatusUpdated?.();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Lỗi khi từ chối đơn hàng");
		}
	};

	const handleSellerPackageReady = async () => {
		try {
			await packageReadyMutation.mutateAsync({
				subOrderId: detail.id,
				dimensions: {
					weight: pkgWeight,
					length: pkgLength,
					width: pkgWidth,
					height: pkgHeight,
				},
			});
			toast.success("Đóng gói thành công! Đơn hàng đã sẵn sàng bàn giao cho đơn vị vận chuyển.");
			setShowPackageModal(false);
			refetch();
			onStatusUpdated?.();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Lỗi khi cập nhật trạng thái đóng gói");
		}
	};

	// Actions Availability Checks
	const canCustomerCancel = !isSeller && !isAdmin && ["AwaitingPayment", "AwaitingConfirmation", "Processing"].includes(detail.status);
	const canCustomerCompleteOrRefund = !isSeller && !isAdmin && ["Delivered", "Shipping"].includes(detail.status);

	const canSellerConfirmOrReject = isSeller && !isAdmin && detail.status === "AwaitingConfirmation";
	const canSellerPackage = isSeller && !isAdmin && detail.status === "Processing";

	// Render trạng thái thanh toán chính xác theo COD / Online Payment
	const renderPaymentStatus = () => {
		if (detail.status === "Cancelled" || detail.status === "Rejected") {
			return (
				<p className="text-[10px] font-bold text-red-500 leading-snug">
					Đơn hàng đã bị hủy.
				</p>
			);
		}

		if (isCod) {
			if (["Delivered", "Completed"].includes(detail.status)) {
				return (
					<p className="text-[10px] font-bold text-emerald-600 leading-snug">
						Thanh toán thành công khi nhận hàng.
					</p>
				);
			}
			return (
				<p className="text-[10px] font-bold text-amber-600 leading-snug">
					Chưa thanh toán.
				</p>
			);
		}

		if (detail.status === "AwaitingPayment") {
			return (
				<p className="text-[10px] font-bold text-amber-600 leading-snug">
					Chưa hoàn tất thanh toán. Vui lòng thanh toán lại hoặc chọn phương thức thanh toán khác.
				</p>
			);
		}

		return (
			<p className="text-[10px] font-bold text-emerald-600 leading-snug">
				Thanh toán trực tuyến thành công.
			</p>
		);
	};

	return (
		<div className="space-y-6 text-left text-xs font-sans text-brand-dark animate-in fade-in duration-200">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
						Chi tiết đơn hàng #{String(detail.id).split("-")[0]} - <span>{getOrderStatusBadge(detail.status)}</span>
					</h2>
				</div>
				<span className="text-[11px] text-brand-muted font-bold flex items-center gap-1">
					<Calendar className="w-3.5 h-3.5 text-brand-muted" />
					Ngày đặt hàng: {orderTimeStr}
				</span>
			</div>

			{/* 3 cards grid layout */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* 1. ĐỊA CHỈ NGƯỜI NHẬN */}
				<div className="border border-brand-border rounded-md p-4 bg-white shadow-sm space-y-2">
					<h3 className="font-extrabold text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1">
						<User className="w-3 h-3" />
						Thông tin người nhận
					</h3>
					<div className="space-y-1">
						<p className="font-black text-brand-dark uppercase text-[11px]">
							{detail.shippingAddress?.recipientName || detail.user?.fullName || "Khách hàng"}
						</p>
						<p className="text-brand-muted font-bold leading-relaxed text-[11px]">
							{fullAddressDisplay}
						</p>
						<p className="text-brand-muted font-bold text-[11px]">
							Điện thoại: {detail.shippingAddress?.phone || "N/A"}
						</p>
						{isSeller && detail.user?.email && (
							<p className="text-[10px] text-brand-muted font-medium">
								Email: {detail.user.email}
							</p>
						)}
					</div>
				</div>

				{/* 2. HÌNH THỨC GIAO HÀNG & VẬN ĐƠN */}
				<div className="border border-brand-border rounded-md p-4 bg-white shadow-sm space-y-2">
					<h3 className="font-extrabold text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1">
						<Truck className="w-3 h-3" />
						Hình thức giao hàng
					</h3>
					<div className="space-y-1">
						<p className="font-black text-brand-primary-deep text-[11px]">
							FAST <span className="text-brand-dark font-extrabold">{shipment?.carrierName || "Giao hàng nhanh"}</span>
						</p>
						<p className="text-brand-muted font-bold text-[11px]">
							Phí vận chuyển: {Number(detail.shippingFee).toLocaleString("vi-VN")}đ
						</p>
						{shipment?.waybillCode && (
							<div className="pt-1">
								<span className="text-[10px] text-brand-muted font-bold">Mã vận đơn: </span>
								<span className="font-mono text-[11px] font-black text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
									{shipment.waybillCode}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* 3. HÌNH THỨC THANH TOÁN */}
				<div className="border border-brand-border rounded-md p-4 bg-white shadow-sm space-y-2">
					<h3 className="font-extrabold text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1">
						<ShieldCheck className="w-3 h-3" />
						Hình thức thanh toán
					</h3>
					<div className="space-y-1">
						<p className="font-extrabold text-brand-muted text-[11px]">
							{detail.paymentDto?.title || (detail.isOnlinePayment ? "Thanh toán bằng ví MoMo" : "Thanh toán khi nhận hàng (COD)")}
						</p>
						{renderPaymentStatus()}
					</div>
				</div>
			</div>

			{/* LỊCH SỬ HÀNH TRÌNH VẬN CHUYỂN (SHIPMENT TRACKING LOGS) */}
			{shipment && (
				<div className="border border-brand-border rounded-md p-4 bg-white shadow-sm space-y-3">
					<h3 className="font-extrabold text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
						<Truck className="w-4 h-4 text-brand-primary" />
						Hành trình vận chuyển đơn hàng
						{shipment.waybillCode && (
							<span className="font-mono text-[10px] font-black text-brand-muted lowercase">
								(mã vận đơn: {shipment.waybillCode})
							</span>
						)}
					</h3>

					<div className="space-y-2 pt-1 border-t border-brand-border/60">
						<div className="flex items-start gap-2.5 text-xs font-semibold">
							<div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
							<div className="space-y-0.5">
								<p className="text-brand-dark font-extrabold">
									Trạng thái kiện hàng: {shipment.status || "Đang xử lý"}
								</p>
								<p className="text-[11px] text-brand-muted font-normal">
									{shipment.trackingLogs || `Vận đơn đã được tạo thành công bởi hãng vận chuyển ${shipment.carrierName || "GHN"}.`}
								</p>
							</div>
						</div>

						{shipment.expectedDeliveryDate && (
							<div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-bold pl-4.5">
								<Clock className="w-3.5 h-3.5 text-brand-muted" />
								<span>Dự kiến giao hàng: {new Date(shipment.expectedDeliveryDate).toLocaleDateString("vi-VN")}</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Products Table (With Dimensions Snapshot) */}
			<div className="border border-brand-border rounded-md overflow-hidden shadow-sm bg-white">
				<table className="w-full border-collapse text-left">
					<thead>
						<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
							<th className="p-3 w-45/100">Sản phẩm</th>
							<th className="p-3 text-right">Giá</th>
							<th className="p-3 text-center">Số lượng</th>
							<th className="p-3 text-right">Giảm giá</th>
							<th className="p-3 text-right">Tạm tính</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-brand-border">
						{items.map((item: any, idx: number) => {
							const itemTotal = item.quantity * item.unitPrice;
							const itemDiscount = 0;
							return (
								<tr key={idx} className="hover:bg-brand-light-soft/10 align-top">
									<td className="p-3">
										<div className="flex gap-3">
											<img
												src={item.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
												alt={item.productName}
												className="w-16 h-16 object-cover rounded-md border border-brand-border shrink-0"
											/>
											<div className="space-y-1">
												<h4 className="font-extrabold text-brand-dark text-xs leading-tight">
													{item.productName}
												</h4>
												<span className="inline-block text-[9px] font-black text-brand-primary-deep bg-brand-primary/10 px-1.5 py-0.5 rounded uppercase">
													7 ngày đổi trả
												</span>
												{item.variantName && (
													<p className="text-[10px] font-bold text-brand-muted">Phân loại: {item.variantName}</p>
												)}
												
												{/* Snapshot physical dimensions
												{(item.weightInGrams > 0 || item.length > 0) && (
													<p className="text-[10px] font-bold text-purple-700 bg-purple-50 inline-block px-1.5 py-0.5 rounded">
														Quy cách: {item.weightInGrams || 500}g • {item.length || 0}x{item.width || 0}x{item.height || 0}cm
													</p>
												)} */}

												{!isSeller && (
													<div className="flex gap-2 pt-1">
														<button type="button" className="px-2 py-1 bg-white border border-brand-border hover:bg-brand-light-soft text-[10px] font-black text-brand-dark rounded transition-all cursor-pointer">
															Chat với nhà bán
														</button>
														<button type="button" className="px-2 py-1 bg-white border border-brand-border hover:bg-brand-light-soft text-[10px] font-black text-brand-dark rounded transition-all cursor-pointer">
															Mua lại
														</button>
													</div>
												)}
											</div>
										</div>
									</td>
									<td className="p-3 text-right font-bold text-brand-dark">
										{item.unitPrice.toLocaleString("vi-VN")}đ
									</td>
									<td className="p-3 text-center font-bold text-brand-dark">
										{item.quantity}
									</td>
									<td className="p-3 text-right font-bold text-brand-muted">
										{itemDiscount.toLocaleString("vi-VN")}đ
									</td>
									<td className="p-3 text-right font-black text-brand-dark">
										{itemTotal.toLocaleString("vi-VN")}đ
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Totals Summary */}
			<div className="flex justify-end pt-2">
				<div className="w-full max-w-xs space-y-2 text-right font-bold text-brand-muted text-[11px]">
					<div className="flex justify-between">
						<span>Tạm tính</span>
						<span className="text-brand-dark font-black">{Number(detail.subTotal).toLocaleString("vi-VN")}đ</span>
					</div>
					<div className="flex justify-between">
						<span>Phí vận chuyển</span>
						<span className="text-brand-dark font-black">{Number(detail.shippingFee).toLocaleString("vi-VN")}đ</span>
					</div>
					<div className="flex justify-between text-emerald-600">
						<span>Giảm giá vận chuyển</span>
						<span>-0đ</span>
					</div>
					{detail.shopVoucherCode && (
						<div className="flex justify-between text-emerald-600">
							<span className="flex items-center gap-1">
								<span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded font-black uppercase">Shop Voucher</span>
								<span className="font-mono text-[10px]">[{detail.shopVoucherCode}]</span>
							</span>
							<span>-{Number(detail.sellerDiscount).toLocaleString("vi-VN")}đ</span>
						</div>
					)}
					{detail.platformVoucherCode && (
						<div className="flex justify-between text-emerald-600">
							<span className="flex items-center gap-1">
								<span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[9px] rounded font-black uppercase">Platform Voucher</span>
								<span className="font-mono text-[10px]">[{detail.platformVoucherCode}]</span>
							</span>
							<span>-{Number(detail.platformDiscount).toLocaleString("vi-VN")}đ</span>
						</div>
					)}
					{!detail.shopVoucherCode && !detail.platformVoucherCode && (detail.sellerDiscount + detail.platformDiscount > 0) && (
						<div className="flex justify-between text-emerald-600">
							<span>Giảm giá</span>
							<span>-{Number(detail.sellerDiscount + detail.platformDiscount).toLocaleString("vi-VN")}đ</span>
						</div>
					)}
					<div className="flex justify-between border-t border-brand-border/60 pt-2 text-xs">
						<span className="text-brand-dark font-black">Tổng cộng</span>
						<span className="text-sm font-black text-red-600">
							{Number(detail.grandTotal).toLocaleString("vi-VN")}đ
						</span>
					</div>
				</div>
			</div>

			{/* Action Control Panel for Customer OR Seller */}
			{(canCustomerCancel || canCustomerCompleteOrRefund || canSellerConfirmOrReject || canSellerPackage) && (
				<div className="bg-brand-light-soft/20 border border-brand-border rounded-md p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
					<div className="text-left space-y-0.5">
						<p className="font-extrabold text-brand-dark text-xs">
							{isSeller ? "Thao tác xử lý đơn hàng của Shop" : "Quản lý trạng thái đơn hàng"}
						</p>
						<p className="text-[10px] text-brand-muted font-bold">
							{isSeller
								? "Hãy xác nhận hoặc đóng gói hàng khi đã chuẩn bị xong kiện hàng."
								: "Hãy thực hiện thao tác tương ứng với tiến trình đơn hàng của bạn."}
						</p>
					</div>

					<div className="flex flex-wrap gap-2.5">
						{/* Customer Actions */}
						{canCustomerCancel && (
							<button
								type="button"
								onClick={() => { setShowCancelModal(true); setErrorMessage(""); }}
								className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold rounded-md hover:bg-rose-100 transition-all text-xs cursor-pointer shadow-sm"
							>
								Hủy đơn hàng
							</button>
						)}
						{canCustomerCompleteOrRefund && (
							<>
								<button
									type="button"
									onClick={() => { setShowRefundModal(true); setErrorMessage(""); }}
									className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-extrabold rounded-md hover:bg-amber-100 transition-all text-xs cursor-pointer shadow-sm"
								>
									Yêu cầu trả hàng / Hoàn tiền
								</button>
								<button
									type="button"
									onClick={() => { setShowCompleteModal(true); setErrorMessage(""); }}
									className="px-4 py-2 bg-emerald-600 text-white font-extrabold rounded-md hover:bg-emerald-700 transition-all text-xs cursor-pointer shadow-sm"
								>
									Đã nhận hàng thành công
								</button>
							</>
						)}

						{/* Seller Actions */}
						{canSellerConfirmOrReject && (
							<>
								<button
									type="button"
									onClick={() => setShowSellerRejectModal(true)}
									className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold rounded-md hover:bg-rose-100 transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
								>
									<X className="w-3.5 h-3.5" />
									Từ chối đơn hàng
								</button>
								<button
									type="button"
									onClick={handleSellerConfirm}
									disabled={confirmSubOrderMutation.isPending}
									className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-md transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
								>
									{confirmSubOrderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
									Xác nhận đơn hàng
								</button>
							</>
						)}

						{canSellerPackage && (
							<>
								<button
									type="button"
									onClick={() => setShowSellerRejectModal(true)}
									className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold rounded-md hover:bg-rose-100 transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
								>
									<X className="w-3.5 h-3.5" />
									Hủy đơn hàng
								</button>
								<button
									type="button"
									onClick={handleOpenPackagingModal}
									className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-md transition-all text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
								>
									<Package className="w-3.5 h-3.5" />
									Đóng gói xong & Chuẩn bị bàn giao
								</button>
							</>
						)}
					</div>
				</div>
			)}

			{/* Modal Hủy Đơn Hàng (Customer) */}
			{showCancelModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-md max-w-md w-full border border-brand-border p-5 shadow-xl space-y-4">
						<h3 className="font-black text-brand-dark text-sm uppercase">Yêu cầu hủy đơn hàng</h3>
						<p className="text-brand-muted text-xs leading-normal font-semibold">
							Lưu ý: Bạn chỉ có thể hủy đơn khi nhà bán hàng chưa giao cho hãng vận chuyển. Vui lòng cung cấp lý do hủy để hệ thống ghi nhận.
						</p>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Nhập lý do hủy đơn của bạn tại đây..."
							rows={3}
							className="w-full border border-brand-border rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
						/>
						{errorMessage && <p className="text-[10px] font-bold text-red-600">{errorMessage}</p>}
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => { setShowCancelModal(false); setReason(""); setErrorMessage(""); }}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={handleCancelOrder}
								disabled={cancelMutation.isPending}
								className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-black text-xs cursor-pointer disabled:opacity-50"
							>
								{cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy đơn"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Xác nhận đã nhận hàng (Customer) */}
			{showCompleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-md max-w-md w-full border border-brand-border p-5 shadow-xl space-y-4">
						<div className="flex gap-2.5 items-start text-amber-600">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<h3 className="font-black text-brand-dark text-sm uppercase">Cảnh báo hoàn tất đơn hàng</h3>
						</div>
						<div className="text-brand-muted text-xs leading-relaxed space-y-2 font-medium">
							<p className="font-bold text-red-600">
								* Hãy chắc chắn bạn đã nhận và kiểm tra kỹ số lượng, chất lượng sản phẩm trước khi xác nhận.
							</p>
							<p>
								Sau khi xác nhận đã nhận hàng, đơn hàng được xem là hoàn thành và số tiền sẽ được chuyển trực tiếp vào ví của Seller.
							</p>
							<p className="font-bold">
								Bạn sẽ KHÔNG THỂ thực hiện yêu cầu trả hàng / hoàn tiền cho đơn này nữa.
							</p>
						</div>
						{errorMessage && <p className="text-[10px] font-bold text-red-600">{errorMessage}</p>}
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => { setShowCompleteModal(false); setErrorMessage(""); }}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer"
							>
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={handleCompleteOrder}
								disabled={completeMutation.isPending}
								className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-black text-xs cursor-pointer disabled:opacity-50"
							>
								{completeMutation.isPending ? "Đang xử lý..." : "Tôi đồng ý, hoàn tất đơn hàng"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Yêu cầu hoàn tiền / trả hàng (Customer) */}
			{showRefundModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-md max-w-md w-full border border-brand-border p-5 shadow-xl space-y-4">
						<h3 className="font-black text-brand-dark text-sm uppercase">Yêu cầu hoàn trả hàng & hoàn tiền</h3>
						<p className="text-brand-muted text-xs leading-normal font-semibold">
							Chúng tôi hỗ trợ trả hàng hoàn tiền miễn phí trong vòng 7 ngày kể từ ngày nhận hàng. Vui lòng cung cấp lý do chi tiết và bằng chứng (nếu có) để người bán duyệt yêu cầu.
						</p>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Nhập lý do trả hàng/hoàn tiền chi tiết..."
							rows={3}
							className="w-full border border-brand-border rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
						/>
						{errorMessage && <p className="text-[10px] font-bold text-red-600">{errorMessage}</p>}
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => { setShowRefundModal(false); setReason(""); setErrorMessage(""); }}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={handleRefundOrder}
								disabled={refundMutation.isPending}
								className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-black text-xs cursor-pointer disabled:opacity-50"
							>
								{refundMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu hoàn trả"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Yêu cầu tạo ví (Customer) */}
			{showNoWalletModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-md max-w-md w-full border border-brand-border p-5 shadow-xl space-y-4">
						<div className="flex gap-2.5 items-start text-rose-600">
							<AlertTriangle className="w-5 h-5 shrink-0" />
							<h3 className="font-black text-brand-dark text-sm uppercase">Yêu cầu kích hoạt Ví điện tử</h3>
						</div>
						<div className="text-brand-muted text-xs leading-relaxed space-y-2 font-medium">
							<p>
								Để thực hiện yêu cầu hoàn tiền / trả hàng, bạn bắt buộc phải có ví điện tử được kích hoạt để hệ thống hoàn trả số dư khi được Shop phê duyệt.
							</p>
							<p className="font-bold text-brand-dark">
								Vui lòng đăng ký kích hoạt ví ngay để tiếp tục tạo yêu cầu.
							</p>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowNoWalletModal(false)}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer"
							>
								Hủy bỏ
							</button>
							<button
								type="button"
								onClick={() => {
									setShowNoWalletModal(false);
									navigate("/profile?tab=wallet");
								}}
								className="px-4 py-1.5 bg-brand-dark text-white rounded-md font-black text-xs cursor-pointer hover:bg-brand-primary hover:text-brand-dark transition-all"
							>
								Kích hoạt ví ngay
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Từ chối đơn hàng (Seller) */}
			<CancelOrderModal
				isOpen={showSellerRejectModal}
				onClose={() => setShowSellerRejectModal(false)}
				onSubmit={handleSellerRejectSubmit}
				isPending={rejectSubOrderMutation.isPending}
			/>

			{/* Modal Đóng gói kiện hàng với kích thước snapshot (Seller) */}
			<PackageReadyModal
				isOpen={showPackageModal}
				onClose={() => setShowPackageModal(false)}
				onSubmit={handleSellerPackageReady}
				weight={pkgWeight}
				setWeight={setPkgWeight}
				length={pkgLength}
				setLength={setPkgLength}
				width={pkgWidth}
				setWidth={setPkgWidth}
				height={pkgHeight}
				setHeight={setPkgHeight}
				isPending={packageReadyMutation.isPending}
			/>

			{/* Bottom back link */}
			<div className="pt-4 border-t border-brand-border">
				<button
					type="button"
					onClick={onBack}
					className="text-xs font-black text-brand-primary-deep hover:text-brand-primary transition-all cursor-pointer flex items-center gap-1"
				>
					&lt;&lt; {isAdmin ? "Quay lại danh sách đơn hàng toàn sàn" : isSeller ? "Quay lại danh sách đơn hàng Shop" : "Quay lại đơn hàng của tôi"}
				</button>
			</div>
		</div>
	);
}