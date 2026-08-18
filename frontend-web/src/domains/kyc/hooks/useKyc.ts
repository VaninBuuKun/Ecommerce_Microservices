import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kycApi } from "../api/kycApi";
import { useAuthStore } from "@/domains/auth";

export const kycQueryKeys = {
  myKyc: ["kyc", "me"] as const,
  profile: ["seller", "profile"] as const,
};

export function useMyKycQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: kycQueryKeys.myKyc,
    queryFn: kycApi.getMyKyc,
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSellerProfileQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: kycQueryKeys.profile,
    queryFn: kycApi.getMySellerProfile,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRegisterKycMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      identityCardNumber: string;
      identityCardFrontUrl: string;
      identityCardBackUrl: string;
      isDraft?: boolean;
    }) => kycApi.registerKyc(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.myKyc });
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.profile });
    },
  });
}

export function useWithdrawKycMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => kycApi.withdrawDraft(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.myKyc });
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.profile });
    },
  });
}
