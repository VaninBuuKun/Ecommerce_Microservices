import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import { kycService } from "../services";
import { sellerQueryKeys } from "../api/queryKeys";

export function useSellerProfileQuery() {
	const accessToken = useAuthStore((state) => state.accessToken);

	return useQuery({
		queryKey: sellerQueryKeys.profile,
		queryFn: () => kycService.getMySellerProfile(),
		enabled: Boolean(accessToken),
		staleTime: 1000 * 60 * 5,
	});
}
