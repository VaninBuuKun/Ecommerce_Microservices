import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useUpdateProductSaleMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: any }) =>
			productService.updateProductSale(id, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: catalogQueryKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: [...catalogQueryKeys.all, "products"],
				exact: false, // Quan trọng: Giúp quét sạch mọi cache product có kèm filters khác nhau
			});
		},
	});
}
