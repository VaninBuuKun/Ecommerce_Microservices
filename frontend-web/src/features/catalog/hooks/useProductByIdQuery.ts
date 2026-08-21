import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useProductByIdQuery(id: string | undefined) {
	return useQuery({
		queryKey: catalogQueryKeys.detail(id || ""),
		queryFn: () => productService.getProductById(id || ""),
		enabled: Boolean(id),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}
