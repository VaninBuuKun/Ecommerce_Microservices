export * from "./api/orderApi";
export * from "./hooks/useOrders";
export * from "./components/OrderItemsList";
export * from "./components/PaymentMethodSelector";
export * from "./components/CheckoutSummary";
export * from "./components/PlatformVoucherModal";
export * from "./components/ShopVoucherModal";
export * from "./components/VoucherHelpers";
export * from "./components/ProfileOrderTabs";
export { NewAddressModal, ShippingAddressCard } from "@/domains/address";
export type { UserAddressDto as UserAddress } from "@/domains/address";

export function getOrderStatusBadge(status: string) {
	return status || "Đang xử lý";
}
