import type { Shop, Kyc } from "./models";
import type { CreateShopRequest } from "./requests";

export interface SellerState {
	shops: Shop[];
	activeShop: Shop | null;
	kyc: Kyc | null;
	isLoadingProfile: boolean;
	isRegisterKyc: boolean;

	setActiveShop: (shop: Shop | null) => void;
	addShop: (shop: CreateShopRequest) => Shop;
	fetchSellerProfile: () => Promise<{ kyc: Kyc | null; shops: Shop[] }>;
	saveKycDraft: (data: {
		identityNumber: string;
		identityFront: string;
		identityBack: string;
	}) => Promise<Kyc>;
	submitKyc: (data: {
		identityNumber: string;
		identityFront: string;
		identityBack: string;
	}) => Promise<Kyc>;
	withdrawKycDraft: () => Promise<Kyc>;
	setKyc: (kyc: Kyc | null) => void;
}
