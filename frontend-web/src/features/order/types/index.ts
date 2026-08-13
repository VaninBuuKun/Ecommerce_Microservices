export interface UserAddress {
	id: string;
	recipientName: string;
	phone: string;
	provinceId: number;
	districtId: number;
	wardId: number;
	addressLine: string;
	isDefault: boolean;
}

export interface CreateUserAddressRequest {
	recipientName: string;
	phone: string;
	provinceId: number;
	districtId: number;
	wardId: number;
	addressLine: string;
	isDefault: boolean;
}

export interface CalculateOrderTotalRequest {
	userAddressId: string;
	checkoutSessionId?: string | null;
	shopShippingSelections?: Record<number, string> | null;
}

export interface CheckoutItemDto {
	variantId: string;
	productName: string;
	variantName: string;
	unitPrice: number;
	quantity: number;
}

export interface CheckoutShopGroupDto {
	shopId: number;
	shopName: string;
	shippingFee: number;
	items: CheckoutItemDto[];
}

export interface CalOrderGrandTotalResponse {
	id: string;
	shopShippingFee: Record<number, number>;
	shopGroups: CheckoutShopGroupDto[];
	subTotal: number;
	totalShippingFee: number;
	grandTotal: number;
}

export interface CreateOrderCommand {
	customerId?: number;
	paymentProvider: string;
	checkoutSessionId: string;
}

export interface CustomerOrderResponse {
	id: string;
	customerId: number;
	grandTotal: number;
	shippingAddress: string;
	recipientName: string;
	recipientPhone: string;
	paymentUrl?: string;
}

export interface PaymentMethod {
	id: number;
	title: string;
	subTitle?: string;
	isActive: boolean;
	providerName: string;
	iconUrl: string;
}

export const PaymentStatus = {
	UnPaid: "UnPaid",
	Paid: "Paid",
	Failed: "Failed",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const SubOrderStatus = {
	AwaitingPayment: "AwaitingPayment",
	AwaitingConfirmation: "AwaitingConfirmation",
	Processing: "Processing",
	PackageReady: "PackageReady",
	Shipping: "Shipping",
	Delivered: "Delivered",
	Returning: "Returning",
	Refunded: "Refunded",
	Completed: "Completed",
	Cancelled: "Cancelled",
} as const;

export type SubOrderStatus =
	(typeof SubOrderStatus)[keyof typeof SubOrderStatus];
