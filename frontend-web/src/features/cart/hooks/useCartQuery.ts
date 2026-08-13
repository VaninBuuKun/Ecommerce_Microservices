import { useQuery } from "@tanstack/react-query";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";

export const useCartQuery = () => {
	return useQuery({
		queryKey: CART_QUERY_KEY,
		queryFn: cartService.getCart,
		staleTime: 1000 * 60 * 5, // 5 phút
	});
};
