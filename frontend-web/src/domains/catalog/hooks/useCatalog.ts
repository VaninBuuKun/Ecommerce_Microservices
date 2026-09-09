import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { productApi, type CreateProductRequest, type UpdateProductRequest, type UpdateProductSaleRequest, type BulkUpdateVariantsRequest, type GetProductsParams, type GetExploreProductsParams, type SearchProductsParams, type GetMyProductsParams, type UpdateSingleVariantRequest, type UpdateMultiVariantsRequest } from "../api/productApi";
import { categoryApi } from "../api/categoryApi";
import { reviewApi, type AddProductReviewRequest, type GetProductReviewsParams } from "../api/reviewApi";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/shipping";

export const catalogQueryKeys = {
	products: ["catalog", "products"] as const,
	exploreProducts: (params?: GetExploreProductsParams) => ["catalog", "explore", params] as const,
	searchProducts: (params?: SearchProductsParams) => ["catalog", "searchProducts", params] as const,
	productById: (id?: string) => ["catalog", "products", id] as const,
	myProducts: (params?: GetMyProductsParams) => ["catalog", "myProducts", params] as const,
	categories: ["catalog", "categories"] as const,
	reviews: (productId: string) => ["catalog", "reviews", productId] as const,
	reviewSummary: (productId: string) => ["catalog", "reviewSummary", productId] as const,
	bestSellers: (limit?: number) => ["catalog", "products", "bestSellers", limit] as const,
	newArrivals: (limit?: number) => ["catalog", "products", "newArrivals", limit] as const,
	onSale: (limit?: number) => ["catalog", "products", "onSale", limit] as const,
	searchSuggestions: (q: string) => ["catalog", "search", "suggestions", q] as const,
	trendingKeywords: ["catalog", "search", "trending"] as const,
	searchHistory: ["catalog", "search", "history"] as const,
};

export function useProductsQuery(params?: GetProductsParams) {
	return useQuery({
		queryKey: [...catalogQueryKeys.products, params],
		queryFn: () => productApi.getProducts(params),
	});
}

export function useExploreProductsQuery(params?: GetExploreProductsParams) {
	return useQuery({
		queryKey: catalogQueryKeys.exploreProducts(params),
		queryFn: () => productApi.getExploreProducts(params),
		placeholderData: (previousData) => previousData,
	});
}

export function useSearchProductsQuery(params?: SearchProductsParams) {
	return useQuery({
		queryKey: catalogQueryKeys.searchProducts(params),
		queryFn: () => productApi.searchProducts(params),
		placeholderData: (previousData) => previousData,
	});
}

/**
 * Hook truy vấn danh sách Sản Phẩm Bán Chạy (Best Sellers)
 * Tiêu chí: Lọc các sản phẩm có số lượng đã bán (Sold) cao nhất toàn sàn.
 */
