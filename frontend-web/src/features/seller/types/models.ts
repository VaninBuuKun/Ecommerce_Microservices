export interface Shop {
	id: string;
	name: string;
	description: string;
	logoUrl: string;
}

export interface Kyc {
	id?: string;
	userId?: number;
	identityCardNumber: string;
	identityCardFrontUrl: string;
	identityCardBackUrl: string;
	status: "Draft" | "Submitted" | "Verified" | "Rejected" | string;
	rejectReason?: string;
	verifiedDate?: string;
}
