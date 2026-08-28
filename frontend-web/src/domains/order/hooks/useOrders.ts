import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../api/orderApi";
import { api } from "@/core";

export function useAddressesQuery() {
	return useQuery({
		queryKey: ["order", "addresses"],
		queryFn: () => orderApi.getAddresses(),
	});
}

export function useCreateAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => orderApi.createAddress(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order", "addresses"] });
		},
	});
}

export function useCalculateTotalMutation() {
	return useMutation({
		mutationFn: (data: any) => orderApi.calculateTotal(data),
	});
}

export function useCheckoutMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => orderApi.checkout(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

export function useSetDefaultAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => orderApi.setDefaultAddress(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order", "addresses"] });
		},
	});
}

export function useDeleteAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => orderApi.deleteAddress(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order", "addresses"] });
		},
	});
}

export function usePaymentMethodsQuery() {
	return useQuery({
		queryKey: ["payments", "methods"],
		queryFn: () => orderApi.getPaymentMethods(),
	});
}

export function useAvailableVouchersQuery(shopId?: number | null, enabled = true) {
	return useQuery({
		queryKey: ["vouchers", "available", shopId],
		queryFn: () => orderApi.getAvailableVouchers(shopId),
		enabled,
	});
}

export function useShopSubOrdersQuery(
	shopId?: number,
	pageNumber = 1,
	pageSize = 5,
	status?: string
) {
	return useQuery({
		queryKey: ["shopSubOrders", shopId, pageNumber, pageSize, status],
		queryFn: () => orderApi.getShopSubOrders(shopId!, pageNumber, pageSize, status),
		enabled: Boolean(shopId),
	});
}

export function useConfirmSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (subOrderId: number) => orderApi.confirmSubOrder(subOrderId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopSubOrders"] });
		},
	});
}

export function useRejectSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason }: { subOrderId: number; reason: string }) =>
			orderApi.rejectSubOrder(subOrderId, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopSubOrders"] });
		},
	});
}

export function usePackageReadySubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			subOrderId,
			dimensions,
		}: {
			subOrderId: number;
			dimensions: { weight: number; length: number; width: number; height: number };
		}) => orderApi.packageReadySubOrder(subOrderId, dimensions),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopSubOrders"] });
		},
	});
}

export function useSubOrderDetailQuery(subOrderId?: number, isSeller = true) {
	return useQuery({
		queryKey: ["subOrderDetail", subOrderId, isSeller],
		queryFn: () => orderApi.getSubOrderDetail(subOrderId!, isSeller),
		enabled: Boolean(subOrderId),
	});
}

export function useCustomerOrdersQuery(customerId?: number) {
	return useQuery({
		queryKey: ["customerOrders", customerId],
		queryFn: () => orderApi.getCustomerOrders(customerId!),
		enabled: Boolean(customerId),
	});
}

export function useShopRefundsQuery(shopId?: number) {
	return useQuery({
		queryKey: ["shopRefunds", shopId],
		queryFn: () => orderApi.getShopRefunds(shopId!),
		enabled: Boolean(shopId),
	});
}

export function useApproveRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, sellerNote }: { id: number; sellerNote?: string }) =>
			orderApi.approveRefund(id, sellerNote),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopRefunds"] });
		},
	});
}

export function useRejectRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, sellerNote }: { id: number; sellerNote: string }) =>
			orderApi.rejectRefund(id, sellerNote),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopRefunds"] });
		},
	});
}

export function useCancelCustomerSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason }: { subOrderId: number; reason: string }) =>
			orderApi.cancelCustomerSubOrder(subOrderId, reason),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", variables.subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCompleteSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (subOrderId: number) => orderApi.completeSubOrder(subOrderId),
		onSuccess: (_, subOrderId) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCreateRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason }: { subOrderId: number; reason: string }) =>
			orderApi.createRefund(subOrderId, reason),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", variables.subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useWalletQuery(enabled = true) {
	return useQuery({
		queryKey: ["userWallet"],
		queryFn: () => orderApi.getWallet(),
		enabled,
		retry: false,
	});
}

export function useActivateWalletMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => orderApi.activateWallet(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userWallet"] });
		},
	});
}

export function useWalletTransactionsQuery(enabled = true) {
	return useQuery({
		queryKey: ["userWalletTransactions"],
		queryFn: () => orderApi.getWalletTransactions(),
		enabled,
	});
}

export function useBankAccountsQuery(enabled = true) {
	return useQuery({
		queryKey: ["userBankAccounts"],
		queryFn: () => orderApi.getBankAccounts(),
		enabled,
	});
}

export function useAddBankAccountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => orderApi.addBankAccount(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userBankAccounts"] });
		},
	});
}

export function useUpdateBankAccountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: any }) =>
			orderApi.updateBankAccount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userBankAccounts"] });
		},
	});
}

export function useMyRefundsQuery() {
	return useQuery({
		queryKey: ["myRefundRequests"],
		queryFn: () => orderApi.getMyRefunds(),
	});
}

export function useCancelRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => orderApi.cancelRefundRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["myRefundRequests"] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCreateWithdrawMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { amount: number; bankAccountId: number }) =>
			api.post("/withdrawals", data).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userWallet"] });
			queryClient.invalidateQueries({ queryKey: ["userWalletTransactions"] });
			queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
		},
	});
}

export function useMyWithdrawalsQuery() {
	return useQuery({
		queryKey: ["wallet", "withdrawals"],
		queryFn: async () => {
			const res = await api.get("/withdrawals");
			return res.data?.value || res.data || [];
		},
	});
}

export function useAdminSubOrdersQuery(params?: {
	pageNumber?: number;
	pageSize?: number;
	status?: string;
	searchKeyword?: string;
}) {
	const pageNumber = params?.pageNumber || 1;
	const pageSize = params?.pageSize || 10;
	const status = params?.status === "ALL" ? undefined : params?.status;
	const searchKeyword = params?.searchKeyword ? params.searchKeyword.trim() : undefined;

	return useQuery({
		queryKey: ["order", "admin", "suborders", pageNumber, pageSize, status, searchKeyword],
		queryFn: async () => {
			try {
				const res = await api.get("/orders/admin/suborders", {
					params: {
						pageNumber,
						pageSize,
						status,
						searchKeyword,
					},
				});
				return res.data?.value || res.data;
			} catch (err) {
				const fallbackRes = await api.get("/orders/customer/1");
				const list = fallbackRes.data?.value || fallbackRes.data || [];
				return {
					items: list,
					totalCount: list.length,
					pageNumber: 1,
					pageSize: 10,
					totalPages: 1,
				};
			}
		},
	});
}


