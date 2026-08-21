import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/orderService";
import type {
	CreateUserAddressRequest,
	CalculateOrderTotalRequest,
	CreateOrderCommand,
} from "../types";
import { queryClient } from "../../../shared/lib/react-query";
import { CART_QUERY_KEY } from "../../cart/queryKeys";
import api from "../../../shared/lib/axios";

export const ADDRESSES_QUERY_KEY = ["addresses"];

export function useAddressesQuery() {
	return useQuery({
		queryKey: ADDRESSES_QUERY_KEY,
		queryFn: () => orderService.getAddresses(),
	});
}

export function useCreateAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateUserAddressRequest) =>
			orderService.createAddress(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
		},
	});
}

export function useCalculateTotalMutation() {
	return useMutation({
		mutationFn: (data: CalculateOrderTotalRequest) =>
			orderService.calculateTotal(data),
	});
}

export function useCheckoutMutation() {
	return useMutation({
		mutationFn: (data: CreateOrderCommand) => orderService.checkout(data),

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
		},
	});
}

export function useSetDefaultAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => orderService.setDefaultAddress(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
		},
	});
}

export function useDeleteAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => orderService.deleteAddress(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
		},
	});
}

export function usePaymentMethodsQuery() {
	return useQuery({
		queryKey: ["paymentMethods"],
		queryFn: () => orderService.getPaymentMethods(),
	});
}

export function useAvailableVouchersQuery(shopId?: number | null, enabled: boolean = true) {
	return useQuery({
		queryKey: ["availableVouchers", shopId],
		queryFn: () => orderService.getAvailableVouchers(shopId),
		enabled: enabled, // Chỉ kích hoạt gọi API khi điều kiện enabled là true
		staleTime: 0,     // Dữ liệu coi như hết hạn ngay lập tức
		gcTime: 0,        // Không giữ lại cache khi unmount/đóng modal (Bản v5 dùng gcTime, v4 dùng cacheTime: 0)
		refetchOnMount: "always", // Luôn refetch mỗi khi component mount/kích hoạt
	});
}


export function useShopSubOrdersQuery(
	shopId?: string,
	pageNumber = 1,
	pageSize = 5,
	status?: string
) {
	return useQuery({
		queryKey: ["shopSubOrders", shopId, pageNumber, pageSize, status],
		queryFn: () => orderService.getShopSubOrders(shopId!, pageNumber, pageSize, status),
		enabled: Boolean(shopId),
	});
}

export function useConfirmSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (subOrderId: string) => orderService.confirmSubOrder(subOrderId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopSubOrders"] });
		},
	});
}

export function useRejectSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason }: { subOrderId: string; reason: string }) =>
			orderService.rejectSubOrder(subOrderId, reason),
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
			subOrderId: string;
			dimensions: { weight: number; length: number; width: number; height: number };
		}) => orderService.packageReadySubOrder(subOrderId, dimensions),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopSubOrders"] });
		},
	});
}

export function useSubOrderDetailQuery(subOrderId?: string, isSeller = true) {
	return useQuery({
		queryKey: ["subOrderDetail", subOrderId, isSeller],
		queryFn: () => orderService.getSubOrderDetail(subOrderId!, isSeller),
		enabled: Boolean(subOrderId),
	});
}

export function useCustomerOrdersQuery(customerId?: string) {
	return useQuery({
		queryKey: ["customerOrders", customerId],
		queryFn: () => orderService.getCustomerOrders(customerId!),
		enabled: Boolean(customerId),
	});
}

export function useShopRefundsQuery(shopId?: string) {
	return useQuery({
		queryKey: ["shopRefunds", shopId],
		queryFn: () => orderService.getShopRefunds(shopId!),
		enabled: Boolean(shopId),
	});
}

export function useApproveRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, sellerNote }: { id: string; sellerNote?: string }) =>
			orderService.approveRefund(id, sellerNote),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["shopRefunds"] });
		},
	});
}

export function useRejectRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, sellerNote }: { id: string; sellerNote: string }) =>
			orderService.rejectRefund(id, sellerNote),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["shopRefunds"] });
		},
	});
}

export function useCancelCustomerSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason }: { subOrderId: string; reason: string }) =>
			orderService.cancelCustomerSubOrder(subOrderId, reason),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", variables.subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCompleteSubOrderMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (subOrderId: string) => orderService.completeSubOrder(subOrderId),
		onSuccess: (_, subOrderId) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCreateRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subOrderId, reason, medias }: { subOrderId: string; reason: string; medias?: string[] }) =>
			orderService.createRefund(subOrderId, reason, medias),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["subOrderDetail", variables.subOrderId, false] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useWalletQuery(enabled = true) {
	return useQuery({
		queryKey: ["userWallet"],
		queryFn: () => orderService.getWallet(),
		enabled,
		retry: false, // Không retry nếu báo 404 (chưa có ví)
	});
}

export function useActivateWalletMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }) =>
			orderService.activateWallet(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userWallet"] });
		},
	});
}

export function useWalletTransactionsQuery(enabled = true) {
	return useQuery({
		queryKey: ["userWalletTransactions"],
		queryFn: () => orderService.getWalletTransactions(),
		enabled,
	});
}

export function useBankAccountsQuery(enabled = true) {
	return useQuery({
		queryKey: ["userBankAccounts"],
		queryFn: () => orderService.getBankAccounts(),
		enabled,
	});
}

export function useAddBankAccountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean }) =>
			orderService.addBankAccount(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userBankAccounts"] });
		},
	});
}

export function useUpdateBankAccountMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean } }) =>
			orderService.updateBankAccount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userBankAccounts"] });
		},
	});
}

export function useMyRefundsQuery() {
	return useQuery({
		queryKey: ["myRefundRequests"],
		queryFn: () => orderService.getMyRefunds(),
	});
}

export function useCancelRefundMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => orderService.cancelRefundRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["myRefundRequests"] });
			queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
		},
	});
}

export function useCreateWithdrawMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { amount: number; bankAccountId: string }) =>
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
		queryKey: ["myWithdrawals"],
		queryFn: () => api.get("/withdrawals").then((r) => r.data?.value || r.data || []),
	});
}
