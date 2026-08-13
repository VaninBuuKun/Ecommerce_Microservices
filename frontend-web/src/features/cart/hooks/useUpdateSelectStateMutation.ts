import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CART_QUERY_KEY } from "../queryKeys";
import { cartService } from "../services/cartService";

export const useUpdateSelectStateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cartService.updateSelectState,
		// Dùng onMutate để Optimistic Update nếu muốn giao diện mượt mà tức thì,
		// hoặc dùng onSuccess để refetch lại giỏ hàng tính tiền.
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
		},
		onError: (error: any) => {
			toast.error(
				error?.response?.data || "Không thể cập nhật trạng thái chọn!",
			);
		},
	});
};
