import api from "@/core/api/axiosInstance";

export const sellerApi = {
	// Shop API
	getMyShops: async (): Promise<any> => {
		const res = await api.get("/shop/me");
		return res.data;
	},

	getShopById: async (id: number): Promise<any> => {
		const res = await api.get(`/shop/${id}`);
		return res.data;
	},

	createShop: async (data: any): Promise<any> => {
		const res = await api.post("/shop", data);
		return res.data;
	},

	updateShop: async (id: number, payload: any): Promise<any> => {
		const res = await api.put(`/shop/${id}`, payload);
		return res.data;
	},

	// KYC API
	getMySellerProfile: async (): Promise<any> => {
		const response = await api.get("/shop/me");
		return response.data;
	},

	getMyKyc: async (): Promise<any> => {
		const response = await api.get("/kyc/my-kyc");
		return response.data;
	},

	registerKyc: async (payload: any): Promise<any> => {
		const response = await api.post("/kyc/register", payload);
		return response.data;
	},

	withdrawDraft: async (): Promise<any> => {
		const response = await api.put("/kyc/withdraw-draft");
		return response.data;
	},

	// Vouchers API
	getVouchers: async (params: any): Promise<any> => {
		const queryParams = new URLSearchParams();
		if (params) {
			Object.entries(params).forEach(([key, val]) => {
				if (val !== undefined && val !== null) {
					queryParams.append(key, String(val));
				}
			});
		}
		const res = await api.get(`/vouchers?${queryParams.toString()}`);
		return res.data;
	},

	createVoucher: async (payload: any): Promise<any> => {
		const res = await api.post("/vouchers", payload);
		return res.data?.value || res.data;
	},

	updateVoucher: async (voucherId: number, payload: any): Promise<any> => {
		const res = await api.put(`/vouchers/${voucherId}`, payload);
		return res.data?.value || res.data;
	},

	deleteVoucher: async (voucherId: number): Promise<any> => {
		const res = await api.put(`/vouchers/${voucherId}`, {
			isActive: false,
			discountValue: 0,
			startDate: new Date().toISOString(),
			endDate: new Date(Date.now() + 86400000).toISOString(),
		});
		return res.data;
	},
};
