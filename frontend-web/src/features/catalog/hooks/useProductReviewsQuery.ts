import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../../../shared/lib/axios";

const API_BASE_URL = "http://localhost:5001/api"; // Catalog Service API port

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdDate: string;
  media: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  oneStarCount: number;
  twoStarCount: number;
  threeStarCount: number;
  fourStarCount: number;
  fiveStarCount: number;
}

export function useProductReviewsQuery(productId: string | undefined, page: number, pageSize: number = 5, rating?: number | "all") {
  return useQuery<PagedResult<ProductReview>>({
    queryKey: ["product-reviews", productId, page, pageSize, rating],
    queryFn: async () => {
      const params: any = { page, pageSize };
      if (rating && rating !== "all") {
        params.rating = rating;
      }
      const response = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`, {
        params
      });
      return response.data;
    },
    enabled: !!productId
  });
}

export function useProductReviewsSummaryQuery(productId: string | undefined) {
  return useQuery<ProductReviewSummary>({
    queryKey: ["product-reviews-summary", productId],
    queryFn: async () => {
      const response = await api.get(`products/${productId}/reviews/summary`);
      return response.data;
    },
    enabled: !!productId
  });
}

export interface AddReviewPayload {
  rating: number;
  comment: string;
  imageUrls: string[]; // Chứa link media
}

export function useAddProductReviewMutation(productId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddReviewPayload) => {
      const response = await api.post(`products/${productId}/reviews`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate các query reviews liên quan để cập nhật dữ liệu tự động
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews-summary", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
    }
  });
}
