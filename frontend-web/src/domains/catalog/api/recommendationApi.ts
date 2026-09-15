import { api } from "@/core";
import type {
	RecommendationResponse,
	TrackProductViewRequest,
	ProductViewStats,
} from "../types/catalog.types";
import {
	mockSimilarProductsList,
	mockPersonalizedList,
	mockTrendingList,
	mockProductViewStatsData,
} from "./mockRecommendations";

/**
 * =========================================================================
 * CẤU HÌNH DỮ LIỆU GỢI Ý / ANALYST SERVICE (ĐIỀU CHỈNH 1 CHỖ TẠI ĐÂY)
 * =========================================================================
 * - Đặt false: Gọi API backend thật (/recommendations/..., /product-views/...)
 * - Đặt true:  Sử dụng dữ liệu Mock phong phú cho FE khi backend chưa có data hoặc tắt server.
 * (Có thể bật nhanh tạm thời từ Console: localStorage.setItem("USE_MOCK_RECOMMENDATIONS", "true"))
 */
export const USE_MOCK_RECOMMENDATIONS = false;

function isMockEnabled(): boolean {
	if (typeof window !== "undefined") {
		const localSetting = localStorage.getItem("USE_MOCK_RECOMMENDATIONS");
		if (localSetting !== null) return localSetting === "true";
	}
	return USE_MOCK_RECOMMENDATIONS;
}

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
		if (isMockEnabled()) {
			return {
				strategy: "SimilarProducts-Mock",
				items: mockSimilarProductsList.slice(0, limit),
				total: mockSimilarProductsList.length,
			};
		}
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
		if (isMockEnabled()) {
			return {
				strategy: "PersonalizedFeed-Mock",
				items: mockPersonalizedList,
				total: mockPersonalizedList.length,
				page,
				pageSize: 18,
				hasNext: page < 3,
			};
		}
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
		if (isMockEnabled()) {
			return {
				strategy: "Trending-Mock",
				items: mockTrendingList,
				total: mockTrendingList.length,
				page,
				pageSize: 18,
				hasNext: page < 3,
			};
		}
		const response = await api.get<RecommendationResponse>("/recommendations/trending", {
			params: { page },
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	syncCatalogData: async (): Promise<{ success: boolean; categoriesSynced: number; productsSynced: number; message: string }> => {
		if (isMockEnabled()) {
			return {
				success: true,
				categoriesSynced: 129,
				productsSynced: 180,
				message: "Đồng bộ thành công dữ liệu mẫu (Mock mode)",
			};
		}
		const response = await api.post("/recommendations/sync");
		return response.data;
	},

	trackProductView: async (data: TrackProductViewRequest): Promise<{ tracked: boolean }> => {
		if (isMockEnabled()) {
			return { tracked: true };
		}
		const response = await api.post("/product-views", {
			productId: String(data.productId),
			durationSeconds: data.durationSeconds,
		}, {
			headers: { "X-Session-Id": getSessionId() },
		});
		return response.data;
	},

	getProductViewStats: async (productId: string | number): Promise<ProductViewStats> => {
		if (isMockEnabled()) {
			return {
				...mockProductViewStatsData,
				productId,
			};
		}
		const response = await api.get<ProductViewStats>(`/product-views/${productId}/stats`);
		return response.data;
	},
};

