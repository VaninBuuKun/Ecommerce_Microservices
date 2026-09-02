import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";

export const adminQueryKeys = {
  kycs: ["admin", "kycs"] as const,
  withdrawals: ["admin", "withdrawals"] as const,
  vouchers: ["admin", "vouchers"] as const,
  products: ["admin", "products"] as const,
  users: ["admin", "users"] as const,
  shops: ["admin", "shops"] as const,
  orders: ["admin", "orders"] as const,
  paymentMethods: ["admin", "paymentMethods"] as const,
};

export function useAdminKycsQuery(params?: { page?: number; pageSize?: number; status?: string }) {
  return useQuery({
    queryKey: [...adminQueryKeys.kycs, params],
    queryFn: () => adminApi.getAdminKycs(params),
  });
}

export function useApproveKycMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.approveKyc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.kycs });
    },
  });
}

export function useRejectKycMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kycId, reason }: { kycId: number; reason: string }) => adminApi.rejectKyc(kycId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.kycs });
    },
  });
}

export function useAdminWithdrawalsQuery(params?: any) {
  return useQuery({
    queryKey: [...adminQueryKeys.withdrawals, params],
    queryFn: () => adminApi.getWithdrawalRequests(params),
  });
}

export function useApproveWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals });
    },
  });
}

export function useRejectWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote: string }) => adminApi.rejectWithdrawal(id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals });
    },
  });
}

export function useCompleteWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { adminNote?: string; proofImageUrl?: string } }) => adminApi.completeWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals });
    },
  });
}

export function useAdminVouchersQuery(params?: any) {
  return useQuery({
    queryKey: [...adminQueryKeys.vouchers, params],
    queryFn: () => adminApi.getVouchers(params),
  });
}

export function useCreateAdminVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => adminApi.createVoucher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vouchers });
    },
  });
}

export function useUpdateAdminVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => adminApi.updateVoucher({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vouchers });
    },
  });
}

export function useDeleteAdminVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vouchers });
    },
  });
}

export function useDeleteVoucherMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vouchers });
    },
  });
}

export function useAdminProductsQuery(params?: {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: number;
  shopId?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.products, params],
    queryFn: () => adminApi.getAdminProducts(params),
  });
}

export function useAdminUsersQuery(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.users, params],
    queryFn: () => adminApi.getAdminUsers(params),
  });
}

export function useAdminShopsQuery(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.shops, params],
    queryFn: () => adminApi.getAdminShops(params),
  });
}

export function useAdminOrdersQuery(params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  searchKeyword?: string;
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.orders, params],
    queryFn: () => adminApi.getAdminOrders(params),
  });
}

export function useAdminPaymentMethodsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.paymentMethods,
    queryFn: () => adminApi.getPaymentMethods(),
  });
}

export function useCreatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      subTitle?: string;
      isActive: boolean;
      providerName: string;
      iconUrl: string;
    }) => adminApi.createPaymentMethod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.paymentMethods });
    },
  });
}

export function useUpdatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        title: string;
        subTitle?: string;
        isActive: boolean;
        providerName: string;
        iconUrl: string;
      };
    }) => adminApi.updatePaymentMethod({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.paymentMethods });
    },
  });
}

export function useTogglePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.togglePaymentMethodStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.paymentMethods });
    },
  });
}
