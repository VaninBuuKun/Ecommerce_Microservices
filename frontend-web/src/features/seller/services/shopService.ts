import api from "../../../shared/lib/axios";
import type { CreateShopRequest, Shop, ShopCreatedResponse } from "../types";

export const shopService = {
	async createNewShop(
		payload: CreateShopRequest,
	): Promise<ShopCreatedResponse> {
		var res = await api.post("/shops", payload);
		return res.data;
	},
};
