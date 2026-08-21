import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { followShopApi } from "../api/followShopApi";
import { toast } from "react-toastify";

export const FOLLOWED_SHOPS_QUERY_KEY = ["followedShops"];

export function useFollowShop(shopId?: number) {
	const queryClient = useQueryClient();

	const followedShopsQuery = useQuery({
		queryKey: FOLLOWED_SHOPS_QUERY_KEY,
		queryFn: followShopApi.getFollowedShops,
		staleTime: 1000 * 60 * 5,
	});

	const followStatusQuery = useQuery({
		queryKey: ["followStatus", shopId],
		queryFn: () => (shopId ? followShopApi.checkFollowStatus(shopId) : Promise.resolve({ isFollowing: false })),
		enabled: !!shopId,
	});

	const toggleMutation = useMutation({
		mutationFn: (targetShopId: number) => followShopApi.toggleFollowShop(targetShopId),
		onSuccess: (data, targetShopId) => {
			queryClient.invalidateQueries({ queryKey: FOLLOWED_SHOPS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["followStatus", targetShopId] });
			if (data.isFollowing) {
				toast.success("Đã theo dõi cửa hàng thành công ✨");
			} else {
				toast.info("Đã hủy theo dõi cửa hàng");
			}
		},
		onError: (err: any) => {
			const msg = err.response?.data?.message || err.response?.data || "Vui lòng đăng nhập để thực hiện tính năng này.";
			toast.error(msg);
		},
	});

	return {
		followedShops: followedShopsQuery.data || [],
		isLoadingFollowed: followedShopsQuery.isLoading,
		isFollowing: followStatusQuery.data?.isFollowing || false,
		isLoadingStatus: followStatusQuery.isLoading,
		toggleFollowShop: toggleMutation.mutate,
		isToggling: toggleMutation.isPending,
	};
}
