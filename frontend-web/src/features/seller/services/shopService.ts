import api from "../../../shared/lib/axios";
import type { CreateShopRequest, ShopCreatedResponse } from "../types";

export const shopService = {
	async createNewShop(
		payload: CreateShopRequest,
	): Promise<ShopCreatedResponse> {
		const res = await api.post<ShopCreatedResponse>("/shop", payload);
		return res.data;
	},

	async updateShop(
		id: string,
		payload: {
			name: string;
			description: string;
			logoUrl?: string;
			recipientName: string;
			phone: string;
			addressLine: string;
			provinceId: number;
			districtId: number;
			wardId: number;
		},
	): Promise<any> {
		const res = await api.put(`/shop/${id}`, payload);
		return res.data;
	},

	async getShopDetail(id: string): Promise<any> {
		const res = await api.get(`/shop/${id}`);
		return res.data;
	},
};
