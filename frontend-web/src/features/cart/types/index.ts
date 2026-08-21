export interface CartItemDto {
	productId: string;
	productVariantId: string;
	shopId: number;
	quantity: number;
	unitPrice: number;
	discountPrice: number;
	productName: string;
	variantName: string;
	availableStocks: number;
	isSelected: boolean;
	weight: number;
	length: number;
	width: number;
	height: number;
	thumbnailUrl: string;
}

export interface ShopCartGroupDto {
	shopId: number;
	shopName: string;
	items: CartItemDto[];
}

export interface CartDto {
	customerId: number;
	shopGroups: ShopCartGroupDto[];
}

export interface AddItemRequest {
	variantId: string;
	quantity: number;
}

export interface UpdateQuantityRequest {
	quantity: number;
}

export interface UpdateSelectStateRequest {
	isSelected: boolean;
}
