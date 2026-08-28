import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, type CreateProductRequest, type UpdateProductRequest, type UpdateProductSaleRequest, type BulkUpdateVariantsRequest, type GetProductsParams, type GetMyProductsParams } from "../api/productApi";
import { categoryApi } from "../api/categoryApi";
import { reviewApi, type AddProductReviewRequest, type GetProductReviewsParams } from "../api/reviewApi";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/shipping";

export const catalogQueryKeys = {
	products: ["catalog", "products"] as const,
	productById: (id?: number) => ["catalog", "products", id] as const,
	myProducts: (params?: GetMyProductsParams) => ["catalog", "myProducts", params] as const,
	categories: ["catalog", "categories"] as const,
	reviews: (productId: number) => ["catalog", "reviews", productId] as const,
	reviewSummary: (productId: number) => ["catalog", "reviewSummary", productId] as const,
};

export function useProductsQuery(params?: GetProductsParams) {
	return useQuery({
		queryKey: [...catalogQueryKeys.products, params],
		queryFn: () => productApi.getProducts(params),
	});
}

export function useMyProductsQuery(params?: GetMyProductsParams) {
	return useQuery({
		queryKey: catalogQueryKeys.myProducts(params),
		queryFn: () => (params?.shopId ? productApi.getMyProducts(params) : null),
		enabled: Boolean(params?.shopId && Number(params.shopId) > 0),
	});
}

export function useProductByIdQuery(id?: number) {
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
		mutationFn: ({ id, payload }: { id: number; payload: UpdateProductRequest }) =>
			productApi.updateProduct(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
		},
	});
}

export function useUpdateProductSaleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: UpdateProductSaleRequest }) =>
			productApi.updateProductSale(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
		},
	});
}

export function useBulkUpdateVariantsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: BulkUpdateVariantsRequest | any }) =>
			productApi.bulkUpdateVariants(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.productById(variables.id) });
		},
	});
}

export function useDeleteProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => productApi.deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useToggleProductStatusMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => productApi.toggleProductStatus(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
			queryClient.invalidateQueries({ queryKey: ["catalog"] });
		},
	});
}

export function useProductReviewsQuery(productId: number, params?: GetProductReviewsParams) {
	return useQuery({
		queryKey: [...catalogQueryKeys.reviews(productId), params],
		queryFn: () => reviewApi.getProductReviews(productId, params),
		enabled: !!productId,
	});
}

export function useProductReviewsSummaryQuery(productId: number) {
	return useQuery({
		queryKey: catalogQueryKeys.reviewSummary(productId),
		queryFn: () => reviewApi.getProductReviewsSummary(productId),
		enabled: !!productId,
	});
}

export function useAddProductReviewMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: AddProductReviewRequest) => reviewApi.addProductReview(data),
		onSuccess: (_, variables) => {
			if (variables?.productId) {
				queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviews(variables.productId) });
				queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviewSummary(variables.productId) });
			}
		},
	});
}

// Re-export shipping location hooks for backward compatibility
export { useProvincesQuery, useDistrictsQuery, useWardsQuery };
