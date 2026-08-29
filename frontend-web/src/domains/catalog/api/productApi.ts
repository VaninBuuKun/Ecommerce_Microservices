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

export interface BulkUpdateVariantsRequest {
	variants: Array<{
		id: number;
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

	getProductById: async (id: number): Promise<Product> => {
		const { USE_MOCK_DATA, MOCK_PRODUCTS } = await import("./catalogMockData");
		if (USE_MOCK_DATA) {
			const found = MOCK_PRODUCTS.find((p) => p.id === Number(id));
			if (found) return found;
		}
		const response = await api.get(`/products/${id}`);
		return response.data?.value || response.data;
	},

	updateProductAttributes: async (id: number, attributesJson: string): Promise<any> => {
		const response = await api.put(`/products/${id}/attributes`, { attributesJson });
		return response.data;
	},

	updateProduct: async (
		id: number,
		payload: UpdateProductRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}`, payload);
		return response.data;
	},

	bulkUpdateVariants: async (
		id: number,
		payload: BulkUpdateVariantsRequest,
	): Promise<any> => {
		const response = await api.put(`/products/${id}/variants`, payload);
		return response.data;
	},

	deleteProduct: async (id: number): Promise<void> => {
		await api.delete(`/products/${id}`);
	},

	toggleProductStatus: async (id: number): Promise<any> => {
		const response = await api.put(`/products/${id}/toggle-status`);
		return response.data;
	},

	updateProductSale: async (
		id: number,
		payload: UpdateProductSaleRequest,
	): Promise<void> => {
		await api.put(`/products/${id}/sale`, payload);
	},
};
