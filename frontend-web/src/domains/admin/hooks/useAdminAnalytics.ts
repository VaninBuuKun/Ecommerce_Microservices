import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsApi } from "../api/adminAnalyticsApi";
import type { AdminRevenueChartParams } from "../api/adminAnalyticsApi";

export const adminAnalyticsQueryKeys = {
	all: ["admin-analytics"] as const,
	overview: () => ["admin-analytics", "overview"] as const,
	revenueChart: (params?: AdminRevenueChartParams | string) =>
		["admin-analytics", "revenue-chart", params] as const,
	topProducts: (limit?: number) => ["admin-analytics", "top-products", limit] as const,
	userCount: () => ["admin-analytics", "user-count"] as const,
};

export function useAdminOverviewQuery() {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.overview(),
		queryFn: () => adminAnalyticsApi.getOverview(),
		staleTime: 60 * 1000,
	});
}

export function useAdminRevenueChartQuery(params?: AdminRevenueChartParams | string) {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.revenueChart(params),
		queryFn: () => adminAnalyticsApi.getRevenueChart(params),
		staleTime: 60 * 1000,
	});
}

export function useAdminTopProductsQuery(limit: number = 10) {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.topProducts(limit),
		queryFn: () => adminAnalyticsApi.getTopProducts(limit),
		staleTime: 60 * 1000,
	});
}

export function useAdminUserCountQuery() {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.userCount(),
		queryFn: () => adminAnalyticsApi.getUserCount(),
		staleTime: 30 * 1000,
	});
}
