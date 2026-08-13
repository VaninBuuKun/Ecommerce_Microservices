import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/productService";
import { catalogQueryKeys } from "../api/queryKeys";

export function useMyProductsQuery(filters: {
	page: number;
	pageSize: number;
	ShopId: number;
	searchTerm?: string;
}) {
	return useQuery({
		queryKey: [
			...catalogQueryKeys.all,
			"my-products",
			filters.ShopId,
			filters.page,
			filters.pageSize,
			filters.searchTerm,
		],
		queryFn: () => productService.getMyProducts(filters),
		enabled: Boolean(filters.ShopId),
		staleTime: 1000 * 10, // 10 seconds
	});
}
