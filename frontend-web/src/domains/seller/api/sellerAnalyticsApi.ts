import { api } from "@/core";
import { isMockAnalyticsEnabled } from "@/core/config/analyticsConfig";
import {
	mockSellerOverview,
	mockSellerRevenue7d,
	mockSellerRevenue30d,
	mockSellerTopProducts,
} from "./mockSellerAnalytics";
import type {
	SellerOverviewData,
	RevenueChartPoint,
	TopProductItem,
} from "./mockSellerAnalytics";

export type { SellerOverviewData, RevenueChartPoint, TopProductItem };

export const sellerAnalyticsApi = {
	getOverview: async (shopId: string | number): Promise<SellerOverviewData> => {
		if (isMockAnalyticsEnabled()) {
			return mockSellerOverview;
		}
		try {
			const res = await api.get<SellerOverviewData>(`/analytics/shops/${shopId}/overview`);
			return res.data;
		} catch (err) {
			console.warn("Analytics API unavailable, falling back to mock overview:", err);
			return mockSellerOverview;
		}
	},

	getRevenueChart: async (
		shopId: string | number,
		period: "7d" | "30d" = "7d"
	): Promise<RevenueChartPoint[]> => {
		if (isMockAnalyticsEnabled()) {
			return period === "30d" ? mockSellerRevenue30d : mockSellerRevenue7d;
		}
		try {
			const res = await api.get<RevenueChartPoint[]>(`/analytics/shops/${shopId}/revenue-chart`, {
				params: { period },
			});
			return res.data;
		} catch (err) {
			console.warn("Analytics API unavailable, falling back to mock chart:", err);
			return period === "30d" ? mockSellerRevenue30d : mockSellerRevenue7d;
		}
	},

	getTopProducts: async (
		shopId: string | number,
		limit: number = 5
	): Promise<TopProductItem[]> => {
		if (isMockAnalyticsEnabled()) {
			return mockSellerTopProducts.slice(0, limit);
		}
		try {
			const res = await api.get<TopProductItem[]>(`/analytics/shops/${shopId}/top-products`, {
				params: { limit },
			});
			return res.data;
		} catch (err) {
			console.warn("Analytics API unavailable, falling back to mock top products:", err);
			return mockSellerTopProducts.slice(0, limit);
		}
	},
};
