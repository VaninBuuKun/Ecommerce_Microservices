import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { recommendationApi } from "../api/recommendationApi";
import type {
	RecommendationResponse,
	TrackProductViewRequest,
	ProductViewStats,
} from "../types/catalog.types";

export const recommendationQueryKeys = {
	all: ["recommendations"] as const,
	similar: (productId?: string | number, limit?: number) =>
		["recommendations", "similar", String(productId), limit] as const,
	forYou: (limit?: number) => ["recommendations", "for-you", limit] as const,
	forYouInfinite: (pageSize?: number) =>
		["recommendations", "for-you", "infinite", pageSize] as const,
	trending: (limit?: number) => ["recommendations", "trending", limit] as const,
	viewStats: (productId?: string | number) =>
		["product-views", "stats", String(productId)] as const,
};

/**
 * Hook gợi ý sản phẩm tương tự dựa trên danh mục, mức giá và thuộc tính (Content-based).
 * Phù hợp dùng trong trang ProductDetailPage.
 */
export function useSimilarProductsQuery(productId?: string | number, limit: number = 8) {
	return useQuery<RecommendationResponse>({
		queryKey: recommendationQueryKeys.similar(productId, limit),
		queryFn: () => recommendationApi.getSimilarProducts(productId!, limit),
		enabled: Boolean(productId),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Hook gợi ý sản phẩm cá nhân hóa dành riêng cho người dùng (Personalized For You)
 * Dựa trên lịch sử mua hàng, danh sách yêu thích và lịch sử xem sản phẩm.
 * Tự động fallback về sản phẩm bán chạy/đánh giá cao nếu chưa có tương tác.
 */
export function usePersonalizedRecommendationsQuery(
	page: number = 1,
	options?: { enabled?: boolean }
) {
	return useQuery<RecommendationResponse>({
		queryKey: recommendationQueryKeys.forYou(page),
		queryFn: () => recommendationApi.getPersonalizedRecommendations(page),
		staleTime: 3 * 60 * 1000,
		enabled: options?.enabled ?? true,
	});
}

/**
 * Hook phân trang chunk vô tận cho gợi ý cá nhân hóa (Infinite Scroll / Load More).
 * Cố định 18 sản phẩm / trang. Tối đa 6 trang (1 trang đầu + 5 lần bấm Xem thêm = 108 sản phẩm).
 * Page 1 luôn sinh pool mới từ DB & cập nhật Redis. Page 2..6 đọc trực tiếp từ Redis pool.
 */
export function useInfinitePersonalizedRecommendationsQuery(
	options?: { enabled?: boolean }
) {
	return useInfiniteQuery<RecommendationResponse>({
		queryKey: ["recommendations", "for-you", "infinite"],
		queryFn: ({ pageParam = 1 }) =>
			recommendationApi.getPersonalizedRecommendations(pageParam as number),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.hasNext && lastPage.page && lastPage.page < 6) {
				return lastPage.page + 1;
			}
			return undefined;
		},
		staleTime: 3 * 60 * 1000,
		enabled: options?.enabled ?? true,
	});
}

/**
 * Hook gợi ý sản phẩm hot trend hôm nay (Trending Products)
 * Dựa trên tổng hợp lượt xem 24h, mua hàng 7 ngày và wishlist.
 */
export function useTrendingProductsQuery(
	page: number = 1,
	options?: { enabled?: boolean }
) {
	return useQuery<RecommendationResponse>({
		queryKey: recommendationQueryKeys.trending(page),
		queryFn: () => recommendationApi.getTrendingProducts(page),
		staleTime: 5 * 60 * 1000,
		enabled: options?.enabled ?? true,
	});
}

/**
 * Hook lấy thống kê lượt xem sản phẩm (tổng, 24h, 7 ngày).
 */
export function useProductViewStatsQuery(productId?: string | number) {
	return useQuery<ProductViewStats>({
		queryKey: recommendationQueryKeys.viewStats(productId),
		queryFn: () => recommendationApi.getProductViewStats(productId!),
		enabled: Boolean(productId),
		staleTime: 2 * 60 * 1000,
	});
}

/**
 * Mutation ghi nhận lượt xem sản phẩm & thời gian đọc trang (dwell time)
 * Có cơ chế throttle 30 phút chống spam tại backend.
 */
export function useTrackProductViewMutation() {
	return useMutation({
		mutationFn: (data: TrackProductViewRequest) =>
			recommendationApi.trackProductView(data),
		onError: (err) => {
			// Silently fail without interrupting user experience
			console.debug("Failed to track product view", err);
		},
	});
}

/**
 * Mutation đồng bộ dữ liệu catalog sang recommendation database on-demand.
 */
export function useSyncRecommendationsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => recommendationApi.syncCatalogData(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
		},
	});
}
