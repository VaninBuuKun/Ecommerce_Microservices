import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useCategoriesQuery() {
	return useQuery({
		queryKey: catalogQueryKeys.categories(),
		queryFn: () => productService.getCategories(),
		staleTime: 1000 * 60 * 60, // 1 hour
	});
}
