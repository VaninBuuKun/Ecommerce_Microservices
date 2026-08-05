import type { Kyc, Shop } from "./models";

export interface SellerProfileResponse {
	kyc: Kyc | null;
	shops: Shop[];
}

export interface ShopCreatedResponse {
	id: string;
	name: string;
	description: string;
	logoUrl: string;
}
