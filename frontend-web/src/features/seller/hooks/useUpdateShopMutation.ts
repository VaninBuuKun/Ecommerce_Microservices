import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shopService } from "../services/shopService";
import { sellerQueryKeys } from "../api/queryKeys";

export function useUpdateShopMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: {
				name: string;
				description: string;
				logoUrl?: string;
				recipientName: string;
				phone: string;
				addressLine: string;
				provinceId: number;
				districtId: number;
				wardId: number;
			};
		}) => shopService.updateShop(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sellerQueryKeys.profile });
		},
	});
}
