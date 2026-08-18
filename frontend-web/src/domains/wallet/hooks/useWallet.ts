import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../api/walletApi";

export const walletQueryKeys = {
  wallet: ["wallet"] as const,
  transactions: ["wallet", "transactions"] as const,
};

export function useWalletQuery() {
  return useQuery({
    queryKey: walletQueryKeys.wallet,
    queryFn: walletApi.getWallet,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useActivateWalletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.activateWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallet });
    },
  });
}

export function useCreateWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.createWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallet });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions });
    },
  });
}
