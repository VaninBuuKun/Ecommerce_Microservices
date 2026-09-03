export interface Conversation {
	roomId: string;
	shopId: number;
	buyerUserId: number;
	lastMessage: string;
	lastActiveAt: string;
	displayName: string;
	displayAvatar: string;
	themeColor?: string | null;
	backgroundColor?: string | null;
}

export interface ChatMessageItem {
	id: string;
	roomId: string;
	senderId: number;
	content: string;
	messageType: "Text" | "Image" | "Icon" | "Video";
	sentAt: string;
}

export type ChatMessageDto = ChatMessageItem;

export interface ChatItemTheme {
	id: string;
	name: string;
	bg: string;
	text: string;
	hex: string;
}

export interface ChatBgTheme {
	id: string;
	name: string;
	bg: string;
	hex: string;
	border: string;
}
