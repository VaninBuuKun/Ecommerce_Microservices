import { api } from "@/core";

export interface AdminOverviewData {
	totalShops: number;
	totalOrders: number;
	platformRevenue: number;
	totalGmv: number;
	netPlatformRevenue: number;
	platformDiscountAmount: number;
	todayNewOrders: number;
}

export interface AdminRevenueChartPoint {
	date: string;
	revenue: number;
	gmv: number;
	netRevenue: number;
	orderCount: number;
}

export interface AdminTopProductItem {
	productId: string | number;
	name: string;
	thumbnailUrl?: string;
	soldQuantity: number;
	revenue: number;
}

export interface AdminRevenueChartParams {
	period?: string;
	year?: number;
	month?: number;
}

export const adminAnalyticsApi = {
	getOverview: async (): Promise<AdminOverviewData> => {
		try {
			const res = await api.get<AdminOverviewData>("/analytics/admin/overview");
			const raw = res.data;
			return {
				totalShops: Number(raw?.totalShops || 0),
				totalOrders: Number(raw?.totalOrders || 0),
				platformRevenue: Number(raw?.platformRevenue || 0),
				totalGmv: Number(raw?.totalGmv || 0),
				netPlatformRevenue: Number(raw?.netPlatformRevenue || 0),
				platformDiscountAmount: Number(raw?.platformDiscountAmount || 0),
				todayNewOrders: Number(raw?.todayNewOrders || 0),
			};
		} catch (err) {
			console.error("Lỗi khi tải thống kê tổng quan sàn:", err);
			return {
				totalShops: 0,
				totalOrders: 0,
				platformRevenue: 0,
				totalGmv: 0,
				netPlatformRevenue: 0,
				platformDiscountAmount: 0,
				todayNewOrders: 0,
			};
		}
	},

	getRevenueChart: async (
		params?: AdminRevenueChartParams | string
	): Promise<AdminRevenueChartPoint[]> => {
		try {
			const queryParams = typeof params === "string" ? { period: params } : params;
			const res = await api.get<AdminRevenueChartPoint[]>("/analytics/admin/revenue-chart", {
				params: queryParams,
			});
			return (res.data || []).map((p) => ({
				...p,
				revenue: Number(p.revenue || 0),
				gmv: Number(p.gmv || 0),
				netRevenue: Number(p.netRevenue || 0),
				orderCount: Number(p.orderCount || 0),
			}));
		} catch (err) {
			console.error("Lỗi khi tải biểu đồ doanh thu sàn:", err);
			return [];
		}
	},

	getTopProducts: async (limit: number = 25): Promise<AdminTopProductItem[]> => {
		try {
			const res = await api.get<AdminTopProductItem[]>("/analytics/admin/top-products", {
				params: { limit },
			});
			return (res.data || []).map((p) => ({
				...p,
				soldQuantity: Number(p.soldQuantity || 0),
				revenue: Number(p.revenue || 0),
			}));
		} catch (err) {
			console.error("Lỗi khi tải top sản phẩm sàn:", err);
			return [];
		}
	},

	/**
	 * Đo đạc số lượng người dùng trực tiếp từ Identity.Api
	 */
	getUserCount: async (): Promise<number> => {
		try {
			const res = await api.get<{ totalUsers?: number; totalCount?: number }>("/users/count");
			if (typeof res.data?.totalUsers === "number") {
				return res.data.totalUsers;
			}
			if (typeof res.data?.totalCount === "number") {
				return res.data.totalCount;
			}
		} catch {
			try {
				const res = await api.get<{ totalCount: number }>("/users", {
					params: { page: 1, pageSize: 1 },
				});
				if (typeof res.data?.totalCount === "number") {
					return res.data.totalCount;
				}
			} catch (err) {
				console.warn("Không thể tải số lượng người dùng từ Identity.Api:", err);
			}
		}
		return 0;
	},
};
