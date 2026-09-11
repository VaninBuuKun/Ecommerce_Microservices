import { api } from "@/core";
import { isMockAnalyticsEnabled } from "@/core/config/analyticsConfig";
import {
	mockAdminOverview,
	mockAdminRevenue7d,
	mockAdminRevenue30d,
} from "./mockAdminAnalytics";
import type {
	AdminOverviewData,
	AdminRevenueChartPoint,
} from "./mockAdminAnalytics";

export type { AdminOverviewData, AdminRevenueChartPoint };

export const adminAnalyticsApi = {
	getOverview: async (): Promise<AdminOverviewData> => {
		if (isMockAnalyticsEnabled()) {
			return mockAdminOverview;
		}
		try {
			const res = await api.get<AdminOverviewData>("/analytics/admin/overview");
			return res.data;
		} catch (err) {
			console.warn("Analytics API unavailable, falling back to mock admin overview:", err);
			return mockAdminOverview;
		}
	},

	getRevenueChart: async (
		period: "7d" | "30d" = "7d"
	): Promise<AdminRevenueChartPoint[]> => {
		if (isMockAnalyticsEnabled()) {
			return period === "30d" ? mockAdminRevenue30d : mockAdminRevenue7d;
		}
		try {
			const res = await api.get<AdminRevenueChartPoint[]>("/analytics/admin/revenue-chart", {
				params: { period },
			});
			return res.data;
		} catch (err) {
			console.warn("Analytics API unavailable, falling back to mock admin chart:", err);
			return period === "30d" ? mockAdminRevenue30d : mockAdminRevenue7d;
		}
	},

	/**
	 * Đo đạc số lượng người dùng trực tiếp từ Identity.Api (theo yêu cầu không qua Analytics Service).
	 */
	getUserCount: async (): Promise<number> => {
		if (isMockAnalyticsEnabled()) {
			return 24; // Default seeded users count
		}
		try {
			// Gọi endpoint chuyên dụng /users/count trong Identity.Api
			const res = await api.get<{ totalUsers?: number; totalCount?: number }>("/users/count");
			if (typeof res.data?.totalUsers === "number") {
				return res.data.totalUsers;
			}
			if (typeof res.data?.totalCount === "number") {
				return res.data.totalCount;
			}
		} catch {
			// Fallback sang endpoint phân trang /users?pageSize=1
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
		return 24;
	},
};
