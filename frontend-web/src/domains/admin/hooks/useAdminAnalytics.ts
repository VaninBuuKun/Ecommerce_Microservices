import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsApi } from "../api/adminAnalyticsApi";
import type { AdminRevenueChartParams } from "../api/adminAnalyticsApi";

export const adminAnalyticsQueryKeys = {
	all: ["admin-analytics"] as const,
	overview: () => ["admin-analytics", "overview"] as const,
	revenueChart: (params?: AdminRevenueChartParams | string) =>
		["admin-analytics", "revenue-chart", params] as const,
	topProducts: (
		params?:
			| { page?: number; pageSize?: number; limit?: number; parentCategoryId?: number | string }
			| number
	) => ["admin-analytics", "top-products", params] as const,
	categories: (params?: { period?: string; year?: number; month?: number } | string) =>
		["admin-analytics", "categories", params] as const,
	productDetail: (productId?: string | number | null, period?: string) =>
		["admin-analytics", "product-detail", productId, period] as const,
	shopProducts: (shopId?: string | number | null, page?: number, pageSize?: number) =>
		["admin-analytics", "shop-products", shopId, page, pageSize] as const,
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

export function useAdminTopProductsQuery(
	params?:
		| {
				page?: number;
				pageSize?: number;
				limit?: number;
				parentCategoryId?: number | string;
		  }
		| number
) {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.topProducts(params),
		queryFn: () => adminAnalyticsApi.getTopProducts(params),
		staleTime: 60 * 1000,
	});
}

export function useAdminCategoriesQuery(params: { period?: string; year?: number; month?: number } | string = "7d") {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.categories(params),
		queryFn: () => adminAnalyticsApi.getCategories(params),
		staleTime: 60 * 1000,
	});
}

export function useAdminProductDetailQuery(productId?: string | number | null, period: string = "7d") {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.productDetail(productId, period),
		queryFn: () => {
			if (!productId) return null;
			return adminAnalyticsApi.getProductDetail(productId, period);
		},
		enabled: Boolean(productId),
		staleTime: 60 * 1000,
	});
}

export function useAdminShopProductsQuery(
	shopId?: string | number | null,
	page: number = 1,
	pageSize: number = 15
) {
	return useQuery({
		queryKey: adminAnalyticsQueryKeys.shopProducts(shopId, page, pageSize),
		queryFn: () => {
			if (!shopId) return { items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 1 };
			return adminAnalyticsApi.getShopProducts(shopId, page, pageSize);
		},
		enabled: Boolean(shopId),
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
