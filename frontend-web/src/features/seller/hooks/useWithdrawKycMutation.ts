import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/react-query";
import { kycService } from "../services";
import { sellerQueryKeys } from "../api/queryKeys";

export function useWithdrawKycMutation() {
	return useMutation({
		mutationFn: () => kycService.withdrawDraft(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: sellerQueryKeys.profile,
			});
		},
	});
}
