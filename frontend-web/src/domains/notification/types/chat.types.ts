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
	messageType: "Text" | "Image" | "Icon" | "Video" | "Sticker" | "Gif";
	sentAt: string;
	isUploading?: boolean;
	isRevoked?: boolean;
	reactions?: Record<string, number>;
	userReaction?: string;
}

export interface ChatPendingMedia {
	id: string;
	file: File;
	type: "Image" | "Video";
	fileName: string;
	fileSize: number;
	previewUrl: string;
	status: "uploading" | "done" | "error";
	progress: number;
	uploadedUrl?: string;
	error?: string;
	autoSendWhenDone?: boolean;
	targetRoomId?: string;
	recipientId?: number | string;
	senderRole?: string;
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

export interface ChatThemePreset {
	id: string;
	name: string;
	description?: string;
	isDark?: boolean;
	previewHex: string;
	secondaryPreviewHex: string;
	background: string;
	myBubble: {
		bg: string;
		text: string;
		border?: string;
	};
	theirBubble: {
		bg: string;
		text: string;
		border: string;
	};
	timePill: {
		bg: string;
		text: string;
		border: string;
	};
	timestampText: string;
}
