import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useProductsQuery(filters: {
	searchTerm?: string;
	categoryId?: string;
	minRating?: number;
	cursor?: string;
	limit?: number;
	sortBy?: string;
}) {
	return useQuery({
		queryKey: catalogQueryKeys.products(filters),
		queryFn: () => productService.getProducts(filters),
		staleTime: 1000 * 30, // 30 seconds
	});
}
