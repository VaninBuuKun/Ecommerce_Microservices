import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { productApi, type CreateProductRequest, type UpdateProductRequest, type UpdateProductSaleRequest, type BulkUpdateVariantsRequest, type GetProductsParams, type GetMyProductsParams, type UpdateSingleVariantRequest, type UpdateMultiVariantsRequest } from "../api/productApi";
import { categoryApi } from "../api/categoryApi";
import { reviewApi, type AddProductReviewRequest, type GetProductReviewsParams } from "../api/reviewApi";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/shipping";

export const catalogQueryKeys = {
	products: ["catalog", "products"] as const,
	productById: (id?: string) => ["catalog", "products", id] as const,
	myProducts: (params?: GetMyProductsParams) => ["catalog", "myProducts", params] as const,
	categories: ["catalog", "categories"] as const,
	reviews: (productId: string) => ["catalog", "reviews", productId] as const,
	reviewSummary: (productId: string) => ["catalog", "reviewSummary", productId] as const,
};

export function useProductsQuery(params?: GetProductsParams) {
	return useQuery({
		queryKey: [...catalogQueryKeys.products, params],
		queryFn: () => productApi.getProducts(params),
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
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useUpdateProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateProductRequest }) =>
			productApi.updateProduct(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
		},
	});
}

export function useUpdateSingleVariantMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateSingleVariantRequest }) =>
			productApi.updateSingleVariant(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
		},
	});
}

export const useUpdateProductSaleMutation = useUpdateSingleVariantMutation;

export function useUpdateMultiVariantsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateMultiVariantsRequest }) =>
			productApi.updateMultiVariants(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
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
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useToggleProductStatusMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => productApi.toggleProductStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
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

// Re-export shipping location hooks for backward compatibility
export { useProvincesQuery, useDistrictsQuery, useWardsQuery };
