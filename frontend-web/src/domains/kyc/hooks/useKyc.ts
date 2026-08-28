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
    onSuccess: (res: any, variables) => {
      // Optimistically update sellerProfile query data so kyc status instantly updates to "Submitted" or "Draft" without UI flicker
      queryClient.setQueryData(kycQueryKeys.profile, (oldProfile: any) => {
        if (!oldProfile) return oldProfile;
        const updatedKyc = res?.data?.value || res?.data || res?.value || res;
        const newStatus = variables.isDraft === false ? "Submitted" : "Draft";
        return {
          ...oldProfile,
          kyc: {
            ...(oldProfile.kyc || {}),
            ...(typeof updatedKyc === "object" ? updatedKyc : {}),
            status: newStatus,
          },
        };
      });
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
      queryClient.setQueryData(kycQueryKeys.profile, (oldProfile: any) => {
        if (!oldProfile) return oldProfile;
        return {
          ...oldProfile,
          kyc: {
            ...(oldProfile.kyc || {}),
            status: "Draft",
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.myKyc });
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.profile });
    },
  });
}
