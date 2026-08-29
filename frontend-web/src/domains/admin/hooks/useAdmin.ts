import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";

export const adminQueryKeys = {
  kycs: ["admin", "kycs"] as const,
  withdrawals: ["admin", "withdrawals"] as const,
  vouchers: ["admin", "vouchers"] as const,
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
