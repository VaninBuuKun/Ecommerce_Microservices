import { api } from "@/core";

export interface AdminOverviewData {
	totalShops: number;
	totalOrders: number;
	platformRevenue: number;
	totalGmv: number;
	netPlatformRevenue: number;
	platformDiscountAmount: number;
	totalShippingFee: number;
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
	parentCategoryId?: number;
	soldQuantity: number;
	revenue: number;
}

export interface AdminCategoryItem {
	categoryId: number;
	name: string;
	revenue: number;
	soldQuantity: number;
	percentage: number;
}

export interface ProductDetailAnalyticsData {
	productId: string | number;
	name: string;
	thumbnailUrl?: string;
	parentCategoryId?: number;
	soldQuantity: number;
	revenue: number;
	shopId: number;
	chartData: { date: string; revenue: number; orderCount: number }[];
}

export interface PaginatedProductsData {
	items: AdminTopProductItem[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
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
				totalShippingFee: Number(raw?.totalShippingFee || 0),
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
				totalShippingFee: 0,
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

	getTopProducts: async (
		params?:
			| {
					page?: number;
					pageSize?: number;
					limit?: number;
					parentCategoryId?: number | string;
			  }
			| number
	): Promise<PaginatedProductsData> => {
		try {
			const queryParams: Record<string, any> = {};
			if (typeof params === "number") {
				queryParams.limit = params;
			} else if (params && typeof params === "object") {
				if (params.page !== undefined) queryParams.page = params.page;
				if (params.pageSize !== undefined) queryParams.pageSize = params.pageSize;
				if (params.limit !== undefined) queryParams.limit = params.limit;
				if (
					params.parentCategoryId !== undefined &&
					params.parentCategoryId !== "all" &&
					params.parentCategoryId !== 0
				) {
					queryParams.parentCategoryId = params.parentCategoryId;
				}
			}

			const res = await api.get<any>("/analytics/admin/top-products", {
				params: queryParams,
			});
			const raw = res.data;
			if (raw && Array.isArray(raw.items)) {
				return {
					items: raw.items.map((p: any) => ({
						productId: p.productId,
						name: p.name,
						thumbnailUrl: p.thumbnailUrl,
						parentCategoryId: p.parentCategoryId ? Number(p.parentCategoryId) : undefined,
						soldQuantity: Number(p.soldQuantity || 0),
						revenue: Number(p.revenue || 0),
					})),
					totalCount: Number(raw.totalCount || 0),
					page: Number(raw.page || 1),
					pageSize: Number(raw.pageSize || 15),
					totalPages: Number(raw.totalPages || 1),
				};
			}
			if (Array.isArray(raw)) {
				const items = raw.map((p: any) => ({
					productId: p.productId,
					name: p.name,
					thumbnailUrl: p.thumbnailUrl,
					parentCategoryId: p.parentCategoryId ? Number(p.parentCategoryId) : undefined,
					soldQuantity: Number(p.soldQuantity || 0),
					revenue: Number(p.revenue || 0),
				}));
				return {
					items,
					totalCount: items.length,
					page: 1,
					pageSize: items.length,
					totalPages: 1,
				};
			}
			return { items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 1 };
		} catch (err) {
			console.error("Lỗi khi tải top sản phẩm sàn:", err);
			return { items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 1 };
		}
	},

	getCategories: async (
		params?: { period?: string; year?: number; month?: number } | string
	): Promise<AdminCategoryItem[]> => {
		try {
			const queryParams = typeof params === "string" ? { period: params } : params;
			const res = await api.get<AdminCategoryItem[]>("/analytics/admin/categories", {
				params: queryParams,
			});
			return (res.data || []).map((c) => ({
				categoryId: Number(c.categoryId),
				name: c.name,
				revenue: Number(c.revenue || 0),
				soldQuantity: Number(c.soldQuantity || 0),
				percentage: Number(c.percentage || 0),
			}));
		} catch (err) {
			console.error("Lỗi khi tải thống kê danh mục sàn:", err);
			return [];
		}
	},

	getProductDetail: async (
		productId: string | number,
		period: string = "7d"
	): Promise<ProductDetailAnalyticsData | null> => {
		try {
			const res = await api.get<ProductDetailAnalyticsData>(`/analytics/admin/products/${productId}`, {
				params: { period },
			});
			return res.data;
		} catch (err) {
			console.error(`Lỗi khi tải chi tiết phân tích sản phẩm #${productId}:`, err);
			return null;
		}
	},

	getShopProducts: async (
		shopId: string | number,
		page: number = 1,
		pageSize: number = 15
	): Promise<PaginatedProductsData> => {
		try {
			const res = await api.get<any>(`/analytics/admin/shops/${shopId}/products`, {
				params: { page, pageSize },
			});
			const raw = res.data;
			if (raw && Array.isArray(raw.items)) {
				return {
					items: raw.items.map((p: any) => ({
						productId: p.productId,
						name: p.name,
						thumbnailUrl: p.thumbnailUrl,
						parentCategoryId: p.parentCategoryId ? Number(p.parentCategoryId) : undefined,
						soldQuantity: Number(p.soldQuantity || 0),
						revenue: Number(p.revenue || 0),
					})),
					totalCount: Number(raw.totalCount || 0),
					page: Number(raw.page || 1),
					pageSize: Number(raw.pageSize || 15),
					totalPages: Number(raw.totalPages || 1),
				};
			}
			return { items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 1 };
		} catch (err) {
			console.error(`Lỗi khi tải sản phẩm của shop #${shopId}:`, err);
			return { items: [], totalCount: 0, page: 1, pageSize: 15, totalPages: 1 };
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
