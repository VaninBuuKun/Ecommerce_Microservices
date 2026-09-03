import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notificationApi";
import { useAuthStore } from "@/domains/auth/stores/useAuthStore";

export function useNotifications() {
	const queryClient = useQueryClient();
	const accessToken = useAuthStore((s) => s.accessToken);

	const notificationsQuery = useQuery({
		queryKey: ["notifications"],
		queryFn: () => notificationApi.getMyNotifications(1, 50),
		enabled: !!accessToken,
		staleTime: 1000 * 30, // 30s
	});

	const markAsReadMutation = useMutation({
		mutationFn: (id: string | number) => notificationApi.markAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const markAllAsReadMutation = useMutation({
		mutationFn: () => notificationApi.markAllAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const unreadCount = notificationsQuery.data?.filter((n) => !n.isRead).length || 0;

	return {
		notifications: notificationsQuery.data || [],
		isLoading: notificationsQuery.isLoading,
		unreadCount,
		refetch: notificationsQuery.refetch,
		markAsRead: markAsReadMutation.mutate,
		markAllAsRead: markAllAsReadMutation.mutate,
		isMarkingAll: markAllAsReadMutation.isPending,
	};
}
