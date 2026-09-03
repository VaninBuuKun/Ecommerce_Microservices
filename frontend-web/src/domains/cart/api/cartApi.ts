import { api } from "@/core";

export interface AddItemRequest {
	variantId: string;
	quantity: number;
	isSelected?: boolean;
}

export interface UpdateQuantityRequest {
	variantId: string;
	quantity: number;
}

export interface UpdateSelectStateRequest {
	variantId: string;
	isSelected: boolean;
}

export interface RemoveItemRequest {
	variantId: string;
}

export interface RebuyRequest {
	subOrderId?: number | string | null;
	variantIds?: (number | string)[] | null;
}

export const cartApi = {
	getCart: async (): Promise<any> => {
		const response = await api.get("/carts");
		return response.data;
	},

	addItem: async (data: AddItemRequest): Promise<any> => {
		const response = await api.post("/carts/items", {
			variantId: data.variantId,
			quantity: data.quantity,
			isSelected: data.isSelected ?? true,
		});
		return response.data;
	},

	updateQuantity: async (data: UpdateQuantityRequest): Promise<any> => {
		const response = await api.put("/carts/items/quantity", {
			variantId: data.variantId,
			quantity: data.quantity,
		});
		return response.data;
	},

	updateSelectState: async (data: UpdateSelectStateRequest): Promise<any> => {
		const response = await api.put("/carts/items/select", {
			variantId: data.variantId,
			isSelected: data.isSelected,
		});
		return response.data;
	},

	removeItem: async (data: RemoveItemRequest | string): Promise<any> => {
		const variantId = typeof data === "string" ? data : data.variantId;
		const response = await api.delete("/carts/items", {
			params: {
				variantId,
			},
		});
		return response.data;
	},

	clearCart: async (): Promise<any> => {
		const response = await api.delete("/carts");
		return response.data;
	},

	rebuy: async (data: RebuyRequest): Promise<any> => {
		const response = await api.post("/carts/rebuy", {
			subOrderId: data.subOrderId ? String(data.subOrderId) : null,
			variantIds: data.variantIds ? data.variantIds.map(String) : null,
		});
		return response.data;
	},
};
