import { api } from "@/core";
import type { ProductReview, ProductReviewSummary } from "../types/catalog.types";

export interface GetProductReviewsParams {
	page?: number;
	pageSize?: number;
	rating?: number;
	[key: string]: any;
}

export interface AddProductReviewRequest {
	productId: string;
	rating: number;
	comment?: string;
	mediaList?: string[];
	[key: string]: any;
}

export const reviewApi = {
	getProductReviews: async (
		productId: string,
		params?: GetProductReviewsParams,
	): Promise<ProductReview[] | any> => {
		const res = await api.get(`/products/${productId}/reviews`, { params });
		return res.data;
	},

	getProductReviewsSummary: async (
		productId: string,
	): Promise<ProductReviewSummary | null> => {
		const res = await api
			.get(`/products/${productId}/reviews/summary`)
			.catch(() => null);
		return res?.data || null;
	},

	addProductReview: async (data: AddProductReviewRequest): Promise<any> => {
		const res = await api.post(`/products/${data.productId}/reviews`, data);
		return res.data;
	},
};
