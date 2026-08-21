import { useQuery } from "@tanstack/react-query";
import { shopService } from "../services/shopService";

export function useShopDetailQuery(shopId?: string) {
	return useQuery({
		queryKey: ["shopDetail", shopId],
		queryFn: () => shopService.getShopDetail(shopId!),
		enabled: Boolean(shopId),
		staleTime: 1000 * 60 * 5,
	});
}
