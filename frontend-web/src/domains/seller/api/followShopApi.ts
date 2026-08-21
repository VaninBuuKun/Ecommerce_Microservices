import { api } from "@/core";


export const followShopApi = {
	toggleFollowShop: async (shopId: number): Promise<{ isFollowing: boolean }> => {
		const response = await api.post(`/shops/${shopId}/follow`);
		return response.data;
	},

	getFollowedShops: async (): Promise<any[]> => {
		const response = await api.get("/shops/followed");
		return response.data || [];
	},

	checkFollowStatus: async (shopId: number): Promise<{ isFollowing: boolean }> => {
		const response = await api.get(`/shops/${shopId}/follow-status`);
		return response.data;
	},
};
