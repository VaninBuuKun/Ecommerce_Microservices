import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axiosInstance";
import { useAuthStore } from "../stores/useAuthStore";

export function useCurrentUserQuery() {
	const accessToken = useAuthStore((state) => state.accessToken);

	return useQuery({
		queryKey: ["auth", "currentUser", accessToken],
		queryFn: async () => {
			if (!accessToken) return null;
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
		enabled: Boolean(accessToken),
		retry: false,
		staleTime: 1000 * 60 * 5,
	});
}