export function useBestSellersQuery(limit: number = 10) {
	return useQuery({
		queryKey: catalogQueryKeys.bestSellers(limit),
		queryFn: () => productApi.getProducts({ sortBy: "sold", limit }),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Hook truy vấn danh sách Hàng Mới Về (New Arrivals)
 * Tiêu chí: Lấy các sản phẩm mới nhất dựa theo thời gian tạo (CreatedAt) gần đây.
 */
export function useNewArrivalsQuery(limit: number = 10) {
	return useQuery({
		queryKey: catalogQueryKeys.newArrivals(limit),
		queryFn: () => productApi.getProducts({ sortBy: "newest", limit }),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Hook truy vấn danh sách Sản Phẩm Đang Giảm Giá (Flash Sale / Hot Deals)
 * Tiêu chí: Lọc sản phẩm có discountPrice < price, sắp xếp theo mức giảm giá tốt nhất.
 */
export function useOnSaleQuery(limit: number = 10) {
	return useQuery({
		queryKey: catalogQueryKeys.onSale(limit),
		queryFn: () => productApi.getProducts({ sortBy: "discount", hasDiscount: true, limit }),
		staleTime: 5 * 60 * 1000,
	});
}

export function useInfiniteProductsQuery(params?: GetProductsParams) {
	return useInfiniteQuery({
		queryKey: [...catalogQueryKeys.products, "infinite", params],
		queryFn: ({ pageParam }) =>
			productApi.getProducts({
				...params,
				cursor: pageParam ? (pageParam as string) : undefined,
			}),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
	});
}

export function useMyProductsQuery(params?: GetMyProductsParams) {
	return useQuery({
		queryKey: catalogQueryKeys.myProducts(params),
		queryFn: () => (params?.shopId ? productApi.getMyProducts(params) : null),
		enabled: Boolean(params?.shopId && Number(params.shopId) > 0),
	});
}

export function useProductByIdQuery(id?: string) {
	return useQuery({
		queryKey: catalogQueryKeys.productById(id),
		queryFn: () => (id ? productApi.getProductById(id) : null),
		enabled: !!id,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
}

export function useCategoriesQuery() {
	return useQuery({
		queryKey: catalogQueryKeys.categories,
		queryFn: categoryApi.getCategories,
	});
}

export function useCreateProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateProductRequest) => productApi.createProduct(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useUpdateProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateProductRequest }) =>
			productApi.updateProduct(id, payload),
		onSuccess: (data, variables) => {
			if (data?.value || data) {
				queryClient.setQueryData(catalogQueryKeys.productById(variables.id), data?.value || data);
			}
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export function useUpdateSingleVariantMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateSingleVariantRequest }) =>
			productApi.updateSingleVariant(id, payload),
		onSuccess: (data, variables) => {
			if (data?.value || data) {
				queryClient.setQueryData(catalogQueryKeys.productById(variables.id), data?.value || data);
			}
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export const useUpdateProductSaleMutation = useUpdateSingleVariantMutation;

export function useUpdateMultiVariantsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateMultiVariantsRequest }) =>
			productApi.updateMultiVariants(id, payload),
		onSuccess: (data, variables) => {
			if (data?.value || data) {
				queryClient.setQueryData(catalogQueryKeys.productById(variables.id), data?.value || data);
			}
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export const useBulkUpdateVariantsMutation = useUpdateMultiVariantsMutation;

export function useDeleteProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => productApi.deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useDeleteProductVariantMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
			productApi.deleteProductVariant(productId, variantId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.productId) });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export function useDeleteProductOptionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, optionId }: { productId: string; optionId: string }) =>
			productApi.deleteProductOption(productId, optionId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.productId) });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export function useDeleteProductOptionValueMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ productId, optionId, valueId }: { productId: string; optionId: string; valueId: string }) =>
			productApi.deleteProductOptionValue(productId, optionId, valueId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.productId) });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
		},
	});
}

export function useToggleProductStatusMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => productApi.toggleProductStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog", "myProducts"] });
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useProductReviewsQuery(productId: string, params?: GetProductReviewsParams) {
	return useQuery({
		queryKey: [...catalogQueryKeys.reviews(productId), params],
		queryFn: () => reviewApi.getProductReviews(Number(productId) || (productId as any), params),
		enabled: !!productId,
	});
}

export function useProductReviewsSummaryQuery(productId: string) {
	return useQuery({
		queryKey: catalogQueryKeys.reviewSummary(productId),
		queryFn: () => reviewApi.getProductReviewsSummary(Number(productId) || (productId as any)),
		enabled: !!productId,
	});
}

export function useAddProductReviewMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: AddProductReviewRequest) => reviewApi.addProductReview(data),
		onSuccess: (_, variables) => {
			if (variables?.productId) {
				queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviews(String(variables.productId)) });
				queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviewSummary(String(variables.productId)) });
			}
		},
	});
}

export function useSearchSuggestionsQuery(query: string) {
	return useQuery({
		queryKey: catalogQueryKeys.searchSuggestions(query),
		queryFn: () => productApi.getSearchSuggestions(query),
		enabled: Boolean(query && query.trim().length > 0),
		staleTime: 30 * 1000,
	});
}

export function useTrendingKeywordsQuery(limit: number = 5) {
	return useQuery({
		queryKey: catalogQueryKeys.trendingKeywords,
		queryFn: () => productApi.getTrendingKeywords(limit),
		staleTime: 5 * 60 * 1000,
	});
}

export function useSearchHistoryQuery(enabled: boolean = true) {
	return useQuery({
		queryKey: catalogQueryKeys.searchHistory,
		queryFn: () => productApi.getSearchHistory(),
		enabled,
		staleTime: 60 * 1000,
	});
}

export function useSaveSearchKeywordMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (keyword: string) => productApi.saveSearchKeyword(keyword),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.searchHistory });
		},
	});
}

export function useSyncSearchHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (keywords: string[]) => productApi.syncSearchHistory(keywords),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.searchHistory });
		},
	});
}

export function useClearSearchHistoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => productApi.clearSearchHistory(),
		onSuccess: () => {
			queryClient.setQueryData(catalogQueryKeys.searchHistory, []);
		},
	});
}

export function useRemoveSearchHistoryItemMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (keyword: string) => productApi.removeSearchHistoryItem(keyword),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.searchHistory });
		},
	});
}

// Re-export shipping location hooks for backward compatibility
export { useProvincesQuery, useDistrictsQuery, useWardsQuery };
