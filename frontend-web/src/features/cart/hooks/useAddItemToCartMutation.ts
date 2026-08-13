import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";

export const useAddItemToCartMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cartService.addItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
			toast.success("Đã thêm sản phẩm vào giỏ hàng!");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data || "Thêm sản phẩm thất bại!");
		},
	});
};
