import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsApi } from "../api/adminAnalyticsApi";

export const adminAnalyticsQueryKeys = {
	all: ["admin-analytics"] as const,
	overview: () => ["admin-analytics", "overview"] as const,
	revenueChart: (period?: string) => ["admin-analytics", "revenue-chart", period] as const,
	userCount: () => ["admin-analytics", "user-count"] as const,
};

export function useAdminOverviewQuery() {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.overview(),
		queryFn: () => adminAnalyticsApi.getOverview(),
		staleTime: 60 * 1000,
	});
}

export function useAdminRevenueChartQuery(period: "7d" | "30d" = "7d") {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.revenueChart(period),
		queryFn: () => adminAnalyticsApi.getRevenueChart(period),
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
