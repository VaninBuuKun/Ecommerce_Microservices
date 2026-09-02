import { api } from "@/core";
import type { Product } from "@/domains/catalog";
export interface GetProductsParams {
	searchTerm?: string;
	categoryId?: number;
	minRating?: number;
	cursor?: string;
	limit?: number;
	sortBy?: string;
	pageNumber?: number;
	pageSize?: number;
}

export interface GetMyProductsParams {
	shopId: number;
	page?: number;
	pageSize?: number;
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
	categoryId?: number;
	attributesJson?: string;
}

export interface UpdateMultiVariantsRequest {
	options: Array<{
		id?: number | null;
		name: string;
		values: Array<{
			id?: number | null;
			value: string;
			imageUrl?: string | null;
		}>;
	}>;
	variants: Array<{
		id?: number | null;
		price: number;
		availableStock: number;
		discountPrice?: number | null;
		optionValues: Array<{
			optionName: string;
			valueName: string;
		}>;
	}>;
	[key: string]: any;
}

export type BulkUpdateVariantsRequest = UpdateMultiVariantsRequest;

export interface UpdateSingleVariantRequest {
	price: number;
	availableStock: number;
	weight: number;
	length: number;
	width: number;
	height: number;
	discountPrice?: number | null;
}

export type UpdateProductSaleRequest = UpdateSingleVariantRequest;

export const productApi = {
	getProducts: async (params?: GetProductsParams): Promise<{ items: Product[]; totalCount: number; nextCursor?: string; hasNext?: boolean }> => {
		const queryParams: any = { ...params };
		if (params?.pageSize && !params?.limit) {
			queryParams.limit = params.pageSize;
		}
		if (params?.pageNumber) {
			queryParams.page = params.pageNumber;
		}
		const response = await api.get("/products", { params: queryParams });
		const raw = response.data?.value || response.data;
		if (Array.isArray(raw)) {
			return { items: raw, totalCount: raw.length, hasNext: false };
		}
		if (raw && typeof raw === "object") {
			return {
				items: raw.items || raw.products || [],
				totalCount: raw.totalCount || raw.total || (raw.items ? raw.items.length : 0),
				nextCursor: raw.nextCursor,
				hasNext: raw.hasNext ?? !!raw.nextCursor,
			};
		}
		return { items: [], totalCount: 0, hasNext: false };
	},

	getMyProducts: async (params: GetMyProductsParams): Promise<any> => {
		const { shopId, ...queryParams } = params;
		const response = await api.get(`/products/my-shop/${shopId}`, { params: queryParams });
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

	updateProductAttributes: async (id: string, attributesJson: string): Promise<any> => {
		const response = await api.put(`/products/${id}/attributes`, { attributesJson });
		return response.data;
	},

	updateProduct: async (
		id: string,
		payload: UpdateProductRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}`, payload);
		return response.data;
	},

	updateSingleVariant: async (
		id: string,
		payload: UpdateSingleVariantRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/single-variant`, payload);
		return response.data;
	},

	updateMultiVariants: async (
		id: string,
		payload: UpdateMultiVariantsRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/multi-variants`, payload);
		return response.data;
	},

	// Aliases
	updateProductSale: async (
		id: string,
		payload: UpdateSingleVariantRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/single-variant`, payload);
		return response.data;
	},

	bulkUpdateVariants: async (
		id: string,
		payload: UpdateMultiVariantsRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/multi-variants`, payload);
		return response.data;
	},

	deleteProduct: async (id: string): Promise<void> => {
		await api.delete(`/products/${id}`);
	},

	toggleProductStatus: async (id: string): Promise<any> => {
		const response = await api.put(`/products/${id}/toggle-status`);
		return response.data;
	},
};
