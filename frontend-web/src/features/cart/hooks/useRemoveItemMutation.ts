import { useQueryClient, useMutation } from "@tanstack/react-query";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";
import { toast } from "react-toastify";

export const useRemoveItemMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cartService.removeItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
			toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data || "Xóa sản phẩm thất bại!");
		},
	});
};
