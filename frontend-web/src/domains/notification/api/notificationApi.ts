import { api } from "@/core";
import type { NotificationDto } from "../types/notification.types";

export const notificationApi = {
	getMyNotifications: async (page = 1, pageSize = 50): Promise<NotificationDto[]> => {
		const res = await api.get("/notifications", {
			params: { page, pageSize },
		});
		const data = res.data?.value || res.data || [];
		return Array.isArray(data) ? data : [];
	},

	getNotificationById: async (id: string | number): Promise<NotificationDto> => {
		const res = await api.get(`/notifications/${id}`);
		return res.data?.value || res.data;
	},

	markAsRead: async (notificationId: string | number): Promise<void> => {
		await api.put(`/notifications/${notificationId}/read`);
	},

	markAllAsRead: async (): Promise<void> => {
		await api.put("/notifications/read-all");
	},
};
