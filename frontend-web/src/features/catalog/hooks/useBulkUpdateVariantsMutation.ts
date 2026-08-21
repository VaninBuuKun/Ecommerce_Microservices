import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";
import { bulkVariantsCommandSchema, type BulkVariantsPayload } from "../types";

// 2. Custom Mutation Hook
export function useBulkUpdateVariantsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			payload,
		}: {
			id: string;
			payload: BulkVariantsPayload;
		}) => {
			// Validate bằng Zod trước khi gửi lên API
			const validatedData = bulkVariantsCommandSchema.parse(payload);
			return productService.bulkUpdateVariants(id, validatedData);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: catalogQueryKeys.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: [...catalogQueryKeys.all, "products"],
				exact: false,
			});
		},
	});
}
