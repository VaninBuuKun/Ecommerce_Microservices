import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "../api/catalogApi";

export const catalogQueryKeys = {
  products: ["catalog", "products"] as const,
  productById: (id?: string) => ["catalog", "products", id] as const,
  myProducts: (params?: any) => ["catalog", "myProducts", params] as const,
  categories: ["catalog", "categories"] as const,
  reviews: (productId: string) => ["catalog", "reviews", productId] as const,
  reviewSummary: (productId: string) => ["catalog", "reviewSummary", productId] as const,
};

export function useProductsQuery(params?: any) {
  return useQuery({
    queryKey: [...catalogQueryKeys.products, params],
    queryFn: () => catalogApi.getProducts(params),
  });
}

export function useMyProductsQuery(params?: any) {
  return useQuery({
    queryKey: catalogQueryKeys.myProducts(params),
    queryFn: () => catalogApi.getMyProducts(params),
  });
}

export function useProductByIdQuery(id?: string) {
  return useQuery({
    queryKey: catalogQueryKeys.productById(id),
    queryFn: () => (id ? catalogApi.getProductById(id) : null),
    enabled: !!id,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: catalogQueryKeys.categories,
    queryFn: catalogApi.getCategories,
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.products });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useProductReviewsQuery(productId: string) {
  return useQuery({
    queryKey: catalogQueryKeys.reviews(productId),
    queryFn: () => catalogApi.getProductReviews?.(productId) ?? [],
    enabled: !!productId,
  });
}

export function useProductReviewsSummaryQuery(productId: string) {
  return useQuery({
    queryKey: catalogQueryKeys.reviewSummary(productId),
    queryFn: () => catalogApi.getProductReviewsSummary?.(productId) ?? null,
    enabled: !!productId,
  });
}

export function useAddProductReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => catalogApi.addProductReview?.(data),
    onSuccess: (_, variables) => {
      if (variables?.productId) {
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviews(variables.productId) });
        queryClient.invalidateQueries({ queryKey: catalogQueryKeys.reviewSummary(variables.productId) });
      }
    },
  });
}

export function useProvincesQuery() {
  return useQuery({
    queryKey: ["locations", "provinces"],
    queryFn: () => catalogApi.getProvinces(),
  });
}

export function useDistrictsQuery(provinceId?: number) {
  return useQuery({
    queryKey: ["locations", "districts", provinceId],
    queryFn: () => catalogApi.getDistricts(provinceId),
    enabled: Boolean(provinceId),
  });
}

export function useWardsQuery(districtId?: number) {
  return useQuery({
    queryKey: ["locations", "wards", districtId],
    queryFn: () => catalogApi.getWards(districtId),
    enabled: Boolean(districtId),
  });
}

