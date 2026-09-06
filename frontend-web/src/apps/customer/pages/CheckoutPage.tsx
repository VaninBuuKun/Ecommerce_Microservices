import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
	MapPin,
	Plus,
	X,
	ArrowLeft,
	CreditCard,
	Check,
	ShoppingCart,
	Trash2,
	Clock,
	Edit2,
	Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useCartQuery } from "@/domains/cart";
import {
	useAddressesQuery,
	useCalculateTotalMutation,
	useCheckoutMutation,
	useSetDefaultAddressMutation,
	useDeleteAddressMutation,
	usePaymentMethodsQuery,
	type UserAddress,
	NewAddressModal,
	ShopVoucherModal,
	PlatformVoucherModal,
	ShippingAddressCard,
	PaymentMethodSelector,
	OrderItemsList,
	CheckoutSummary,
} from "@/domains/order";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/catalog";

export default function CheckoutPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const idempotencyKeyRef = useRef<string>(
		typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	);

	// State
	const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
	const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);
	const [showNewAddressModal, setShowNewAddressModal] = useState(false);

	// Checkout session countdown timer (15 minutes = 900 seconds)
	const [timeLeft, setTimeLeft] = useState(900);
	const [isSessionExpired, setIsSessionExpired] = useState(false);

	// Voucher Modals state
	const [activeShopVoucherModal, setActiveShopVoucherModal] = useState<number | null>(null);
	const [showPlatformVoucherModal, setShowPlatformVoucherModal] = useState(false);

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
	const [paymentProvider, setPaymentProvider] = useState<string>("cod");

	// Checkout session calculations from backend
	const [calcResult, setCalcResult] = useState<any>(null);
	const [checkoutSessionKey, setcheckoutSessionKey] = useState<string | null>(null);

	// Vouchers state (support pre-selected vouchers from CartPage)
	const [shopVouchers, setShopVouchers] = useState<Record<number, string>>(
		location.state?.shopVouchers || {}
	);
	const [platformVoucher, setPlatformVoucher] = useState<string>(
		location.state?.platformVoucher || ""
	);

	// General order success screen state
	const [isSuccess, setIsSuccess] = useState(false);
	const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

	// Selected items in cart
	const shopGroups = cart?.shopGroups || [];
	const selectedItems = shopGroups.flatMap((group: any) =>
		(group.items || []).filter((item: any) => item.isSelected)
	);

	const fallbackSubTotal = selectedItems.reduce((sum: number, i: any) => {
		const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
		return sum + activePrice * i.quantity;
	}, 0);
	const currentGrandTotal = calcResult?.grandTotal ?? fallbackSubTotal;

	// If grand total < minAmount of currently selected payment method, fallback to a valid payment method (or COD)
	useEffect(() => {
		if (!paymentMethods || paymentMethods.length === 0) return;
		const selectedMethod = paymentMethods.find((m) => m.providerName === paymentProvider);
		if (
			selectedMethod?.minAmount &&
			selectedMethod.minAmount > 0 &&
			currentGrandTotal < selectedMethod.minAmount
		) {
			const fallbackMethod = paymentMethods.find(
				(m) => m.isActive && (!m.minAmount || currentGrandTotal >= m.minAmount)
			);
			setPaymentProvider(fallbackMethod?.providerName || "cod");
		}
	}, [currentGrandTotal, paymentProvider, paymentMethods]);

	// Countdown timer interval
	useEffect(() => {
		if (isSuccess || selectedItems.length === 0) return;
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					setIsSessionExpired(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [isSuccess, selectedItems.length]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

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

	// Recalculate helper function
	const triggerRecalculate = (addressId: number, customShopVouchers?: Record<number, string>, customPlatformVoucher?: string) => {
		const targetShopVouchers = customShopVouchers ?? shopVouchers;
		const targetPlatformVoucher = customPlatformVoucher ?? platformVoucher;

		calculateTotalMutation.mutate(
			{
				userAddressId: addressId,
				checkoutSessionId: checkoutSessionKey,
				shopShippingSelections: null,
				platformVoucherCode: targetPlatformVoucher || null,
				shopVoucherCodes: Object.keys(targetShopVouchers).length > 0 ? targetShopVouchers : null,
			},
			{
				onSuccess: (res: any) => {
					const data = res?.value || res;
					setCalcResult(data);
					setcheckoutSessionKey(data?.id);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Lỗi khi tính toán chi phí đơn hàng");
				},
			}
		);
	};

	// Trigger calculate API when selectedAddress changes
	useEffect(() => {
		if (selectedAddress && selectedItems.length > 0) {
			triggerRecalculate(selectedAddress.id);
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
			<div className="max-w-md mx-auto text-center py-16 px-6 space-y-6 font-sans">
				<div className="w-16 h-16 bg-brand-light-soft rounded-md flex items-center justify-center mx-auto text-brand-muted">
					<ShoppingCart className="w-8 h-8" />
				</div>
				<h3 className="font-bold text-brand-dark text-base">Không có sản phẩm thanh toán</h3>
				<p className="text-xs text-brand-muted leading-relaxed">
					Giỏ hàng của bạn chưa có sản phẩm nào được chọn để thanh toán.
				</p>
				<Link
					to="/cart"
					className="inline-flex items-center justify-center h-9 px-6 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-bold text-xs rounded-md transition-colors"
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

	const handleSetDefaultAddress = (e: React.MouseEvent, addrId: number) => {
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

	const handleDeleteAddress = (e: React.MouseEvent, addrId: number) => {
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

	// Voucher selection handlers
	const handleApplyShopVoucher = (shopId: number, code: string) => {
		const newShopVouchers = { ...shopVouchers, [shopId]: code };
		setShopVouchers(newShopVouchers);
		setActiveShopVoucherModal(null);
		if (selectedAddress) {
			triggerRecalculate(selectedAddress.id, newShopVouchers, platformVoucher);
		}
	};

	const handleRemoveShopVoucher = (shopId: number) => {
		const newShopVouchers = { ...shopVouchers };
		delete newShopVouchers[shopId];
		setShopVouchers(newShopVouchers);
		if (selectedAddress) {
			triggerRecalculate(selectedAddress.id, newShopVouchers, platformVoucher);
		}
	};

	const handleApplyPlatformVoucher = (code: string) => {
		setPlatformVoucher(code);
		setShowPlatformVoucherModal(false);
		if (selectedAddress) {
			triggerRecalculate(selectedAddress.id, shopVouchers, code);
		}
	};

	const handleRemovePlatformVoucher = () => {
		setPlatformVoucher("");
		if (selectedAddress) {
			triggerRecalculate(selectedAddress.id, shopVouchers, "");
		}
	};

	const handlePlaceOrder = () => {
		if (!selectedAddress) {
			toast.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng!");
			return;
		}
		if (!checkoutSessionKey) {
			toast.error("Không tìm thấy phiên giao dịch tính toán. Vui lòng thử lại!");
			return;
		}
		const selectedMethod = paymentMethods?.find((m) => m.providerName === paymentProvider);
		if (
			selectedMethod?.minAmount &&
			selectedMethod.minAmount > 0 &&
			currentGrandTotal < selectedMethod.minAmount
		) {
			toast.error(
				`Phương thức thanh toán qua ${selectedMethod.title} chỉ áp dụng cho đơn hàng từ ${Number(selectedMethod.minAmount).toLocaleString("vi-VN")} ₫ trở lên.`
			);
			return;
		}

		checkoutMutation.mutate(
			{
				paymentProvider: paymentProvider,
				checkoutSessionKey: checkoutSessionKey,
				addressId: selectedAddress.id,
				idempotencyKey: idempotencyKeyRef.current,
			},
			{
				onSuccess: (res: any) => {
					const orderData = res?.value || res;
					if (orderData?.paymentUrl) {
						window.location.href = orderData.paymentUrl;
					} else {
						setCreatedOrderId(orderData?.id);
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
			<div className="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-md mx-auto px-6 py-12 space-y-6 font-sans">
				<div className="w-16 h-16 bg-green-50 rounded-md flex items-center justify-center text-green-500 border border-green-200">
					<Check className="w-9 h-9" />
				</div>
				<div className="space-y-2">
					<h1 className="text-xl font-black text-brand-dark">Đặt Hàng Thành Công!</h1>
					<p className="text-xs text-brand-muted leading-relaxed">
						Cảm ơn bạn đã đặt hàng tại hệ thống. Đơn hàng của bạn đã được tiếp nhận và chuyển cho chủ cửa hàng xử lý.
					</p>
					{createdOrderId && (
						<div className="bg-brand-light-soft py-2 px-3 rounded-md text-xs font-bold text-brand-dark inline-block border border-brand-border">
							Mã đơn hàng: {createdOrderId}
						</div>
					)}
				</div>
				<div className="flex gap-3 w-full">
					<button
						onClick={() => navigate("/profile?tab=orders")}
						className="flex-1 inline-flex items-center justify-center h-10 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-md transition-all shadow-sm border-none cursor-pointer"
					>
						Xem đơn hàng của tôi
					</button>
				</div>
			</div>
		);
	}

	// Address text formatter helper
	const getProvinceName = (id: number) => {
		if (!id) return "";
		const item = provinces?.find((p: any) => Number(p.id) === Number(id) || String(p.code) === String(id));
		return item?.displayName || item?.name || "";
	};
	const getDistrictName = (id: number) => {
		if (!id) return "";
		const item = districts?.find((d: any) => Number(d.id) === Number(id) || String(d.code) === String(id));
		return item?.displayName || item?.name || "";
	};
	const getWardName = (id: number) => {
		if (!id) return "";
		const item = wards?.find((w: any) => Number(w.id) === Number(id) || String(w.code) === String(id));
		return item?.displayName || item?.name || "";
	};

	return (
		<div className="pt-4 pb-10 px-3 sm:px-6 max-w-7xl mx-auto w-full text-left font-sans relative">
			{/* recalculate skeleton opacity loading overlay */}
			{calculateTotalMutation.isPending && (
				<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-40 flex items-center justify-center rounded-md pointer-events-none">
					<div className="bg-brand-dark/80 text-brand-light py-2 px-4 rounded-md flex items-center gap-2 shadow-sm border border-brand-border/40 text-xs font-extrabold animate-pulse">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tính lại tổng tiền...
					</div>
				</div>
			)}

			{/* Breadcrumb Navigation */}
			<div className="flex items-center justify-between gap-4 mb-4">
				<nav className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
					<Link to="/" className="hover:text-brand-primary transition-colors">
						Trang chủ
					</Link>
					<span className="text-gray-400">/</span>
					<Link to="/cart" className="hover:text-brand-primary transition-colors">
						Giỏ hàng
					</Link>
					<span className="text-gray-400">/</span>
					<span className="text-brand-dark font-bold">Thanh toán</span>
				</nav>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
				{/* Main Checkout content (8 cols) */}
				<div className="lg:col-span-8 space-y-3.5 w-full">
					{/* 1. SHIPPING ADDRESS CARD */}
					<ShippingAddressCard
						selectedAddress={selectedAddress}
						onOpenModal={() => setShowAddressModal(true)}
						getWardName={getWardName}
						getDistrictName={getDistrictName}
						getProvinceName={getProvinceName}
					/>

					{/* 2. PRODUCT GROUPS BY SHOP */}
					<OrderItemsList
						shopGroups={shopGroups}
						calcResult={calcResult}
						shopVouchers={shopVouchers}
						setActiveShopVoucherModal={setActiveShopVoucherModal}
						handleRemoveShopVoucher={handleRemoveShopVoucher}
					/>

					{/* 3. PAYMENT METHOD SELECTOR */}
					<PaymentMethodSelector
						paymentMethods={paymentMethods}
						paymentProvider={paymentProvider}
						setPaymentProvider={setPaymentProvider}
						grandTotal={currentGrandTotal}
					/>
				</div>

				{/* Summary (4 cols) */}
				<div className="lg:col-span-4 w-full space-y-3.5">
					<CheckoutSummary
						platformVoucher={platformVoucher}
						handleRemovePlatformVoucher={handleRemovePlatformVoucher}
						setShowPlatformVoucherModal={setShowPlatformVoucherModal}
						calcResult={calcResult}
						selectedItems={selectedItems}
						checkoutMutation={checkoutMutation}
						calculateTotalMutation={calculateTotalMutation}
						handlePlaceOrder={handlePlaceOrder}
						hasSelectedAddress={!!selectedAddress}
						onRetryCalculate={() => {
							if (selectedAddress) {
								triggerRecalculate(selectedAddress.id);
							} else {
								toast.info("Vui lòng chọn địa chỉ giao hàng!");
							}
						}}
					/>

					{/* CHECKOUT SESSION COUNTDOWN TIMER */}
					<div
						className={`p-4 rounded-2xl border transition-all ${
							timeLeft < 120
								? "bg-red-50/70 border-red-200 text-red-700 animate-pulse"
								: "bg-white border-brand-border/80 shadow-xs"
						}`}
					>
						<div className="flex items-center justify-between gap-2 mb-2">
							<div className="flex items-center gap-2">
								<Clock className={`w-4 h-4 ${timeLeft < 120 ? "text-red-500" : "text-amber-500"}`} />
								<span className="text-xs font-extrabold text-brand-dark">
									Phiên thanh toán còn lại:
								</span>
							</div>
							<span
								className={`font-mono text-sm font-black tracking-wider ${
									timeLeft < 120 ? "text-red-600" : "text-brand-dark"
								}`}
							>
								{formatTime(timeLeft)}
							</span>
						</div>
						<div className="w-full h-1.5 bg-brand-light-soft rounded-full overflow-hidden mb-2">
							<div
								className={`h-full transition-all duration-1000 rounded-full ${
									timeLeft < 120 ? "bg-red-500" : "bg-amber-500"
								}`}
								style={{ width: `${(timeLeft / 900) * 100}%` }}
							/>
						</div>
						<p className="text-[11px] text-brand-muted font-medium leading-relaxed">
							Đơn hàng được giữ giá và tồn kho trong thời gian đếm ngược. Vui lòng hoàn tất trước khi hết giờ.
						</p>
					</div>
				</div>
			</div>

			{/* 5. MANAGE ADDRESSES MODAL OVERLAY */}
			{showAddressModal && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
					<div className="bg-white border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setShowAddressModal(false)}
							className="absolute top-4 right-4 p-1 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-base font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
							<MapPin className="w-5 h-5 text-brand-primary" />
							Địa chỉ nhận hàng của tôi
						</h2>

						<div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
							{addresses && addresses.length > 0 ? (
								addresses.map((addr) => {
									const isCurrentSelected = selectedAddress?.id === addr.id;
									const ward = getWardName(addr.wardId);
									const district = getDistrictName(addr.districtId);
									const province = getProvinceName(addr.provinceId);
									const area = [ward, district, province].filter(Boolean).join(", ");
									const formattedAddress = addr.addressLine && area ? `${addr.addressLine} / ${area}` : addr.addressLine || area;

									return (
										<div
											key={addr.id}
											onClick={() => handleSelectAddress(addr)}
											className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 cursor-pointer ${
												isCurrentSelected
													? "border-brand-primary bg-brand-primary/5 shadow-xs"
													: "border-brand-border bg-white hover:border-brand-primary/50"
											}`}
										>
											<div className="space-y-1.5 flex-1 min-w-0">
												<div className="flex items-center gap-2.5 flex-wrap">
													<span className="font-extrabold text-xs text-brand-dark truncate">
														{addr.recipientName}
													</span>
													<span className="text-[11px] font-bold text-brand-muted">
														{addr.phone}
													</span>
													{addr.isDefault && (
														<span className="text-[9px] font-black text-brand-primary-deep bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
															Mặc định
														</span>
													)}
												</div>
												<p className="text-xs text-brand-dark font-medium leading-relaxed">
													{formattedAddress}
												</p>
											</div>

											{/* Actions: Select Check -> Edit -> Delete -> Set Default */}
											<div className="flex sm:flex-col items-end gap-2 shrink-0">
												<div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
													{/* Select Button: Icon Check Only */}
													<button
														type="button"
														onClick={() => handleSelectAddress(addr)}
														title={isCurrentSelected ? "Đang chọn" : "Chọn địa chỉ này"}
														className={`h-7 w-7 flex items-center justify-center rounded-lg transition-all border-none cursor-pointer ${
															isCurrentSelected
																? "bg-brand-primary text-brand-dark font-black shadow-xs ring-2 ring-brand-primary/30"
																: "bg-brand-light-soft hover:bg-brand-primary/20 text-brand-muted hover:text-brand-dark"
														}`}
													>
														<Check className="w-3.5 h-3.5" />
													</button>

													{/* Edit Button */}
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															setEditingAddress(addr);
															setShowAddressModal(false);
															setShowNewAddressModal(true);
														}}
														className="h-7 w-7 flex items-center justify-center border border-brand-border text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/10 rounded-lg transition-all cursor-pointer bg-white"
														title="Chỉnh sửa địa chỉ"
													>
														<Edit2 className="w-3.5 h-3.5" />
													</button>

													{/* Delete Button */}
													<button
														type="button"
														onClick={(e) => handleDeleteAddress(e, addr.id)}
														disabled={deleteAddressMutation.isPending}
														className="h-7 w-7 flex items-center justify-center border border-brand-border text-brand-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer bg-white"
														title="Xóa địa chỉ"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>

												{!addr.isDefault && (
													<button
														type="button"
														onClick={(e) => handleSetDefaultAddress(e, addr.id)}
														disabled={setDefaultAddressMutation.isPending}
														className="text-[10px] text-brand-muted hover:text-brand-dark font-bold bg-transparent border-none cursor-pointer underline mt-0.5"
													>
														Thiết lập mặc định
													</button>
												)}
											</div>
										</div>
									);
								})
							) : (
								<p className="text-xs text-brand-muted py-4 font-bold text-center">
									Bạn chưa có địa chỉ nhận hàng nào.
								</p>
							)}
						</div>

						<div className="flex gap-3 pt-3 border-t border-brand-border/60">
							<button
								type="button"
								onClick={() => setShowAddressModal(false)}
								className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-xl transition-colors cursor-pointer bg-white"
							>
								Đóng lại
							</button>
							<button
								type="button"
								onClick={() => {
									setEditingAddress(null);
									setShowAddressModal(false);
									setShowNewAddressModal(true);
								}}
								className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm Địa Chỉ Mới
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 6. NEW / EDIT ADDRESS MODAL OVERLAY */}
			<NewAddressModal
				isOpen={showNewAddressModal}
				onClose={() => {
					setShowNewAddressModal(false);
					setEditingAddress(null);
				}}
				initialData={editingAddress}
				onSuccess={(savedAddr) => {
					setSelectedAddress(savedAddr);
					refetchAddresses();
					setEditingAddress(null);
				}}
				onBackToAddressList={() => {
					setShowNewAddressModal(false);
					setEditingAddress(null);
					setShowAddressModal(true);
				}}
			/>

			{/* 7. FULLSCREEN SESSION EXPIRED MODAL */}
			{isSessionExpired && (
				<div className="fixed inset-0 z-[10000] bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
					<div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl text-center space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200 font-sans">
						<div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
							<Clock className="w-8 h-8" />
						</div>
						<div className="space-y-2">
							<h3 className="text-lg font-black text-brand-dark">
								Phiên thanh toán đã hết hạn
							</h3>
							<p className="text-xs text-brand-muted font-medium leading-relaxed px-2">
								Thời gian giữ chỗ sản phẩm và áp dụng ưu đãi đã kết thúc. Vui lòng quay lại giỏ hàng hoặc trang chủ để bắt đầu phiên thanh toán mới.
							</p>
						</div>
						<div className="space-y-2.5 pt-2">
							<button
								type="button"
								onClick={() => navigate("/cart")}
								className="w-full h-11 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl transition-all shadow-md shadow-brand-primary/25 cursor-pointer border-none flex items-center justify-center gap-2"
							>
								<ShoppingCart className="w-4 h-4" />
								Quay về giỏ hàng
							</button>
							<button
								type="button"
								onClick={() => navigate("/")}
								className="w-full h-11 bg-brand-light-soft hover:bg-slate-200/80 text-brand-dark font-bold text-xs rounded-xl transition-all cursor-pointer border border-brand-border flex items-center justify-center gap-2"
							>
								Về trang chủ
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 7. PLATFORM VOUCHER SELECTION MODAL */}
			<PlatformVoucherModal
				isOpen={showPlatformVoucherModal}
				onClose={() => setShowPlatformVoucherModal(false)}
				selectedVoucherCode={platformVoucher}
				onApply={handleApplyPlatformVoucher}
				subTotal={selectedItems.reduce((sum: number, i: any) => {
					const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
					return sum + activePrice * i.quantity;
				}, 0)}
			/>

			{/* 8. SHOP VOUCHER SELECTION MODAL */}
			{activeShopVoucherModal !== null && (
				<ShopVoucherModal
					shopId={activeShopVoucherModal}
					isOpen={activeShopVoucherModal !== null}
					onClose={() => setActiveShopVoucherModal(null)}
					selectedVoucherCode={shopVouchers[activeShopVoucherModal]}
					onApply={handleApplyShopVoucher}
					subTotal={(() => {
						const shopGroup = shopGroups.find((g: any) => g.shopId === activeShopVoucherModal);
						if (!shopGroup) return 0;
						return (shopGroup.items || [])
							.filter((i: any) => i.isSelected)
							.reduce((sum: number, i: any) => {
								const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
								return sum + activePrice * i.quantity;
							}, 0);
					})()}
				/>
			)}

		</div>
	);
}