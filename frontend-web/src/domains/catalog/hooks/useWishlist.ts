import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/wishlistApi";
import { toast } from "react-toastify";

export const WISHLIST_QUERY_KEY = ["wishlist"];

export function useWishlist() {
	const queryClient = useQueryClient();

	const wishlistQuery = useQuery({
		queryKey: WISHLIST_QUERY_KEY,
		queryFn: wishlistApi.getMyWishlist,
		staleTime: 1000 * 60 * 5, // 5 minutes cache
	});

	const toggleMutation = useMutation({
		mutationFn: (productId: string) => wishlistApi.toggleWishlist(productId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
			if (data.isLiked) {
				toast.success("Đã thêm sản phẩm vào danh sách yêu thích ❤️");
			} else {
				toast.info("Đã xóa sản phẩm khỏi danh sách yêu thích");
			}
		},
		onError: (err: any) => {
			const msg = err.response?.data?.message || err.response?.data || "Vui lòng đăng nhập để thực hiện tính năng này.";
			toast.error(msg);
		},
	});

	const isWishlisted = (productId: string): boolean => {
		if (!wishlistQuery.data || !Array.isArray(wishlistQuery.data)) return false;
		return wishlistQuery.data.some((item: any) => item.id === productId);
	};

	return {
		wishlistItems: wishlistQuery.data || [],
		isLoading: wishlistQuery.isLoading,
		toggleWishlist: toggleMutation.mutate,
		isToggling: toggleMutation.isPending,
		isWishlisted,
	};
}
