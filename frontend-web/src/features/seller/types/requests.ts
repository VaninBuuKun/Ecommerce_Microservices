export interface RegisterKycRequest {
	identityCardNumber: string;
	identityCardFrontUrl: string;
	identityCardBackUrl: string;
	isDraft?: boolean;
}

export interface CreateShopRequest {
	name: string;
	description: string;
	logoUrl: string;
}
