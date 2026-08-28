import { api } from "@/core";
import type { NotificationDto } from "../types/notification.types";

export const notificationApi = {
	getMyNotifications: async (): Promise<NotificationDto[]> => {
		const res = await api.get("/notifications", {
			params: { page: 1, pageSize: 20 },
		});
		return res.data;
	},


	markAsRead: async (notificationId: number): Promise<void> => {
		await api.put(`/notifications/${notificationId}/read`);
	},

	markAllAsRead: async (): Promise<void> => {
		await api.put("/notifications/read-all");
	},
};
