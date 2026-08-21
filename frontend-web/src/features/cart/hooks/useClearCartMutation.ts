import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";

export const useClearCartMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cartService.clearCart,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
			toast.success("Đã dọn sạch giỏ hàng");
		},
		onError: (error: any) => {
			toast.error(error?.response?.data || "Xóa giỏ hàng thất bại!");
		},
	});
};
