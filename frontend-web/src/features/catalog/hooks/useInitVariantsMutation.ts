import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useInitVariantsMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: any }) =>
			productService.initVariants(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.detail(variables.id) });
			queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
		},
	});
}
