export interface Shop {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	status?: string;
	recipientName?: string;
	phone?: string;
	addressLine?: string;
	ward?: string;
	district?: string;
	province?: string;
}

export interface ShopDto {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	status?: string;
	recipientName?: string;
	phone?: string;
	addressLine?: string;
	ward?: string;
	district?: string;
	province?: string;
}

export interface SellerProfileDto {
	userId: number;
	kyc: any;
	shops: ShopDto[];
}
