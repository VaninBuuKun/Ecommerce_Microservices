import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "../api/orderApi";

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
		mutationFn: (id: string) => orderApi.setDefaultAddress(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["order", "addresses"] });
		},
	});
}

export function useDeleteAddressMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => orderApi.deleteAddress(id),
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

export function useCustomerOrdersQuery(customerId: string) {
	return useQuery({
		queryKey: ["orders", "customer", customerId],
		queryFn: () => orderApi.getCustomerOrders(customerId),
		enabled: Boolean(customerId),
	});
}

export function useMyRefundsQuery() {
	return useQuery({
		queryKey: ["refunds", "my-requests"],
		queryFn: () => orderApi.getMyRefunds(),
	});
}
