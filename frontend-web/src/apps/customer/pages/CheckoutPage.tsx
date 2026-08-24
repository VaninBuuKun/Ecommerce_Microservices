import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	MapPin,
	Plus,
	X,
	ArrowLeft,
	Loader2,
	CreditCard,
	Check,
	ShoppingCart,
	Trash2,
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

	// State
	const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
	const [showAddressModal, setShowAddressModal] = useState(false);
	const [showNewAddressModal, setShowNewAddressModal] = useState(false);

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
	const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

	// Vouchers state
	const [shopVouchers, setShopVouchers] = useState<Record<number, string>>({});
	const [platformVoucher, setPlatformVoucher] = useState<string>("");

	// General order success screen state
	const [isSuccess, setIsSuccess] = useState(false);
	const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

	// Selected items in cart
	const shopGroups = cart?.shopGroups || [];
	const selectedItems = shopGroups.flatMap((group: any) =>
		(group.items || []).filter((item: any) => item.isSelected)
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

	// Recalculate helper function
	const triggerRecalculate = (addressId: string, customShopVouchers?: Record<number, string>, customPlatformVoucher?: string) => {
		const targetShopVouchers = customShopVouchers ?? shopVouchers;
		const targetPlatformVoucher = customPlatformVoucher ?? platformVoucher;

		calculateTotalMutation.mutate(
			{
				userAddressId: addressId,
				checkoutSessionId: checkoutSessionId,
				shopShippingSelections: null,
				platformVoucherCode: targetPlatformVoucher || null,
				shopVoucherCodes: Object.keys(targetShopVouchers).length > 0 ? targetShopVouchers : null,
			},
			{
				onSuccess: (res: any) => {
					const data = res?.value || res;
					setCalcResult(data);
					setCheckoutSessionId(data?.id);
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
				<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 border border-green-200">
					<Check className="w-9 h-9" />
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
					<button
						onClick={() => navigate("/profile?tab=orders")}
						className="flex-1 inline-flex items-center justify-center h-10 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl transition-all shadow-sm border-none cursor-pointer"
					>
						Xem đơn hàng của tôi
					</button>
				</div>
			</div>
		);
	}

	// Address text formatter helper
	const getProvinceName = (id: number) => provinces?.find((p) => p.id === id)?.displayName || `Tỉnh #${id}`;
	const getDistrictName = (id: number) => districts?.find((d) => d.id === id)?.displayName || `Huyện #${id}`;
	const getWardName = (id: number) => wards?.find((w) => w.id === id)?.displayName || `Xã #${id}`;

	return (
		<div className="py-10 px-4 md:px-6 max-w-5xl mx-auto w-full select-none text-left font-sans relative">
			{/* recalculate skeleton opacity loading overlay */}
			{calculateTotalMutation.isPending && (
				<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-40 flex items-center justify-center rounded-2xl pointer-events-none">
					<div className="bg-brand-dark/80 text-brand-light py-2 px-4 rounded-xl flex items-center gap-2 shadow-xl border border-brand-border/40 text-xs font-extrabold animate-pulse">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tính lại tổng tiền...
					</div>
				</div>
			)}

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
					/>
				</div>

				<div className="lg:col-span-1 w-full space-y-4">
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
										className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${selectedAddress?.id === addr.id
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