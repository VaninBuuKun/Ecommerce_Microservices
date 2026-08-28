import api from "@/core/api/axiosInstance";

export interface AddItemRequest {
	variantId: number;
	quantity: number;
}

export interface UpdateQuantityRequest {
	quantity: number;
}

export interface UpdateSelectStateRequest {
	isSelected: boolean;
}

export const cartApi = {
	getCart: async (): Promise<any> => {
		const response = await api.get("/carts");
		return response.data;
	},

	addItem: async (data: AddItemRequest): Promise<any> => {
		const response = await api.post("/carts/items", data);
		return response.data;
	},

	updateQuantity: async ({
		productId,
		quantity,
	}: {
		productId: number;
		quantity: number;
	}): Promise<any> => {
		const response = await api.put(`/carts/items/${productId}`, { quantity });
		return response.data;
	},

	updateSelectState: async ({
		variantId,
		isSelected,
	}: {
		variantId: number;
		isSelected: boolean;
	}): Promise<any> => {
		const response = await api.put(`/carts/items/${variantId}/select`, { isSelected });
		return response.data;
	},

	removeItem: async (productId: number): Promise<any> => {
		const response = await api.delete(`/carts/items/${productId}`);
		return response.data;
	},

	clearCart: async (): Promise<any> => {
		const response = await api.delete("/carts");
		return response.data;
	},
};
