export interface Shop {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	status?: string;
	recipientName?: string;
	phone?: string;
	addressLine?: string;
	wardId?: number;
	districtId?: number;
	provinceId?: number;
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
	wardId?: number;
	districtId?: number;
	provinceId?: number;
}

export interface SellerProfileDto {
	userId: number;
	kyc: any;
	shops: ShopDto[];
}
