import api from "../../../shared/lib/axios";
import type { Kyc, RegisterKycRequest, SellerProfileResponse } from "../types";

export const kycService = {
	getMySellerProfile: async (): Promise<SellerProfileResponse> => {
		const response = await api.get<SellerProfileResponse>("/shop/me");
		return response.data;
	},

	getMyKyc: async (): Promise<Kyc | null> => {
		const response = await api.get<Kyc | null>("/kyc/my-kyc");
		return response.data;
	},

	registerKyc: async (payload: RegisterKycRequest): Promise<Kyc> => {
		const response = await api.post<Kyc>("/kyc/register", payload);
		return response.data;
	},

	withdrawDraft: async (): Promise<Kyc> => {
		const response = await api.put<Kyc>("/kyc/withdraw-draft");
		return response.data;
	},
};
