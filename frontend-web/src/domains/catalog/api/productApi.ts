import { api } from "@/core";
import type { Product, SearchSuggestionsResponse, SearchProductsResponse } from "../types/catalog.types";

export interface PagedResult<T> {
	items: T[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface GetProductsParams {
	searchTerm?: string;
	categoryId?: number;
	minRating?: number;
	cursor?: string;
	limit?: number;
	sortBy?: string;
	pageNumber?: number;
	pageSize?: number;
	hasDiscount?: boolean;
	minPrice?: number;
	maxPrice?: number;
}

export interface SearchProductsParams {
	q?: string;
	searchTerm?: string;
	parentCategoryId?: number;
	categoryId?: number;
	minRating?: number;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	shopId?: number;
	hasDiscount?: boolean;
	minPrice?: number;
	maxPrice?: number;
}

export interface GetExploreProductsParams extends SearchProductsParams {}

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
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
}

export interface UpdateMultiVariantsRequest {
	options: Array<{
		id?: string | null;
		name: string;
		values: Array<{
			id?: string | null;
			value: string;
			imageUrl?: string | null;
		}>;
	}>;
	variants: Array<{
		id?: string | null;
		price: number;
		availableStock: number;
		discountPrice?: number | null;
		optionValues: Array<{
			optionName: string;
			valueName: string;
		}>;
	}>;
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
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

	searchProducts: async (params?: SearchProductsParams): Promise<SearchProductsResponse> => {
		const response = await api.get("/products/search", { params });
		return response.data?.value || response.data;
	},

	getExploreProducts: async (params?: GetExploreProductsParams): Promise<PagedResult<Product>> => {
		const response = await api.get("/products/search", { params: { ...params, q: params?.q || params?.searchTerm } });
		const raw = response.data?.value || response.data;
		if (raw && typeof raw === "object") {
			const pagedObj = raw.products || raw;
			return {
				items: pagedObj.items || [],
				totalCount: pagedObj.totalCount || 0,
				page: pagedObj.page || 1,
				pageSize: pagedObj.pageSize || 36,
				totalPages: pagedObj.totalPages || 1,
			};
		}
		return { items: [], totalCount: 0, page: 1, pageSize: 36, totalPages: 1 };
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

	deleteProductVariant: async (productId: string, variantId: string): Promise<any> => {
		const response = await api.delete(`/products/${productId}/variants/${variantId}`);
		return response.data;
	},

	deleteProductOption: async (productId: string, optionId: string): Promise<any> => {
		const response = await api.delete(`/products/${productId}/options/${optionId}`);
		return response.data;
	},

	deleteProductOptionValue: async (productId: string, optionId: string, valueId: string): Promise<any> => {
		const response = await api.delete(`/products/${productId}/options/${optionId}/values/${valueId}`);
		return response.data;
	},

	toggleProductStatus: async (id: string): Promise<any> => {
		const response = await api.put(`/products/${id}/toggle-status`);
		return response.data;
	},

	getSearchSuggestions: async (query: string, limit: number = 5): Promise<SearchSuggestionsResponse> => {
		const response = await api.get("/products/suggestions", { params: { q: query, limit } });
		return response.data?.value || response.data;
	},

	getTrendingKeywords: async (limit: number = 5): Promise<string[]> => {
		const response = await api.get("/products/trending", { params: { limit } });
		return response.data?.value || response.data || [];
	},

	getSearchHistory: async (): Promise<string[]> => {
		const response = await api.get("/products/search-history");
		return response.data?.value || response.data || [];
	},

	saveSearchKeyword: async (keyword: string): Promise<boolean> => {
		const response = await api.post("/products/search-history", { keyword });
		return response.data?.value || response.data;
	},

	syncSearchHistory: async (keywords: string[]): Promise<string[]> => {
		const response = await api.post("/products/search-history/sync", { keywords });
		return response.data?.value || response.data || [];
	},

	clearSearchHistory: async (): Promise<boolean> => {
		const response = await api.delete("/products/search-history");
		return response.data?.value || response.data;
	},

	removeSearchHistoryItem: async (keyword: string): Promise<boolean> => {
		const response = await api.delete("/products/search-history/item", { params: { keyword } });
		return response.data?.value || response.data;
	},
};
