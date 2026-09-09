import { useQuery } from "@tanstack/react-query";
import { api } from "@/core";
import { useAuthStore } from "../stores/useAuthStore";
import { isAuthenticated } from "@/shared/utils/authHelper";

export function useCurrentUserQuery() {
	const accessToken = useAuthStore((state) => state.accessToken);
	const authed = !!accessToken && isAuthenticated(accessToken);

	return useQuery({
		queryKey: ["auth", "currentUser", accessToken],
		queryFn: async () => {
			if (!authed) return null;
			const response = await api.get("/users/me");
			const userData = response.data?.value || response.data;
			if (userData) {
				useAuthStore.getState().setUser({
					id: userData.id,
					email: userData.email || "",
					firstName: userData.firstName || "",
					lastName: userData.lastName || "",
					fullName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.email || "Khách hàng",
					avatarUrl: userData.avatarUrl,
					phoneNumber: userData.phoneNumber,
					roles: userData.roles || [],
				});
			}
			return userData;
		},
		enabled: authed,
		retry: false,
		staleTime: 1000 * 60 * 5,
	});
}
