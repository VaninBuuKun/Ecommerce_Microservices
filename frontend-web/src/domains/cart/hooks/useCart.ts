import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cartApi";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";

export const cartQueryKeys = {
  cart: ["cart"] as const,
};

export function useCartQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: cartQueryKeys.cart,
    queryFn: cartApi.getCart,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export const useAddItemToCartMutation = useAddToCartMutation;

export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.updateQuantity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export function useUpdateSelectStateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.updateSelectState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export const useRemoveItemMutation = useRemoveFromCartMutation;

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export function useRebuyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.rebuy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    },
  });
}

export function useBuyNowOrReorder() {
  const queryClient = useQueryClient();

  const buyNowOrReorder = async (options: {
    subOrderId?: number | string | null;
    variantIds?: (number | string)[] | null;
    subOrderItems?: { variantId?: string | number; id?: string | number }[];
  }) => {
    let resolvedVariantIds = options.variantIds;
    if (!resolvedVariantIds && options.subOrderItems) {
      resolvedVariantIds = options.subOrderItems
        .map((i) => i.variantId || i.id)
        .filter(Boolean) as (string | number)[];
    }

    const result = await cartApi.rebuy({
      subOrderId: options.subOrderId,
      variantIds: resolvedVariantIds,
    });

    await queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart });
    return result;
  };

  return { buyNowOrReorder };
}
