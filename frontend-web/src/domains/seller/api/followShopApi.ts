import { api } from "@/core";


export const followShopApi = {
	toggleFollowShop: async (shopId: number): Promise<{ isFollowing: boolean }> => {
		const response = await api.post(`/shop/${shopId}/follow`);
		return response.data;
	},

	getFollowedShops: async (): Promise<any[]> => {
		const response = await api.get("/shop/followed");
		return response.data || [];
	},

	checkFollowStatus: async (shopId: number): Promise<{ isFollowing: boolean }> => {
		const response = await api.get(`/shop/${shopId}/follow-status`);
		return response.data;
	},

	getShopFollowers: async (
		shopId: number,
		pageNumber = 1,
		pageSize = 10,
		fromDate?: string,
	): Promise<any> => {
		const params = new URLSearchParams();
		params.append("pageNumber", String(pageNumber));
		params.append("pageSize", String(pageSize));
		if (fromDate) {
			params.append("fromDate", fromDate);
		}
		const response = await api.get(`/shop/${shopId}/followers?${params.toString()}`);
		return response.data?.value || response.data;
	},

	getFollowersCount: async (shopId: number): Promise<{ count: number }> => {
		const response = await api.get(`/shop/${shopId}/followers-count`);
		return response.data?.value || response.data;
	},
};
