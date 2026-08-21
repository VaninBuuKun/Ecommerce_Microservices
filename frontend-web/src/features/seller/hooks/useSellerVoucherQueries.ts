import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerVoucherService, type CreateVoucherRequest, type UpdateVoucherRequest } from "../services";
export const VOUCHERS_QUERY_KEY = ["sellerVouchers"];

export function useSellerVouchersQuery(params: {
	page?: number;
	pageSize?: number;
	code?: string;
	discountType?: number;
	usageLimit?: boolean;
	startDate?: string;
	endDate?: string;
	isActive?: boolean;
	shopId?: number;
}) {
	return useQuery({
		queryKey: [...VOUCHERS_QUERY_KEY, params],
		queryFn: () => sellerVoucherService.getVouchers(params),
		enabled: Boolean(params.shopId),
	});
}

export function useCreateVoucherMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVoucherRequest) => sellerVoucherService.createVoucher(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY });
		},
	});
}

export function useUpdateVoucherMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateVoucherRequest }) =>
			sellerVoucherService.updateVoucher(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY });
		},
	});
}

export function useDeleteVoucherMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => sellerVoucherService.deleteVoucher(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY });
		},
	});
}
