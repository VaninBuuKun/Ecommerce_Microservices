import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";

export const useUpdateQuantityMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cartService.updateQuantity,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
		},
		onError: (error: any) => {
			toast.error(error?.response?.data || "Cập nhật số lượng thất bại!");
		},
	});
};
