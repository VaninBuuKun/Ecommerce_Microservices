export interface Shop {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	status?: string;
}

export interface ShopDto {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	status?: string;
}

export interface SellerProfileDto {
	userId: number;
	kyc: any;
	shops: ShopDto[];
}
