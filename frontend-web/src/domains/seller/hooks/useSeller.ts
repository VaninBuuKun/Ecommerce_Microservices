import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerApi } from "../api/sellerApi";
import { useAuthStore } from "@/domains/auth";

export const sellerQueryKeys = {
  myShops: ["shops", "me"] as const,
  profile: ["seller", "profile"] as const,
  shopDetail: (id: string) => ["shops", id] as const,
};

export function useSellerProfileQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: sellerQueryKeys.profile,
    queryFn: sellerApi.getMySellerProfile,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyShopsQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: sellerQueryKeys.myShops,
    queryFn: sellerApi.getMyShops,
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });
}

export function useShopDetailQuery(shopId: string) {
  return useQuery({
    queryKey: sellerQueryKeys.shopDetail(shopId),
    queryFn: () => sellerApi.getShopById(shopId),
    enabled: !!shopId,
  });
}

export function useCreateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sellerApi.createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.myShops });
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.profile });
    },
  });
}

export function useUpdateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => sellerApi.updateShop(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.myShops });
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.profile });
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.shopDetail(variables.id) });
    },
  });
}
