import { useQuery } from "@tanstack/react-query";
import { sellerAnalyticsApi } from "../api/sellerAnalyticsApi";
import type { SellerRevenueChartParams } from "../api/sellerAnalyticsApi";

export const sellerAnalyticsQueryKeys = {
	all: ["seller-analytics"] as const,
	overview: (shopId?: string | number) => ["seller-analytics", "overview", String(shopId)] as const,
	revenueChart: (shopId?: string | number, params?: SellerRevenueChartParams | string) =>
		["seller-analytics", "revenue-chart", String(shopId), params] as const,
	topProducts: (shopId?: string | number, limit?: number) =>
		["seller-analytics", "top-products", String(shopId), limit] as const,
};

export function useSellerOverviewQuery(shopId?: string | number) {
	return useQuery({
		queryKey: sellerAnalyticsQueryKeys.overview(shopId),
		queryFn: () => sellerAnalyticsApi.getOverview(shopId!),
		enabled: Boolean(shopId),
		staleTime: 60 * 1000,
	});
}

export function useSellerRevenueChartQuery(
	shopId?: string | number,
	params?: SellerRevenueChartParams | string
) {
	return useQuery({
		queryKey: sellerAnalyticsQueryKeys.revenueChart(shopId, params),
		queryFn: () => sellerAnalyticsApi.getRevenueChart(shopId!, params),
		enabled: Boolean(shopId),
		staleTime: 60 * 1000,
	});
}

export function useSellerTopProductsQuery(
	shopId?: string | number,
	limit: number = 10
) {
	return useQuery({
		queryKey: sellerAnalyticsQueryKeys.topProducts(shopId, limit),
		queryFn: () => sellerAnalyticsApi.getTopProducts(shopId!, limit),
		enabled: Boolean(shopId),
		staleTime: 60 * 1000,
	});
}
