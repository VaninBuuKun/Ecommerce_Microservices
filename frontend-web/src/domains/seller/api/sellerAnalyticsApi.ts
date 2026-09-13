import { api } from "@/core";

export interface SellerOverviewData {
	todayRevenue: number;
	monthRevenue: number;
	totalOrders: number;
	todayOrders: number;
	pendingOrders: number;
	totalProducts: number;
	averageRating: number;
	totalFollowers: number;
}

export interface RevenueChartPoint {
	date: string;
	revenue: number;
	orderCount: number;
}

export interface TopProductItem {
	productId: string | number;
	name: string;
	thumbnailUrl?: string;
	soldQuantity: number;
	revenue: number;
}

export interface SellerRevenueChartParams {
	period?: string;
	year?: number;
	month?: number;
}

export const sellerAnalyticsApi = {
	getOverview: async (shopId: string | number): Promise<SellerOverviewData> => {
		try {
			const res = await api.get<SellerOverviewData>(`/analytics/shops/${shopId}/overview`);
			const raw = res.data;
			return {
				todayRevenue: Number(raw?.todayRevenue || 0),
				monthRevenue: Number(raw?.monthRevenue || 0),
				totalOrders: Number(raw?.totalOrders || 0),
				todayOrders: Number(raw?.todayOrders || 0),
				pendingOrders: Number(raw?.pendingOrders || 0),
				totalProducts: Number(raw?.totalProducts || 0),
				averageRating: Number(raw?.averageRating || 5.0),
				totalFollowers: Number(raw?.totalFollowers || 0),
			};
		} catch (err) {
			console.error("Lỗi khi tải thống kê tổng quan shop:", err);
			return {
				todayRevenue: 0,
				monthRevenue: 0,
				totalOrders: 0,
				todayOrders: 0,
				pendingOrders: 0,
				totalProducts: 0,
				averageRating: 5.0,
				totalFollowers: 0,
			};
		}
	},

	getRevenueChart: async (
		shopId: string | number,
		params?: SellerRevenueChartParams | string
	): Promise<RevenueChartPoint[]> => {
		try {
			const queryParams = typeof params === "string" ? { period: params } : params;
			const res = await api.get<RevenueChartPoint[]>(`/analytics/shops/${shopId}/revenue-chart`, {
				params: queryParams,
			});
			return (res.data || []).map((p) => ({
				...p,
				revenue: Number(p.revenue || 0),
				orderCount: Number(p.orderCount || 0),
			}));
		} catch (err) {
			console.error("Lỗi khi tải biểu đồ doanh thu shop:", err);
			return [];
		}
	},

	getTopProducts: async (
		shopId: string | number,
		limit: number = 25
	): Promise<TopProductItem[]> => {
		try {
			const res = await api.get<TopProductItem[]>(`/analytics/shops/${shopId}/top-products`, {
				params: { limit },
			});
			return (res.data || []).map((p) => ({
				...p,
				soldQuantity: Number(p.soldQuantity || 0),
				revenue: Number(p.revenue || 0),
			}));
		} catch (err) {
			console.error("Lỗi khi tải top sản phẩm shop:", err);
			return [];
		}
	},
};
