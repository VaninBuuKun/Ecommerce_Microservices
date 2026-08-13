import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useDeleteProductMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (productId: string) =>
			productService.deleteProduct(productId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [...catalogQueryKeys.all, "my-products"],
			});
		},
	});
}
