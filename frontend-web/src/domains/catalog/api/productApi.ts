import { api } from "@/core";
import type {Product} from "@/domains/catalog";
export interface GetProductsParams {
	searchTerm?: string;
	categoryId?: string;
	minRating?: number;
	cursor?: string;
	limit?: number;
	sortBy?: string;
}

export interface GetMyProductsParams {
	page?: number;
	pageSize?: number;
	ShopId?: number;
	searchTerm?: string;
}

export interface CreateProductRequest {
	shopId: number;
	name: string;
	description: string;
	thumbnailUrl?: string;
}

export interface UpdateProductRequest {
	name: string;
	description: string;
	thumbnailUrl?: string;
	videoUrl?: string;
	imageUrls: string[];
	categoryId?: string;
}

export interface BulkUpdateVariantsRequest {
	variants: Array<{
		id: number | string;
		price?: number;
		availableStock?: number;
		sku?: string;
		weight?: number;
		length?: number;
		width?: number;
		height?: number;
		discountPrice?: number;
	}>;
	[key: string]: any;
}

export interface UpdateProductSaleRequest {
	price: number;
	discountPrice: number | null;
	weight: number;
	height: number;
	length: number;
	width: number;
	availableStock: number;
}

export const productApi = {
	getProducts: async (params?: GetProductsParams): Promise<any> => {
		const response = await api.get("/products", { params });
		return response.data;
	},

	getMyProducts: async (params?: GetMyProductsParams): Promise<any> => {
		const response = await api.get("/products/me", { params });
		return response.data;
	},

	createProduct: async (payload: CreateProductRequest): Promise<any> => {
		const response = await api.post("/products", payload);
		return response.data;
	},

	getProductById: async (id: string): Promise<Product> => {
		const response = await api.get(`/products/${id}`);
		return response.data?.value || response.data;
	},

	updateProduct: async (
		id: string,
		payload: UpdateProductRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}`, payload);
		return response.data;
	},
	
	bulkUpdateVariants: async (
		id: string,
		payload: BulkUpdateVariantsRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/variants`, payload);
		return response.data;
	},

	deleteProduct: async (id: string): Promise<void> => {
		await api.delete(`/products/${id}`);
	},

	toggleProductStatus: async (id: string): Promise<any> => {
		const response = await api.put(`/products/${id}/toggle-status`);
		return response.data;
	},

	updateProductSale: async (
		id: string,
		payload: UpdateProductSaleRequest,
	): Promise<void> => {
		await api.put(`/products/${id}/sale`, payload);
	},
};
