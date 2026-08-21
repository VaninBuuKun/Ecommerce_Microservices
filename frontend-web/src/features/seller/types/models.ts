export interface PickUpAddress {
	recipientName: string;
	phone: string;
	province: string;
	district: string;
	ward: string;
	addressLine: string;
	provinceId: number;
	districtId: number;
	wardId: number;
}

export interface Shop {
	id: string;
	name: string;
	description: string;
	logoUrl: string;
	pickUpAddress?: PickUpAddress;
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
