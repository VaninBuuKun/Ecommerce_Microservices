import { useQuery } from "@tanstack/react-query";
import { addressApi } from "../api/addressApi";

export const addressQueryKeys = {
  addresses: ["user-addresses"] as const,
};

export function useUserAddressesQuery() {
  return useQuery({
    queryKey: addressQueryKeys.addresses,
    queryFn: addressApi.getUserAddresses,
    staleTime: 1000 * 60 * 5,
  });
}
