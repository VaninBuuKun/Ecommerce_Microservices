import { useQuery } from "@tanstack/react-query";
import api from "../../../shared/lib/axios";
import { useAuthStore } from "../store";
import type { UserProfile } from "../types";
import { authQueryKeys } from "../api/queryKeys";

function mapUserProfile(response: any): UserProfile {
	return {
		id: response.id,
		email: response.email || "vanpro@example.com",
		firstName: response.firstName || "Nguyễn",
		lastName: response.lastName || "Vân",
		avatarUrl:
			response.avatarUrl ||
			"https://img-c.udemycdn.com/user/75x75/274127471_84ee_8.jpg",
	};
}

export function useCurrentUserQuery() {
	const accessToken = useAuthStore((state) => state.accessToken);
	const setUser = useAuthStore((state) => state.setUser);

	return useQuery({
		queryKey: authQueryKeys.me,
		queryFn: async () => {
			const response = await api.get("/users/me");
			const profile = mapUserProfile(response.data);
			setUser(profile);
			return profile;
		},
		enabled: Boolean(accessToken),
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
