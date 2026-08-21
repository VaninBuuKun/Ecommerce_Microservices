import api from "../../../shared/lib/axios";
import type {
	AddItemRequest,
	CartDto,
	UpdateQuantityRequest,
	UpdateSelectStateRequest,
} from "../types";

export const cartService = {
	// Lấy giỏ hàng
	getCart: async (): Promise<CartDto> => {
		const response = await api.get<CartDto>("/carts");
		return response.data;
	},

	// Thêm sản phẩm vào giỏ (POST /api/carts/items)
	addItem: async (data: AddItemRequest): Promise<CartDto> => {
		const response = await api.post<CartDto>("/carts/items", data);
		return response.data;
	},

	// Cập nhật số lượng (PUT /api/carts/items/{productId})
	updateQuantity: async ({
		productId,
		quantity,
	}: {
		productId: string;
		quantity: number;
	}): Promise<string> => {
		const response = await api.put<string>(
			`/carts/items/${productId}`,
			{ quantity } as UpdateQuantityRequest,
		);
		return response.data;
	},

	// Cập nhật trạng thái chọn mua (PUT /api/carts/items/{variantId}/select)
	updateSelectState: async ({
		variantId,
		isSelected,
	}: {
		variantId: string;
		isSelected: boolean;
	}): Promise<string> => {
		const response = await api.put<string>(
			`/carts/items/${variantId}/select`,
			{ isSelected } as UpdateSelectStateRequest,
		);
		return response.data;
	},

	// Xóa sản phẩm khỏi giỏ (DELETE /api/carts/items/{productId})
	removeItem: async (productId: string): Promise<string> => {
		const response = await api.delete<string>(
			`/carts/items/${productId}`,
		);
		return response.data;
	},

	// Xóa toàn bộ giỏ hàng (DELETE /api/carts)
	clearCart: async (): Promise<string> => {
		const response = await api.delete<string>("/carts");
		return response.data;
	},
};
