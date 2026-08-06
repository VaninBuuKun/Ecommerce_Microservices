import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/react-query";
import { kycService } from "../services";
import { sellerQueryKeys } from "../api/queryKeys";

export function useRegisterKycMutation() {
	return useMutation({
		mutationFn: kycService.registerKyc,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: sellerQueryKeys.profile,
			});
		},
	});
}
