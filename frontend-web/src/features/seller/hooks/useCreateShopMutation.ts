import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/react-query";
import { useSellerStore } from "../stores";
import { shopService } from "../services";
import { sellerQueryKeys } from "../api/queryKeys";

export function useCreateShopMutation() {
	return useMutation({
		mutationFn: shopService.createNewShop,
		onSuccess: async (shop) => {
			useSellerStore.getState().setActiveShop(shop);
			await queryClient.invalidateQueries({
				queryKey: sellerQueryKeys.profile,
			});
		},
	});
}
