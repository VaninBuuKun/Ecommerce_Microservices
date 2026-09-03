import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart,
    ArrowLeft,
    ArrowRight,
    Trash2,
    Plus,
    Minus,
    CheckSquare,
    Square,
    Loader2,
    Trash,
    Store,
    ShieldCheck,
    Ticket,
    X,
    Tag,
} from "lucide-react";
import { toast } from "react-toastify";
import {
    useUpdateQuantityMutation,
    useRemoveItemMutation,
    useUpdateSelectStateMutation,
    useClearCartMutation,
    useCartQuery,
} from "@/domains/cart";
import {
    ShopVoucherModal,
    PlatformVoucherModal,
    useAvailableVouchersQuery,
} from "@/domains/order";
import { ConfirmModal } from "@/shared/components";
import { Link, useNavigate } from "react-router-dom";

export default function CartPage() {
    const navigate = useNavigate();
    const { data: cart, isLoading, isError } = useCartQuery();

    const updateQuantityMutation = useUpdateQuantityMutation();
    const removeItemMutation = useRemoveItemMutation();
    const updateSelectStateMutation = useUpdateSelectStateMutation();
    const clearCartMutation = useClearCartMutation();

    const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
    const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Voucher Modals state on CartPage
    const [activeShopVoucherModal, setActiveShopVoucherModal] = useState<number | null>(null);
    const [showPlatformVoucherModal, setShowPlatformVoucherModal] = useState(false);
    const [showClearCartModal, setShowClearCartModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Selected Vouchers
    const [shopVouchers, setShopVouchers] = useState<Record<number, string>>({});
    const [platformVoucher, setPlatformVoucher] = useState<string>("");

    // Fetch all platform vouchers for calculating client discount in cart
    const { data: allPlatformVouchers } = useAvailableVouchersQuery(null, true);

    useEffect(() => {
        if (cart?.shopGroups) {
            const items = cart.shopGroups.flatMap((group: any) => group.items || []);
            setLocalQuantities((prev) => {
                const next = { ...prev };
                items.forEach((item: any) => {
                    const key = String(item.variantId || item.productVariantId);
                    if (debounceTimers.current[key] === undefined) {
                        next[key] = item.quantity;
                    }
                });
                return next;
            });
        }
    }, [cart]);

    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(clearTimeout);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-brand-muted text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                Đang tải giỏ hàng của bạn...
            </div>
        );
    }

    if (isError || !cart) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Không thể tải giỏ hàng</h2>
                <p className="text-xs text-brand-muted">
                    Có lỗi kết nối đến máy chủ. Vui lòng thử lại sau giây lát.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    aria-label="Tải lại trang"
                    className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-xl text-xs font-bold border-none cursor-pointer transition-all shadow-sm"
                >
                    Tải lại trang
                </button>
            </div>
        );
    }

    const shopGroups = cart.shopGroups || [];
    const allItems = shopGroups.flatMap((group: any) => group.items || []);
    const selectableItems = allItems.filter((item: any) => {
        const stock = item.availableStock ?? (item as any).availableStocks;
        return (stock === undefined || stock > 0) && item.quantity > 0;
    });
    const selectedItems = selectableItems.filter((item: any) => item.isSelected);
    const allSelected = selectableItems.length > 0 && selectableItems.every((item: any) => item.isSelected);

    // Tính toán tài chính cơ bản: Dùng item.quantity từ Server data (chỉ cập nhật giá khi API đã thành công)
    const { totalOriginal, subTotal } = selectedItems.reduce(
        (acc: { totalOriginal: number; subTotal: number }, item: any) => {
            const qty = item.quantity;
            const original = item.unitPrice * qty;
            const activePrice =
                item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.unitPrice
                    ? item.discountPrice
                    : item.unitPrice;
            const final = activePrice * qty;

            acc.totalOriginal += original;
            acc.subTotal += final;
            return acc;
        },
        { totalOriginal: 0, subTotal: 0 }
    );

    // Tính toán giảm giá voucher nền tảng nếu có
    let platformDiscountAmount = 0;
    if (platformVoucher && allPlatformVouchers) {
        const found = allPlatformVouchers.find((v: any) => v.code === platformVoucher);
        if (found && (!found.minOrderValue || subTotal >= found.minOrderValue)) {
            if (found.discountType === "Percentage" || found.discountType === 1) {
                const calculated = (subTotal * found.discountValue) / 100;
                platformDiscountAmount = found.maxDiscountAmount
                    ? Math.min(calculated, found.maxDiscountAmount)
                    : calculated;
            } else {
                platformDiscountAmount = Math.min(subTotal, found.discountValue);
            }
        }
    }

    const grandTotal = Math.max(0, subTotal - platformDiscountAmount);

    const handleQuantityChange = (item: any, currentQty: number, change: number, maxStock: number) => {
        const itemKey = String(item.variantId || item.productVariantId);
        const prevQty = localQuantities[itemKey] !== undefined ? localQuantities[itemKey] : currentQty;
        const targetQty = prevQty + change;

        if (targetQty > maxStock) {
            toast.warning(`Chỉ còn tối đa ${maxStock} sản phẩm trong kho!`);
            return;
        }

        if (targetQty < 1) {
            setItemToDelete(itemKey);
            return;
        }

        // Cập nhật giao diện lập tức không cần chờ API
        setLocalQuantities((prev) => ({
            ...prev,
            [itemKey]: targetQty,
        }));

        if (debounceTimers.current[itemKey]) {
            clearTimeout(debounceTimers.current[itemKey]);
        }

        debounceTimers.current[itemKey] = setTimeout(() => {
            updateQuantityMutation.mutate({ 
                variantId: itemKey,
                quantity: targetQty 
            });
            delete debounceTimers.current[itemKey];
        }, 350);
    };

    const handleToggleSelect = (item: any, currentSelected: boolean) => {
        const itemKey = String(item.variantId || item.productVariantId);
        updateSelectStateMutation.mutate({ 
            variantId: itemKey,
            isSelected: !currentSelected 
        });
    };

    const handleToggleAll = () => {
        const targetState = !allSelected;
        selectableItems.forEach((item: any) => {
            if (item.isSelected !== targetState) {
                const itemKey = String(item.variantId || item.productVariantId);
                updateSelectStateMutation.mutate({ 
                    variantId: itemKey,
                    isSelected: targetState 
                });
            }
        });
    };

    const handleClearCart = () => {
        setShowClearCartModal(true);
    };

    const handleConfirmClearCart = () => {
        clearCartMutation.mutate(undefined, {
            onSuccess: () => {
                setShowClearCartModal(false);
                setLocalQuantities({});
            },
            onSettled: () => {
                setShowClearCartModal(false);
            }
        });
    };

    const handleConfirmDeleteItem = () => {
        if (!itemToDelete) return;
        removeItemMutation.mutate(itemToDelete, {
            onSuccess: () => {
                setLocalQuantities((prev) => {
                    const next = { ...prev };
                    delete next[itemToDelete];
                    return next;
                });
                setItemToDelete(null);
            },
            onSettled: () => {
                setItemToDelete(null);
            }
        });
    };

    const handleApplyShopVoucher = (shopId: number, code: string) => {
        setShopVouchers((prev) => ({ ...prev, [shopId]: code }));
        setActiveShopVoucherModal(null);
    };

    const handleRemoveShopVoucher = (shopId: number) => {
        setShopVouchers((prev) => {
            const next = { ...prev };
            delete next[shopId];
            return next;
        });
    };

    const handleApplyPlatformVoucher = (code: string) => {
        setPlatformVoucher(code);
        setShowPlatformVoucherModal(false);
    };

    const handleProceedToCheckout = () => {
        if (selectedItems.length === 0) {
            toast.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
            return;
        }
        // Chuyển sang CheckoutPage và kèm theo state Voucher đã chọn
        navigate("/checkout", {
            state: {
                shopVouchers,
                platformVoucher,
            },
        });
    };

    return (
        <div className="pt-4 pb-10 px-3 sm:px-6 max-w-7xl mx-auto w-full text-left font-sans relative">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <nav className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
                    <Link to="/" className="hover:text-brand-primary transition-colors">
                        Trang chủ
                    </Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-brand-dark font-bold">Giỏ hàng</span>
                </nav>

                {allItems.length > 0 && (
                    <button
                        onClick={handleClearCart}
                        aria-label="Xóa tất cả sản phẩm khỏi giỏ hàng"
                        className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md border-none cursor-pointer font-bold transition-all"
                    >
                        <Trash className="w-3.5 h-3.5" />
                        Xóa tất cả
                    </button>
                )}
            </div>

            {allItems.length === 0 ? (
                <div className="bg-white border border-brand-border rounded-lg p-10 text-center space-y-4 max-w-md mx-auto shadow-xs">
                    <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
                        <ShoppingCart className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-base text-brand-dark">Giỏ hàng của bạn đang trống</h3>
                        <p className="text-xs text-brand-muted leading-relaxed">
                            Chưa có sản phẩm nào trong giỏ. Hãy khám phá và chọn các sản phẩm ưng ý nhé!
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center h-9 px-5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-extrabold text-xs rounded-md transition-all shadow-xs"
                    >
                        Khám phá sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Main Cart Items Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-3 w-full">
                        {/* Control Bar (Select all) */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-brand-border rounded-md shadow-xs">
                            <button
                                onClick={handleToggleAll}
                                aria-label="Chọn tất cả sản phẩm"
                                className="flex items-center gap-2.5 text-xs font-extrabold text-brand-dark border-none bg-transparent cursor-pointer select-none"
                            >
                                {allSelected ? (
                                    <CheckSquare className="w-4 h-4 text-brand-primary fill-brand-primary/10" />
                                ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                )}
                                Chọn tất cả ({allItems.length} sản phẩm)
                            </button>

                            <span className="text-xs font-semibold text-brand-muted">
                                Đã chọn: <strong className="text-brand-primary text-xs font-black">{selectedItems.length}</strong>
                            </span>
                        </div>

                        {/* Shop Groups */}
                        <div className="space-y-4">
                            {shopGroups.map((group: any) => {
                                const groupItems = group.items || [];
                                const groupSelectedItems = groupItems.filter((i: any) => i.isSelected);
                                const appliedVoucherCode = shopVouchers[group.shopId];

                                const groupSubTotal = groupSelectedItems.reduce((sum: number, item: any) => {
                                    const qty = item.quantity;
                                    const activePrice = item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.unitPrice
                                        ? item.discountPrice
                                        : item.unitPrice;
                                    return sum + activePrice * qty;
                                }, 0);

                                return (
                                    <div
                                        key={group.shopId}
                                        className="bg-white border border-brand-border rounded-md overflow-hidden shadow-xs text-left"
                                    >
                                        {/* Shop Header */}
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-light-soft/20 border-b border-brand-border">
                                            <Store className="w-4 h-4 text-brand-primary" />
                                            <Link
                                                to={`/shops/${group.shopId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-extrabold text-xs text-brand-dark hover:text-brand-primary transition-colors cursor-pointer"
                                            >
                                                {group.shopName || `Cửa hàng #${group.shopId}`}
                                            </Link>
                                        </div>

                                        {/* Items Table Header */}
                                        <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2 bg-gray-50/50 border-b border-brand-border/60 text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                                            <div className="col-span-6">Sản phẩm</div>
                                            <div className="col-span-2 text-right">Đơn giá</div>
                                            <div className="col-span-2 text-center">Số lượng</div>
                                            <div className="col-span-2 text-right">Thành tiền</div>
                                        </div>

                                        {/* Items List */}
                                        <div className="divide-y divide-brand-border/50">
                                            {groupItems.map((item: any) => {
                                                const activePrice =
                                                    item.discountPrice &&
                                                    item.discountPrice > 0 &&
                                                    item.discountPrice < item.unitPrice
                                                        ? item.discountPrice
                                                        : item.unitPrice;
                                                const itemKey = String(item.variantId || item.productVariantId || item.productId);
                                                const currentQty = localQuantities[itemKey] !== undefined ? localQuantities[itemKey] : item.quantity;
                                                const availableStock = item.availableStock ?? (item as any).availableStocks ?? 0;
                                                const isOutOfStock = availableStock <= 0 || item.quantity === 0;
                                                const itemTotal = isOutOfStock ? 0 : activePrice * item.quantity;

                                                return (
                                                    <div
                                                        key={itemKey}
                                                        className={`p-3 sm:p-3.5 transition-colors ${
                                                            isOutOfStock
                                                                ? "bg-slate-50/80 opacity-60 grayscale-[35%]"
                                                                : item.isSelected
                                                                    ? "bg-brand-primary/5 hover:bg-brand-primary/10"
                                                                    : "hover:bg-gray-50/30"
                                                        }`}
                                                    >
                                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                                            {/* Checkbox + Product Info (6 cols) */}
                                                            <div className="sm:col-span-6 flex gap-2.5 items-center">
                                                                <button
                                                                    onClick={() => !isOutOfStock && handleToggleSelect(item, item.isSelected)}
                                                                    disabled={isOutOfStock}
                                                                    aria-label={isOutOfStock ? "Sản phẩm đã hết hàng" : "Chọn sản phẩm"}
                                                                    className={`border-none bg-transparent p-0 flex-shrink-0 ${
                                                                        isOutOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                                                    }`}
                                                                >
                                                                    {item.isSelected && !isOutOfStock ? (
                                                                        <CheckSquare className="w-4 h-4 text-brand-primary fill-brand-primary/10" />
                                                                    ) : (
                                                                        <Square className="w-4 h-4 text-gray-300" />
                                                                    )}
                                                                </button>

                                                                <Link
                                                                    to={`/products/${item.productId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2.5 flex-1 min-w-0 group"
                                                                >
                                                                    {item.thumbnailUrl ? (
                                                                        <img
                                                                            src={item.thumbnailUrl}
                                                                            alt={item.productName}
                                                                            className="w-12 h-12 object-cover rounded-md border border-brand-border/80 flex-shrink-0 shadow-xs group-hover:border-brand-primary transition-all"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-md bg-brand-light-soft border border-brand-border/80 flex items-center justify-center flex-shrink-0 text-brand-muted text-[10px] font-bold">
                                                                            No img
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0 space-y-0.5">
                                                                        <h4
                                                                            className="font-extrabold text-brand-dark text-xs line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors"
                                                                            title={item.productName}
                                                                        >
                                                                            {item.productName}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            {isOutOfStock ? (
                                                                                <span className="inline-block text-[9px] font-black text-red-600 bg-red-100/90 border border-red-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                                                                    Hết hàng
                                                                                </span>
                                                                            ) : item.variantName ? (
                                                                                <span className="inline-block text-[9px] font-bold text-brand-muted bg-brand-light-soft px-1.5 py-0.5 rounded-sm">
                                                                                    Phân loại: {item.variantName}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            </div>

                                                            {/* Unit Price (2 cols) */}
                                                            <div className="sm:col-span-2 flex sm:flex-col sm:items-end justify-between sm:justify-center">
                                                                <span className="text-[10px] text-brand-muted font-bold sm:hidden">Đơn giá:</span>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-brand-dark text-xs">
                                                                        {activePrice.toLocaleString("vi-VN")}đ
                                                                    </span>
                                                                    {item.discountPrice && item.discountPrice < item.unitPrice && (
                                                                        <span className="text-[10px] text-gray-400 line-through block font-medium">
                                                                            {item.unitPrice.toLocaleString("vi-VN")}đ
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Quantity (2 cols) */}
                                                            <div className="sm:col-span-2 flex sm:justify-center justify-between items-center">
                                                                <span className="text-[10px] text-brand-muted font-bold sm:hidden">Số lượng:</span>
                                                                {isOutOfStock ? (
                                                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                                                        Hết hàng
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center border border-brand-border rounded-md overflow-hidden h-7 w-22 bg-white shadow-xs">
                                                                        <button
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    item,
                                                                                    currentQty,
                                                                                    -1,
                                                                                    availableStock
                                                                                )
                                                                            }
                                                                            aria-label="Giảm số lượng"
                                                                            className="w-6 h-full flex items-center justify-center border-none bg-transparent hover:bg-gray-100 cursor-pointer text-brand-muted transition-colors active:bg-gray-200"
                                                                        >
                                                                            <Minus className="w-2.5 h-2.5" />
                                                                        </button>
                                                                        <span className="flex-1 text-center text-xs font-bold text-brand-dark">
                                                                            {currentQty}
                                                                        </span>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleQuantityChange(
                                                                                    item,
                                                                                    currentQty,
                                                                                    1,
                                                                                    availableStock
                                                                                )
                                                                            }
                                                                            aria-label="Tăng số lượng"
                                                                            className="w-6 h-full flex items-center justify-center border-none bg-transparent hover:bg-gray-100 cursor-pointer text-brand-muted transition-colors active:bg-gray-200 disabled:opacity-30"
                                                                            disabled={currentQty >= availableStock}
                                                                        >
                                                                            <Plus className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Total & Remove (2 cols) */}
                                                            <div className="sm:col-span-2 flex sm:justify-end justify-between items-center text-right gap-2">
                                                                <span className="text-[10px] text-brand-muted font-bold sm:hidden">Thành tiền:</span>
                                                                <span className={`font-black text-xs ${isOutOfStock ? "text-gray-400" : "text-brand-primary-deep"}`}>
                                                                    {isOutOfStock ? "0đ" : `${itemTotal.toLocaleString("vi-VN")}đ`}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        setItemToDelete(String(item.variantId || item.productVariantId))
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md bg-transparent border-none cursor-pointer transition-all ml-1"
                                                                    title="Xóa sản phẩm"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Interactive Shop Voucher modal row */}
                                        <div className="px-4 py-2.5 bg-brand-light-soft/10 border-t border-brand-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <Ticket className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                                <span className="text-[11px] font-bold text-brand-dark mr-1">Voucher của Shop:</span>

                                                {appliedVoucherCode ? (
                                                    <div className="flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/30 px-2 py-0.5 rounded-md text-xs font-bold text-brand-dark">
                                                        <span>{appliedVoucherCode}</span>
                                                        <button
                                                            onClick={() => handleRemoveShopVoucher(group.shopId)}
                                                            className="text-brand-muted hover:text-red-500 font-bold bg-transparent border-none p-0 cursor-pointer text-xs ml-1"
                                                        >
                                                            <X className="w-3.5 h-3.5 inline" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setActiveShopVoucherModal(group.shopId)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
                                                    >
                                                        Chọn voucher từ shop
                                                    </button>
                                                )}
                                            </div>

                                            {groupSelectedItems.length > 0 && (
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-brand-muted mr-2">
                                                        Tạm tính Shop ({groupSelectedItems.length} mục):
                                                    </span>
                                                    <span className="text-xs font-black text-brand-primary-deep">
                                                        {groupSubTotal.toLocaleString("vi-VN")}đ
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Order Summary (4 cols) */}
                    <div className="lg:col-span-4 w-full space-y-3">
                        <div className="bg-white border border-brand-border rounded-md p-4 shadow-xs text-left space-y-3.5 sticky top-4">
                            <h3 className="font-extrabold text-brand-dark text-sm border-b border-brand-border pb-2.5 flex items-center justify-between">
                                <span>Tóm tắt đơn hàng</span>
                                <span className="text-[11px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                                    {selectedItems.length} đã chọn
                                </span>
                            </h3>

                            {/* Platform Voucher Selector */}
                            <div className="pb-2.5 border-b border-brand-border/60">
                                <div className="flex items-center justify-between text-xs font-bold text-brand-dark mb-1.5">
                                    <span className="flex items-center gap-1">
                                        <Ticket className="w-4 h-4 text-brand-primary" />
                                        Voucher Toàn Sàn
                                    </span>
                                </div>

                                {platformVoucher ? (
                                    <div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-md text-xs font-bold text-brand-dark mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <span>{platformVoucher}</span>
                                            {platformDiscountAmount > 0 && (
                                                <span className="text-[10px] text-red-500 font-bold">
                                                    (-{platformDiscountAmount.toLocaleString("vi-VN")}đ)
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setPlatformVoucher("")}
                                            className="text-brand-muted hover:text-red-500 font-bold bg-transparent border-none p-0 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowPlatformVoucherModal(true)}
                                        className="w-full text-left h-7 px-2.5 border border-dashed border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
                                    >
                                        Chọn mã giảm giá toàn sàn
                                    </button>
                                )}
                            </div>

                            {/* Breakdown Prices */}
                            <div className="space-y-2 text-xs text-brand-dark">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-brand-muted">Tổng tiền hàng gốc</span>
                                    <span>{totalOriginal.toLocaleString("vi-VN")}đ</span>
                                </div>

                                {totalOriginal > subTotal && (
                                    <div className="flex justify-between font-semibold text-green-600">
                                        <span>Khuyến mãi sản phẩm</span>
                                        <span>-{(totalOriginal - subTotal).toLocaleString("vi-VN")}đ</span>
                                    </div>
                                )}

                                {platformDiscountAmount > 0 && (
                                    <div className="flex justify-between font-semibold text-green-600">
                                        <span>Giảm giá từ Sàn</span>
                                        <span>-{platformDiscountAmount.toLocaleString("vi-VN")}đ</span>
                                    </div>
                                )}

                                <div className="flex justify-between font-semibold items-center text-brand-muted text-[11px]">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-gray-400 italic">Tính tại bước tiếp theo</span>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="border-t border-brand-border pt-3 flex items-baseline justify-between">
                                <span className="text-xs font-black text-brand-dark">Tạm tính:</span>
                                <span className="text-lg font-black text-red-500">
                                    {grandTotal.toLocaleString("vi-VN")}đ
                                </span>
                            </div>

                            {/* Checkout Button */}
                            <button
                                disabled={selectedItems.length === 0}
                                onClick={handleProceedToCheckout}
                                aria-label="Tiến hành thanh toán"
                                className="w-full h-10 bg-brand-primary hover:bg-brand-primary-deep disabled:opacity-40 disabled:cursor-not-allowed text-brand-dark font-black text-xs rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none mt-1 active:scale-[0.98]"
                            >
                                Mua Hàng ({selectedItems.length})
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Trust Badge */}
                            <div className="flex items-center justify-center gap-1.5 pt-1.5 text-[10px] font-semibold text-brand-muted border-t border-gray-100">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                                <span>Bảo mật thanh toán & An tâm mua sắm</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLATFORM VOUCHER SELECTION MODAL */}
            <PlatformVoucherModal
                isOpen={showPlatformVoucherModal}
                onClose={() => setShowPlatformVoucherModal(false)}
                selectedVoucherCode={platformVoucher}
                onApply={handleApplyPlatformVoucher}
                subTotal={subTotal}
            />

            {/* SHOP VOUCHER SELECTION MODAL */}
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
                                const qty = i.quantity;
                                const activePrice = i.discountPrice && i.discountPrice > 0 && i.discountPrice < i.unitPrice ? i.discountPrice : i.unitPrice;
                                return sum + activePrice * qty;
                            }, 0);
                    })()}
                />
            )}

            {/* CLEAR CART CONFIRM MODAL */}
            <ConfirmModal
                isOpen={showClearCartModal}
                title="Xóa toàn bộ giỏ hàng"
                message="Bạn có chắc chắn muốn xóa tất cả sản phẩm ra khỏi giỏ hàng không? Hành động này không thể hoàn tác."
                confirmText="Xóa tất cả"
                cancelText="Hủy"
                isConfirming={clearCartMutation.isPending}
                onConfirm={handleConfirmClearCart}
                onCancel={() => setShowClearCartModal(false)}
            />

            {/* DELETE SINGLE ITEM CONFIRM MODAL */}
            <ConfirmModal
                isOpen={itemToDelete !== null}
                title="Xóa sản phẩm khỏi giỏ hàng"
                message="Bạn có chắc chắn muốn bỏ sản phẩm này ra khỏi giỏ hàng không?"
                confirmText="Xóa sản phẩm"
                cancelText="Giữ lại"
                isConfirming={removeItemMutation.isPending}
                onConfirm={handleConfirmDeleteItem}
                onCancel={() => setItemToDelete(null)}
            />
        </div>
    );
}