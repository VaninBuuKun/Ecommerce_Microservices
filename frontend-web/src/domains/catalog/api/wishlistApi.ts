import { api } from "@/core";


export const wishlistApi = {
	toggleWishlist: async (productId: number): Promise<{ isLiked: boolean }> => {
		const response = await api.post(`/wishlists/toggle/${productId}`);
		return response.data;
	},

	getMyWishlist: async (): Promise<any[]> => {
		const response = await api.get("/wishlists");
		return response.data || [];
	},
};
