import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useCreateProductMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: {
			shopId: number;
			name: string;
			description: string;
			thumbnailUrl?: string;
		}) => productService.createProduct(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...catalogQueryKeys.all, "my-products"] });
		},
	});
}
