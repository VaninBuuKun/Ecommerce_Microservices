import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	MapPin,
	Phone,
	User,
	Plus,
	X,
	ArrowLeft,
	Loader2,
	Store,
	CreditCard,
	Ticket,
	ShieldCheck,
	Check,
	ChevronDown,
	ShoppingCart,
	Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useCartQuery } from "../cart/hooks/useCartQuery";
import {
	useAddressesQuery,
	useCalculateTotalMutation,
	useCheckoutMutation,
	useSetDefaultAddressMutation,
	useDeleteAddressMutation,
	usePaymentMethodsQuery,
} from "./hooks/useCheckoutQueries";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "../catalog/hooks/useLocationQueries";
import type { UserAddress } from "./types";
import { NewAddressModal } from "./components/NewAddressModal";

export default function CheckoutPage() {
	const navigate = useNavigate();

	// State
	const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);
	const [showNewAddressModal, setShowNewAddressModal] = useState(false);

	// React queries & mutations
	const { data: cart, isLoading: isCartLoading } = useCartQuery();
	const { data: addresses, isLoading: isAddressesLoading, refetch: refetchAddresses } = useAddressesQuery();
	const calculateTotalMutation = useCalculateTotalMutation();
	const checkoutMutation = useCheckoutMutation();
	const setDefaultAddressMutation = useSetDefaultAddressMutation();
	const deleteAddressMutation = useDeleteAddressMutation();
	const { data: paymentMethods } = usePaymentMethodsQuery();

	// Location Queries
	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery(selectedAddress?.provinceId);
	const { data: wards } = useWardsQuery(selectedAddress?.districtId);



	// Payment Method State
	// Providers: "cod", "momo", "vnpay", etc. (lowercase)
	const [paymentProvider, setPaymentProvider] = useState<string>("cod");

	// Checkout session calculations from backend
	const [calcResult, setCalcResult] = useState<any>(null);
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

	// Store vouchers state
	const [shopVouchers, setShopVouchers] = useState<Record<number, string>>({});

	// General order success screen state
	const [isSuccess, setIsSuccess] = useState(false);
	const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

	// Selected items in cart
	const shopGroups = cart?.shopGroups || [];
	const selectedItems = shopGroups.flatMap((group) =>
		(group.items || []).filter((item) => item.isSelected)
	);

	// Sync default address on load
	useEffect(() => {
		if (addresses && addresses.length > 0) {
			const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
			setSelectedAddress(defaultAddr);
		}
	}, [addresses]);

	// Sync default payment provider from API results
	useEffect(() => {
		if (paymentMethods && paymentMethods.length > 0) {
			const activeMethods = paymentMethods.filter((m) => m.isActive);
			if (activeMethods.length > 0) {
				const hasSelectedActive = activeMethods.some((m) => m.providerName === paymentProvider);
				if (!hasSelectedActive) {
					setPaymentProvider(activeMethods[0].providerName);
				}
			}
		}
	}, [paymentMethods]);

	// Trigger calculate API when selectedAddress changes or items change
	useEffect(() => {
		if (selectedAddress && selectedItems.length > 0) {
			calculateTotalMutation.mutate(
				{
					userAddressId: selectedAddress.id,
					checkoutSessionId: checkoutSessionId,
					shopShippingSelections: null, // use default shipping method
				},
				{
					onSuccess: (res: any) => {
						const data = res?.value || res;
						setCalcResult(data);
						setCheckoutSessionId(data?.id);
					},
					onError: (err: any) => {
						toast.error(err?.response?.data || "Lỗi khi tính phí vận chuyển");
					},
				}
			);
		}
	}, [selectedAddress, selectedItems.length]);

	// Loading wrapper
	if (isCartLoading || isAddressesLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-brand-muted text-xs">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin thanh toán...
			</div>
		);
	}

	// Redirect back if giỏ hàng has no selected items
	if (selectedItems.length === 0 && !isSuccess) {
		return (
			<div className="max-w-md mx-auto text-center py-16 px-6 space-y-6">
				<div className="w-16 h-16 bg-brand-light-soft rounded-full flex items-center justify-center mx-auto text-brand-muted">
					<ShoppingCart className="w-8 h-8" />
				</div>
				<h3 className="font-bold text-brand-dark text-base">Không có sản phẩm thanh toán</h3>
				<p className="text-xs text-brand-muted leading-relaxed">
					Giỏ hàng của bạn chưa có sản phẩm nào được chọn để thanh toán.
				</p>
				<Link
					to="/cart"
					className="inline-flex items-center justify-center h-9 px-6 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-xs rounded-lg transition-colors"
				>
					Quay lại giỏ hàng
				</Link>
			</div>
		);
	}

	// Handles
	const handleSelectAddress = (addr: UserAddress) => {
		setSelectedAddress(addr);
		setShowAddressModal(false);
	};

	const handleSetDefaultAddress = (e: React.MouseEvent, addrId: string) => {
		e.stopPropagation();
		setDefaultAddressMutation.mutate(addrId, {
			onSuccess: () => {
				toast.success("Đã thiết lập địa chỉ mặc định mới!");
				refetchAddresses();
			},
			onError: (err: any) => {
				toast.error(err?.response?.data || "Cài đặt mặc định thất bại!");
			},
		});
	};

	const handleDeleteAddress = (e: React.MouseEvent, addrId: string) => {
		e.stopPropagation();
		if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
			deleteAddressMutation.mutate(addrId, {
				onSuccess: () => {
					toast.success("Xóa địa chỉ thành công!");
					refetchAddresses();
					if (selectedAddress?.id === addrId) {
						setSelectedAddress(null);
					}
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Xóa địa chỉ thất bại!");
				},
			});
		}
	};



	const handlePlaceOrder = () => {
		if (!selectedAddress) {
			toast.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng!");
			return;
		}
		if (!checkoutSessionId) {
			toast.error("Không tìm thấy phiên giao dịch tính toán. Vui lòng thử lại!");
			return;
		}

		checkoutMutation.mutate(
			{
				paymentProvider: paymentProvider,
				checkoutSessionId: checkoutSessionId,
			},
			{
				onSuccess: (data) => {
					if (data.paymentUrl) {
						// Redirect to Momo / VNPAY Sandbox payment page
						window.location.href = data.paymentUrl;
					} else {
						setCreatedOrderId(data.id);
						setIsSuccess(true);
					}
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Đặt hàng thất bại. Vui lòng kiểm tra lại số lượng tồn kho!");
				},
			}
		);
	};

	if (isSuccess) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-md mx-auto px-6 py-12 space-y-6">
				<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 border border-green-200">
					<ShieldCheck className="w-9 h-9" />
				</div>
				<div className="space-y-2">
					<h1 className="text-xl font-black text-brand-dark">Đặt Hàng Thành Công!</h1>
					<p className="text-xs text-brand-muted leading-relaxed">
						Cảm ơn bạn đã đặt hàng tại hệ thống. Đơn hàng của bạn đã được tiếp nhận và chuyển cho chủ cửa hàng xử lý.
					</p>
					{createdOrderId && (
						<div className="bg-brand-light-soft py-2 px-3 rounded-lg text-xs font-bold text-brand-dark inline-block border border-brand-border">
							Mã đơn hàng: {createdOrderId}
						</div>
					)}
				</div>
				<div className="flex gap-3 w-full">
					<Link
						to="/"
						className="flex-1 inline-flex items-center justify-center h-10 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl transition-all shadow-sm"
					>
						Tiếp tục mua sắm
					</Link>
				</div>
			</div>
		);
	}

	// Address text formatter helper
	const getProvinceName = (id: number) => provinces?.find((p) => p.id === id)?.displayName || `Tỉnh #${id}`;
	const getDistrictName = (id: number) => districts?.find((d) => d.id === id)?.displayName || `Huyện #${id}`;
	const getWardName = (id: number) => wards?.find((w) => w.id === id)?.displayName || `Xã #${id}`;

	return (
		<div className="py-10 px-4 md:px-6 max-w-5xl mx-auto w-full select-none text-left font-sans">
			{/* Back Link */}
			<div className="flex items-center gap-2 mb-6">
				<Link
					to="/cart"
					className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary transition-colors font-medium"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Quay lại giỏ hàng
				</Link>
			</div>

			<h1 className="text-2xl font-black text-brand-dark mb-8 flex items-center gap-2.5">
				<CreditCard className="w-6 h-6 text-brand-primary" />
				Thanh toán đơn hàng
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				{/* Main Checkout content */}
				<div className="lg:col-span-2 space-y-5 w-full">
					{/* 1. SHIPPING ADDRESS CARD */}
					<div className="bg-white border border-brand-border rounded-xl p-5 relative shadow-sm">
						<div className="flex items-center gap-2 text-xs font-bold text-red-500 mb-3.5 uppercase tracking-wider">
							<MapPin className="w-4 h-4" />
							Địa Chỉ Nhận Hàng
						</div>

						{selectedAddress ? (
							<div className="space-y-2">
								<div className="flex items-center gap-3">
									<span className="font-extrabold text-brand-dark text-xs flex items-center gap-1">
										<User className="w-3.5 h-3.5 text-brand-muted" />
										{selectedAddress.recipientName}
									</span>
									<span className="text-xs text-brand-muted font-bold flex items-center gap-1">
										<Phone className="w-3.5 h-3.5 text-brand-muted" />
										{selectedAddress.phone}
									</span>
									{selectedAddress.isDefault && (
										<span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1.5 py-0.5 rounded">
											Mặc định
										</span>
									)}
								</div>
								<div className="text-xs text-brand-dark leading-relaxed font-semibold">
									{selectedAddress.addressLine}, {getWardName(selectedAddress.wardId)}, {getDistrictName(selectedAddress.districtId)}, {getProvinceName(selectedAddress.provinceId)}
								</div>
							</div>
						) : (
							<div className="text-xs text-brand-muted font-bold py-2">
								Bạn chưa có địa chỉ nhận hàng nào được cấu hình.
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-3 mt-4 pt-3.5 border-t border-brand-border/60">
							<button
								onClick={() => setShowAddressModal(true)}
								className="inline-flex items-center gap-1 px-3 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
							>
								Thay Đổi
							</button>
						</div>
					</div>

					{/* 2. PRODUCT GROUPS BY SHOP */}
					<div className="space-y-4">
						{shopGroups.map((group) => {
							const groupSelectedItems = group.items.filter((i) => i.isSelected);
							if (groupSelectedItems.length === 0) return null;

							// Look up shipping fee from calculation API (string & number keys fallback)
							const shippingFee =
								calcResult?.shopShippingFee?.[group.shopId] ??
								calcResult?.shopShippingFee?.[group.shopId.toString()] ??
								0;

							const shopSubTotal = groupSelectedItems.reduce(
								(sum, item) => sum + item.unitPrice * item.quantity,
								0
							);
							const shopGrandTotal = shopSubTotal + shippingFee;

							return (
								<div
									key={group.shopId}
									className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm text-left"
								>
									{/* Shop Header */}
									<div className="flex items-center gap-2 px-4 py-3 bg-brand-light-soft/20 border-b border-brand-border">
										<Store className="w-4 h-4 text-brand-primary" />
										<span className="font-extrabold text-xs text-brand-dark">
											{group.shopName || `Cửa hàng #${group.shopId}`}
										</span>
									</div>

									{/* Item list */}
									<div className="divide-y divide-brand-border/60">
										{groupSelectedItems.map((item) => (
											<div key={item.productVariantId} className="flex gap-3 p-4">
												<img
													src={item.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
													alt={item.productName}
													className="w-14 h-14 object-cover rounded-lg border border-brand-border flex-shrink-0"
												/>
												<div className="flex-1 min-w-0 text-left">
													<h4 className="font-extrabold text-brand-dark text-xs truncate">
														{item.productName}
													</h4>
													{item.variantName && (
														<span className="inline-block text-[9px] font-bold text-brand-muted bg-brand-light-soft px-1.5 py-0.5 rounded-sm mt-1">
															Phân loại: {item.variantName}
														</span>
													)}
													<div className="flex justify-between items-baseline mt-2">
														<span className="text-[10px] text-brand-muted font-bold">
															Số lượng: {item.quantity}
														</span>
														<span className="font-extrabold text-brand-dark text-xs">
															{item.unitPrice.toLocaleString("vi-VN")}đ
														</span>
													</div>
												</div>
											</div>
										))}
									</div>

									{/* Shop Voucher full width row */}
									<div className="px-4 py-3.5 bg-brand-light-soft/10 border-t border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div className="flex items-center gap-2 flex-1 max-w-md">
											<Ticket className="w-4 h-4 text-brand-primary flex-shrink-0" />
											<span className="text-[11px] font-bold text-brand-dark mr-1">Voucher của Shop:</span>
											<input
												type="text"
												placeholder="Nhập hoặc chọn mã giảm giá của Shop..."
												value={shopVouchers[group.shopId] || ""}
												onChange={(e) =>
													setShopVouchers((prev) => ({
														...prev,
														[group.shopId]: e.target.value,
													}))
												}
												className="flex-1 h-8 px-3 text-xs bg-white border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
											/>
										</div>
										<span className="text-[10px] font-bold text-brand-muted">
											{shopVouchers[group.shopId] ? "Voucher đã áp dụng" : "Chưa chọn mã"}
										</span>
									</div>

									{/* Shipping Row */}
									<div className="p-4 bg-brand-light-soft/10 border-t border-brand-border/60 text-left space-y-3">
										<div className="flex items-center justify-between border-b border-dashed border-brand-border/80 pb-3">
											<div>
												<span className="text-xs font-extrabold text-brand-dark block">
													Phương thức vận chuyển
												</span>
												<span className="text-[10px] text-brand-muted font-bold block mt-0.5">
													Giao hàng nhanh (GHN)
												</span>
											</div>
											<div className="text-right">
												<span className="text-xs font-black text-brand-dark">
													{shippingFee.toLocaleString("vi-VN")}đ
												</span>
											</div>
										</div>

										<div className="text-right pt-0.5">
											<span className="text-[10px] font-bold text-brand-muted mr-1">
												Tổng số tiền ({groupSelectedItems.length} sản phẩm):
											</span>
											<span className="text-sm font-black text-red-500">
												{shopGrandTotal.toLocaleString("vi-VN")}đ
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* 3. PAYMENT METHOD SELECTOR (Premium Vertical Layout) */}
					<div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm text-left">
						<h2 className="text-xs font-bold text-brand-dark mb-5 uppercase tracking-wider border-b border-brand-border/50 pb-3">
							Chọn hình thức thanh toán
						</h2>

						<div className="space-y-3.5">
							{paymentMethods && paymentMethods.length > 0 ? (
								paymentMethods
									.filter((method) => method.isActive)
									.map((method) => (
										<label
											key={method.id}
											className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
												paymentProvider === method.providerName
													? "border-brand-primary bg-brand-primary/5"
													: "border-brand-border bg-white hover:border-brand-primary/50"
											}`}
										>
											<input
												type="radio"
												name="paymentMethod"
												checked={paymentProvider === method.providerName}
												onChange={() => setPaymentProvider(method.providerName)}
												className="accent-brand-primary w-4 h-4"
											/>
											<div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-light-soft overflow-hidden">
												{method.iconUrl ? (
													<img src={method.iconUrl} alt={method.title} className="w-6 h-6 object-contain" />
												) : (
													<CreditCard className="w-4 h-4 text-brand-primary" />
												)}
											</div>
											<div className="text-left">
												<div className="text-xs font-bold text-brand-dark">{method.title}</div>
												{method.subTitle && (
													<div className="text-[10px] text-brand-muted font-semibold mt-0.5">{method.subTitle}</div>
												)}
											</div>
										</label>
									))
							) : (
								<div className="text-xs text-brand-muted py-4 font-bold text-center">
									Đang tải hoặc không có phương thức thanh toán khả dụng nào từ hệ thống...
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 4. BILLING SUMMARY & PLACE ORDER BUTTON */}
				<div className="lg:col-span-1 w-full space-y-4">
					<div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm text-left space-y-4 sticky top-6">
						<h3 className="font-extrabold text-brand-dark text-sm border-b border-brand-border pb-3">
							Tổng kết thanh toán
						</h3>

						<div className="space-y-2.5 text-xs text-brand-dark">
							<div className="flex justify-between font-semibold">
								<span className="text-brand-muted">Tổng tiền hàng</span>
								<span>
									{(calcResult?.subTotal || selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)).toLocaleString("vi-VN")}đ
								</span>
							</div>
							<div className="flex justify-between font-semibold">
								<span className="text-brand-muted">Tổng phí vận chuyển</span>
								<span>{(calcResult?.totalShippingFee || 0).toLocaleString("vi-VN")}đ</span>
							</div>
						</div>

						<div className="border-t border-brand-border pt-4 flex items-baseline justify-between">
							<span className="text-xs font-black text-brand-dark">Tổng thanh toán:</span>
							<span className="text-xl font-black text-red-500">
								{(calcResult?.grandTotal || selectedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)).toLocaleString("vi-VN")}đ
							</span>
						</div>

						<button
							onClick={handlePlaceOrder}
							disabled={checkoutMutation.isPending || calculateTotalMutation.isPending}
							className="w-full h-11 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border-none mt-2"
						>
							{checkoutMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Đang xử lý đặt hàng...
								</>
							) : (
								"Đặt hàng"
							)}
						</button>
					</div>
				</div>
			</div>

			{/* 5. MANAGE ADDRESSES MODAL OVERLAY */}
			{showAddressModal && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="bg-white border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setShowAddressModal(false)}
							className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-base font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
							<MapPin className="w-5 h-5 text-brand-primary" />
							Địa chỉ của tôi
						</h2>

						<div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
							{addresses && addresses.length > 0 ? (
								addresses.map((addr) => (
									<div
										key={addr.id}
										className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
											selectedAddress?.id === addr.id
												? "border-brand-primary bg-brand-primary/5"
												: "border-brand-border bg-white"
										}`}
									>
										<div className="space-y-1.5 flex-1 min-w-0">
											<div className="flex items-center gap-2.5">
												<span className="font-extrabold text-xs text-brand-dark truncate">
													{addr.recipientName}
												</span>
												<span className="text-[11px] font-bold text-brand-muted">
													{addr.phone}
												</span>
												{addr.isDefault && (
													<span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 px-1 py-0.5 rounded">
														Mặc định
													</span>
												)}
											</div>
											<p className="text-[11px] text-brand-dark font-semibold leading-relaxed">
												{addr.addressLine}, {getWardName(addr.wardId)}, {getDistrictName(addr.districtId)}, {getProvinceName(addr.provinceId)}
											</p>
										</div>

										<div className="flex sm:flex-col items-end gap-2 shrink-0">
											<div className="flex gap-2">
												<button
													onClick={() => handleSelectAddress(addr)}
													className="h-7 px-3 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-[10px] rounded-lg transition-colors border-none cursor-pointer flex items-center gap-1"
												>
													<Check className="w-3 h-3" />
													Chọn
												</button>
												<button
													onClick={(e) => handleDeleteAddress(e, addr.id)}
													disabled={deleteAddressMutation.isPending}
													className="h-7 w-7 flex items-center justify-center border border-brand-border text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer bg-white"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
											{!addr.isDefault && (
												<button
													onClick={(e) => handleSetDefaultAddress(e, addr.id)}
													disabled={setDefaultAddressMutation.isPending}
													className="text-[10px] text-brand-muted hover:text-brand-dark font-bold bg-transparent border-none cursor-pointer underline"
												>
													Thiết lập mặc định
												</button>
											)}
										</div>
									</div>
								))
							) : (
								<p className="text-xs text-brand-muted py-4 font-bold text-center">
									Bạn chưa có địa chỉ nhận hàng nào.
								</p>
							)}
						</div>

						<div className="flex gap-3 pt-3 border-t border-brand-border/60">
							<button
								onClick={() => setShowAddressModal(false)}
								className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-lg transition-colors cursor-pointer bg-white"
							>
								Đóng lại
							</button>
							<button
								onClick={() => {
									setShowAddressModal(false);
									setShowNewAddressModal(true);
								}}
								className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm Địa Chỉ Mới
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 6. NEW ADDRESS MODAL OVERLAY */}
			<NewAddressModal
				isOpen={showNewAddressModal}
				onClose={() => setShowNewAddressModal(false)}
				onSuccess={(newAddr) => {
					setSelectedAddress(newAddr);
					refetchAddresses();
				}}
				onBackToAddressList={() => {
					setShowNewAddressModal(false);
					setShowAddressModal(true);
				}}
			/>
		</div>
	);
}
