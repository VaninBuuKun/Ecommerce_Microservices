import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notificationApi";

export function useNotifications() {
	const queryClient = useQueryClient();

	const notificationsQuery = useQuery({
		queryKey: ["notifications"],
		queryFn: () => notificationApi.getMyNotifications(),
		staleTime: 1000 * 30, // 30s
	});


	const markAsReadMutation = useMutation({
		mutationFn: (id: string) => notificationApi.markAsRead(id),
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
		markAsRead: markAsReadMutation.mutate,
		markAllAsRead: markAllAsReadMutation.mutate,
	};
}
