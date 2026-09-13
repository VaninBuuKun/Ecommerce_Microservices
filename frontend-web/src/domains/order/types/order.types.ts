export interface UserAddress {
	id: number;
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
	userAddressId: number;
	checkoutSessionId?: string | null;
	shopShippingSelections?: Record<number, string> | null;
	platformVoucherCode?: string | null;
	shopVoucherCodes?: Record<number, string> | null;
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

export interface CustomerOrderItemDto {
	id?: string;
	productId: string | number;
	productVariantId?: string;
	variantId?: string;
	productName: string;
	variantName?: string;
	unitPrice: number;
	quantity: number;
	thumbnailUrl?: string;
	imageUrl?: string;
	weightInGrams?: number;
	length?: number;
	width?: number;
	height?: number;
}

export interface CustomerOrderResponse {
	id: string;
	customerId: number;
	grandTotal: number;
	status: string;
	orderDate?: string;
	shopId: number;
	shopName: string;
	shopLogoUrl?: string;
	lastModifiedDate?: string;
	paymentMethodId?: number;
	shippingAddress: string;
	recipientName?: string;
	recipientPhone?: string;
	paymentUrl?: string;
	orderItems: CustomerOrderItemDto[];
}

export interface SubOrderDetailDto {
	id: string;
	customerId: number;
	shopId: number;
	shopName: string;
	shopLogoUrl?: string;
	subTotal: number;
	shippingFee: number;
	sellerDiscount: number;
	platformDiscount: number;
	grandTotal: number;
	commissionRate?: number;
	commissionFee?: number;
	netRevenue?: number;
	status: SubOrderStatus | string;
	isOnlinePayment: boolean;
	createdDate: string;
	deliveredDate?: string;
	user?: {
		id: number;
		fullName?: string;
		email?: string;
		phoneNumber?: string;
		avatarUrl?: string;
	};
	shippingAddress?: {
		id?: number;
		recipientName?: string;
		phone?: string;
		addressLine?: string;
		provinceId?: number;
		districtId?: number;
		wardId?: number;
	};
	paymentDto?: {
		id?: number;
		title?: string;
		providerName?: string;
		iconUrl?: string;
	};
	shopVoucherCode?: string;
	platformVoucherCode?: string;
	orderItems: CustomerOrderItemDto[];
}

export interface PaymentMethod {
	id: number;
	title: string;
	subTitle?: string;
	isActive: boolean;
	providerName: string;
	iconUrl: string;
	minAmount?: number | null;
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
