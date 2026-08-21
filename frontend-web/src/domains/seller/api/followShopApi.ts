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
};
