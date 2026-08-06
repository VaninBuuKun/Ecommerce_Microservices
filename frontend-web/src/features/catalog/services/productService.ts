import api from "../../../shared/lib/axios";
import type { Product, PagedCursorResponse } from "../types";

export const productService = {
	getProducts: async (params: {
		searchTerm?: string;
		categoryId?: string;
		minRating?: number;
		cursor?: string;
		limit?: number;
		sortBy?: string;
	}): Promise<PagedCursorResponse<Product>> => {
		const response = await api.get<PagedCursorResponse<Product>>(
			"/products",
			{ params },
		);
		return response.data;
	},

	getMyProducts: async (params: {
		page: number;
		pageSize: number;
		ShopId: number;
	}): Promise<Product[]> => {
		const response = await api.get<Product[]>("/products/me", { params });
		return response.data;
	},

	createProduct: async (payload: {
		shopId: number;
		name: string;
		description: string;
		thumbnailUrl?: string;
	}): Promise<Product> => {
		const response = await api.post<Product>("/products", payload);
		return response.data;
	},

	getProductById: async (id: string): Promise<Product> => {
		const response = await api.get<Product>(`/products/${id}`);
		return response.data;
	},

	updateProduct: async (
		id: string,
		payload: {
			name: string;
			description: string;
			weight: number;
			length: number;
			width: number;
			height: number;
			thumbnailUrl?: string;
			videoUrl?: string;
			imageUrls: string[];
		},
	): Promise<Product> => {
		const response = await api.put<Product>(`/products/${id}`, payload);
		return response.data;
	},

	setupSingleVariant: async (
		id: string,
		payload: {
			price: number;
			availableStock: number;
			sku?: string;
			weight?: number;
			length?: number;
			width?: number;
			height?: number;
		},
	): Promise<Product> => {
		const response = await api.put<Product>(
			`/products/${id}/single-variant`,
			payload,
		);
		return response.data;
	},

	initVariants: async (
		id: string,
		payload: {
			options: {
				name: string;
				values: { value: string; imageUrl?: string }[];
			}[];
			variants: {
				sku?: string;
				price: number;
				availableStock: number;
				optionValues: {
					optionName: string;
					valueName: string;
				}[];
				weight?: number;
				length?: number;
				width?: number;
				height?: number;
			}[];
		},
	): Promise<Product> => {
		const response = await api.put<Product>(
			`/products/${id}/init-variants`,
			payload,
		);
		return response.data;
	},

	bulkUpdateVariants: async (
		id: string,
		payload: {
			variants: {
				id?: string;
				sku?: string;
				price: number;
				availableStock: number;
				optionValues: {
					optionName: string;
					valueName: string;
				}[];
				weight?: number;
				length?: number;
				width?: number;
				height?: number;
			}[];
		},
	): Promise<Product> => {
		const response = await api.put<Product>(
			`/products/${id}/variants`,
			payload,
		);
		return response.data;
	},

	getCategories: async (): Promise<any[]> => {
		const response = await api.get<any[]>("/categories");
		return response.data;
	},
};
