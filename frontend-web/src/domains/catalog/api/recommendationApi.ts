import { api } from "@/core";
import type {
	RecommendationResponse,
	TrackProductViewRequest,
	ProductViewStats,
} from "../types/catalog.types";

function getSessionId(): string {
	if (typeof window === "undefined") return "";
	let sid = sessionStorage.getItem("ecommerce_session_id");
	if (!sid) {
		sid = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
		sessionStorage.setItem("ecommerce_session_id", sid);
	}
	return sid;
}

export const recommendationApi = {
	getSimilarProducts: async (productId: string | number, limit: number = 12): Promise<RecommendationResponse> => {
		const response = await api.get<RecommendationResponse>(`/recommendations/similar/${productId}`, {
			params: { limit },
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	getPersonalizedRecommendations: async (
		pageOrParams: number | { page?: number } = 1
	): Promise<RecommendationResponse> => {
		const page = typeof pageOrParams === "number" ? pageOrParams : (pageOrParams?.page ?? 1);
		const response = await api.get<RecommendationResponse>("/recommendations/for-you", {
			params: { page },
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	getTrendingProducts: async (
		pageOrParams: number | { page?: number } = 1
	): Promise<RecommendationResponse> => {
		const page = typeof pageOrParams === "number" ? pageOrParams : (pageOrParams?.page ?? 1);
		const response = await api.get<RecommendationResponse>("/recommendations/trending", {
			params: { page },
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	syncCatalogData: async (): Promise<{ success: boolean; categoriesSynced: number; productsSynced: number; message: string }> => {
		const response = await api.post("/recommendations/sync");
		return response.data;
	},

	trackProductView: async (data: TrackProductViewRequest): Promise<{ tracked: boolean }> => {
		const response = await api.post("/product-views", {
			productId: Number(data.productId),
			durationSeconds: data.durationSeconds,
		}, {
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	getProductViewStats: async (productId: string | number): Promise<ProductViewStats> => {
		const response = await api.get<ProductViewStats>(`/product-views/${productId}/stats`);
		return response.data;
	},
};
