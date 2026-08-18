import api from "@/core/api/axiosInstance";

export const kycApi = {
	getMySellerProfile: async (): Promise<any> => {
		const response = await api.get("/shop/me");
		return response.data?.value || response.data;
	},

	getMyKyc: async (): Promise<any> => {
		const response = await api.get("/kyc/my-kyc");
		return response.data?.value || response.data;
	},

	registerKyc: async (payload: {
		identityCardNumber: string;
		identityCardFrontUrl: string;
		identityCardBackUrl: string;
		isDraft?: boolean;
	}): Promise<any> => {
		const response = await api.post("/kyc/register", payload);
		return response.data?.value || response.data;
	},

	withdrawDraft: async (): Promise<any> => {
		const response = await api.put("/kyc/withdraw-draft");
		return response.data?.value || response.data;
	},
};
