export interface NotificationDto {
	id: number;
	userId: number;
	title: string;
	body: string;
	type: string;
	referenceId?: string;
	isRead: boolean;
	createdAt: string;
}
