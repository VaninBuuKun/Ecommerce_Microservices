import api from "@/core/api/axiosInstance";

export const catalogApi = {
	getProducts: async (params?: {
		searchTerm?: string;
		categoryId?: string;
		minRating?: number;
		cursor?: string;
		limit?: number;
		sortBy?: string;
	}): Promise<any> => {
		const response = await api.get("/products", { params });
		return response.data;
	},

	getMyProducts: async (params?: {
		page?: number;
		pageSize?: number;
		ShopId?: number;
		searchTerm?: string;
	}): Promise<any> => {
		const response = await api.get("/products/me", { params });
		return response.data;
	},

	createProduct: async (payload: {
		shopId: number;
		name: string;
		description: string;
		thumbnailUrl?: string;
	}): Promise<any> => {
		const response = await api.post("/products", payload);
		return response.data;
	},

	getProductById: async (id: string): Promise<any> => {
		const response = await api.get(`/products/${id}`);
		return response.data?.value || response.data;
	},

	updateProduct: async (
		id: string,
		payload: {
			name: string;
			description: string;
			thumbnailUrl?: string;
			videoUrl?: string;
			imageUrls: string[];
			categoryId?: string;
		},
	): Promise<any> => {
		const response = await api.put(`/products/${id}`, payload);
		return response.data;
	},

	initSingleVariant: async (
		id: string,
		payload: {
			price: number;
			availableStock: number;
			sku?: string;
			weight?: number;
			length?: number;
			width?: number;
			height?: number;
			discountPrice?: number;
		},
	): Promise<any> => {
		const response = await api.put(`/products/${id}/init-single-variant`, payload);
		return response.data;
	},

	initVariants: async (
		id: string,
		payload: any
	): Promise<any> => {
		const response = await api.put(`/products/${id}/init-variants`, payload);
		return response.data;
	},

	bulkUpdateVariants: async (id: string, payload: any): Promise<any> => {
		const response = await api.put(`/products/${id}/variants`, payload);
		return response.data;
	},

	getCategories: async (): Promise<any[]> => {
		const response = await api.get("/categories");
		return response.data?.value || response.data || [];
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
		payload: {
			price: number;
			discountPrice: number | null;
			weight: number;
			height: number;
			length: number;
			width: number;
			availabeStock: number;
		},
	): Promise<void> => {
		await api.put(`/products/${id}/sale`, payload);
	},

	getProductReviews: async (productId: string, params?: any): Promise<any> => {
		const res = await api.get(`/products/${productId}/reviews`, { params });
		return res.data;
	},

	getProductReviewsSummary: async (productId: string): Promise<any> => {
		const res = await api.get(`/products/${productId}/reviews/summary`).catch(() => null);
		return res?.data || null;
	},

	addProductReview: async (data: any): Promise<any> => {
		const res = await api.post(`/products/${data.productId}/reviews`, data);
		return res.data;
	},

	// Locations API
	getProvinces: async (): Promise<any[]> => {
		const res = await api.get("/locations/provinces");
		return res.data?.value || res.data || [];
	},

	getDistricts: async (provinceId?: number): Promise<any[]> => {
		if (!provinceId) return [];
		const res = await api.get(`/locations/provinces/${provinceId}/districts`);
		return res.data?.value || res.data || [];
	},

	getWards: async (districtId?: number): Promise<any[]> => {
		if (!districtId) return [];
		const res = await api.get(`/locations/districts/${districtId}/wards`);
		return res.data?.value || res.data || [];
	},
};
