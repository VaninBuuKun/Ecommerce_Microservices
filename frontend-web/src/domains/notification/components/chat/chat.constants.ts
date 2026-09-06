import type { ChatItemTheme, ChatBgTheme, ChatThemePreset } from "../../types/chat.types";

export const QUICK_EMOJIS = [
	"👍", "❤️", "😂", "🔥", "🎉", "👏", "📦", "🛍️", "⭐", "💯", "🙏", "😍", "✨", "🎁",
	"🥰", "🤩", "🥳", "😎", "🤝", "🚀", "💡", "⚡", "🍀", "💸", "🛵", "🛒", "🏷️", "👑"
];

export interface ChatStickerItem {
	id: string;
	name: string;
	url: string;
}

export interface ChatGifItem {
	id: string;
	title: string;
	url: string;
}

// Bộ sưu tập Sticker 3D Fluent Emojis siêu sống động
export const CHAT_STICKERS: ChatStickerItem[] = [
	{
		id: "sticker-heart-eyes",
		name: "Mê mẩn",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png"
	},
	{
		id: "sticker-party",
		name: "Tiệc tùng",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png"
	},
	{
		id: "sticker-star-struck",
		name: "Ngưỡng mộ",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png"
	},
	{
		id: "sticker-kiss",
		name: "Bắn tim",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20Blowing%20a%20Kiss.png"
	},
	{
		id: "sticker-salute",
		name: "Rõ rồi sếp",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Saluting%20Face.png"
	},
	{
		id: "sticker-money-mouth",
		name: "Nhiều tiền",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Money-Mouth%20Face.png"
	},
	{
		id: "sticker-thumbs-up",
		name: "Tuyệt vời",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png"
	},
	{
		id: "sticker-clapping",
		name: "Vỗ tay",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Clapping%20Hands.png"
	},
	{
		id: "sticker-heart-hands",
		name: "Yêu thương",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Heart%20Hands.png"
	},
	{
		id: "sticker-shopping-bags",
		name: "Mua sắm",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png"
	},
	{
		id: "sticker-package",
		name: "Kiện hàng",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Package.png"
	},
	{
		id: "sticker-party-popper",
		name: "Chúc mừng",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png"
	},
	{
		id: "sticker-fire",
		name: "Cháy quá",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Fire.png"
	},
	{
		id: "sticker-sparkles",
		name: "Lấp lánh",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Sparkles.png"
	},
	{
		id: "sticker-red-heart",
		name: "Trái tim",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png"
	},
	{
		id: "sticker-victory",
		name: "Chiến thắng",
		url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Victory%20Hand.png"
	}
];

// Bộ ảnh GIF phản ứng sinh động cho phòng chat
export const CHAT_GIFS: ChatGifItem[] = [
	{
		id: "gif-cat-wave",
		title: "Mèo vẫy chào",
		url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif"
	},
	{
		id: "gif-thank-you",
		title: "Cảm ơn bạn",
		url: "https://media.giphy.com/media/3oz8xIsloV7zOmt83G/giphy.gif"
	},
	{
		id: "gif-thumbs-up",
		title: "Tuyệt hảo",
		url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif"
	},
	{
		id: "gif-shopping-spree",
		title: "Mua sắm thả ga",
		url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
	},
	{
		id: "gif-heart-love",
		title: "Bắn tim yêu thích",
		url: "https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif"
	},
	{
		id: "gif-wow-face",
		title: "Trầm trồ ngạc nhiên",
		url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
	},
	{
		id: "gif-cat-nod",
		title: "Gật đầu đồng ý",
		url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif"
	},
	{
		id: "gif-happy-dog",
		title: "Cún cười hớn hở",
		url: "https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif"
	},
	{
		id: "gif-party-dance",
		title: "Nhảy múa ăn mừng",
		url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif"
	},
	{
		id: "gif-delivery-fast",
		title: "Giao hàng thần tốc",
		url: "https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif"
	},
	{
		id: "gif-sale-hunter",
		title: "Săn sale chốt đơn",
		url: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif"
	},
	{
		id: "gif-applause",
		title: "Nhiệt liệt tán thưởng",
		url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif"
	}
];

// Bảng màu bong bóng tin nhắn (Chat Item Bubble - giữ tương thích)
export const CHAT_ITEM_THEMES: ChatItemTheme[] = [
	{ id: "rose", name: "Hoa hồng (Mặc định)", bg: "bg-rose-500", text: "text-white", hex: "#f43f5e" },
	{ id: "dark", name: "Cổ điển (Brand Dark)", bg: "bg-brand-dark", text: "text-white", hex: "#171717" },
	{ id: "brand", name: "Xanh lục (Brand Green)", bg: "bg-brand-primary-deep", text: "text-brand-dark", hex: "#24b47e" },
	{ id: "blue", name: "Đại dương", bg: "bg-blue-600", text: "text-white", hex: "#2563eb" },
	{ id: "indigo", name: "Tím Indigo", bg: "bg-indigo-600", text: "text-white", hex: "#4f46e5" },
	{ id: "emerald", name: "Ngọc bích", bg: "bg-emerald-600", text: "text-white", hex: "#059669" },
	{ id: "orange", name: "Cam Sunset", bg: "bg-orange-600", text: "text-white", hex: "#ea580c" },
];

// Bảng màu nền khung chat (Chat Background - giữ tương thích)
export const CHAT_BG_THEMES: ChatBgTheme[] = [
	{ id: "white", name: "Trắng", bg: "bg-white", hex: "#ffffff", border: "border-slate-200" },
	{ id: "slate", name: "Xám nhạt", bg: "bg-slate-50/70", hex: "#f8fafc", border: "border-slate-300" },
	{ id: "blue", name: "Xanh phấn", bg: "bg-blue-50/40", hex: "#eff6ff", border: "border-blue-200" },
	{ id: "cream", name: "Be ấm", bg: "bg-[#faf8f5]", hex: "#faf8f5", border: "border-amber-200" },
	{ id: "dark", name: "Tối Obsidian", bg: "bg-slate-900", hex: "#0f172a", border: "border-slate-700" },
];

export const DEFAULT_CHAT_ITEM_THEME: ChatItemTheme = CHAT_ITEM_THEMES[0]; // rose
export const DEFAULT_CHAT_BG_THEME: ChatBgTheme = CHAT_BG_THEMES[0]; // white

/**
 * BỘ SƯU TẬP CHỦ ĐỀ TOÀN DIỆN (Coordinated Design Presets)
 * Tự động phối màu nền, bong bóng bên mình, bong bóng bên đối phương (không còn màu trắng cứng nhắc),
 * màu mốc thời gian và chữ phù hợp cho cả 2 bên.
 */
export const CHAT_THEME_PRESETS: ChatThemePreset[] = [
	{
		id: "rose",
		name: "Hồng Dịu Dàng",
		description: "Tông hồng phấn ngọt ngào, ấm áp và thân thiện",
		previewHex: "#f43f5e",
		secondaryPreviewHex: "#ffe4e6",
		isDark: false,
		background: "bg-rose-50/30",
		myBubble: {
			bg: "bg-rose-500",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-slate-800",
			border: "border-rose-200/70 shadow-rose-100/40",
		},
		timePill: {
			bg: "bg-rose-100/90",
			text: "text-rose-700",
			border: "border-rose-200/80",
		},
		timestampText: "text-rose-400",
	},
	{
		id: "emerald",
		name: "Xanh Lục Bảo",
		description: "Sắc xanh ngọc lục bảo tươi mát, sang trọng chuẩn thương hiệu",
		previewHex: "#059669",
		secondaryPreviewHex: "#d1fae5",
		isDark: false,
		background: "bg-emerald-50/35",
		myBubble: {
			bg: "bg-emerald-600",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-emerald-950",
			border: "border-emerald-200/70 shadow-emerald-100/40",
		},
		timePill: {
			bg: "bg-emerald-100/90",
			text: "text-emerald-800",
			border: "border-emerald-200/80",
		},
		timestampText: "text-emerald-600/70",
	},
	{
		id: "dark",
		name: "Đêm Huyền Bí (Obsidian)",
		description: "Giao diện tối Obsidian thanh lịch, dịu mắt và cực kỳ hiện đại",
		previewHex: "#020617",
		secondaryPreviewHex: "#3b82f6",
		isDark: true,
		background: "bg-slate-950",
		myBubble: {
			bg: "bg-blue-600",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-slate-800/95",
			text: "text-slate-100",
			border: "border-slate-700/80 shadow-slate-900/50",
		},
		timePill: {
			bg: "bg-slate-800/90",
			text: "text-slate-300",
			border: "border-slate-700",
		},
		timestampText: "text-slate-400",
	},
	{
		id: "blue",
		name: "Đại Dương Sâu Thẳm",
		description: "Xanh biển khoáng đạt, tin cậy và tràn đầy năng lượng",
		previewHex: "#2563eb",
		secondaryPreviewHex: "#dbeafe",
		isDark: false,
		background: "bg-blue-50/35",
		myBubble: {
			bg: "bg-blue-600",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-blue-950",
			border: "border-blue-200/70 shadow-blue-100/40",
		},
		timePill: {
			bg: "bg-blue-100/90",
			text: "text-blue-800",
			border: "border-blue-200/80",
		},
		timestampText: "text-blue-500",
	},
	{
		id: "orange",
		name: "Hoàng Hôn (Sunset)",
		description: "Sắc cam hoàng hôn ấm áp, rực rỡ và cuốn hút",
		previewHex: "#ea580c",
		secondaryPreviewHex: "#ffedd5",
		isDark: false,
		background: "bg-orange-50/35",
		myBubble: {
			bg: "bg-gradient-to-r from-orange-500 to-amber-500",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-amber-950",
			border: "border-orange-200/70 shadow-orange-100/40",
		},
		timePill: {
			bg: "bg-orange-100/90",
			text: "text-orange-800",
			border: "border-orange-200/80",
		},
		timestampText: "text-orange-500/80",
	},
	{
		id: "indigo",
		name: "Tím Hoàng Gia",
		description: "Sắc tím mộng mơ, quyến rũ và mang chiều sâu thẩm mỹ",
		previewHex: "#6366f1",
		secondaryPreviewHex: "#e0e7ff",
		isDark: false,
		background: "bg-indigo-50/35",
		myBubble: {
			bg: "bg-indigo-600",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-indigo-950",
			border: "border-indigo-200/70 shadow-indigo-100/40",
		},
		timePill: {
			bg: "bg-indigo-100/90",
			text: "text-indigo-800",
			border: "border-indigo-200/80",
		},
		timestampText: "text-indigo-400",
	},
	{
		id: "midnight",
		name: "Cyberpunk Neon",
		description: "Ánh sáng Neon xanh cyan trên nền đêm huyền ảo",
		previewHex: "#06b6d4",
		secondaryPreviewHex: "#0f172a",
		isDark: true,
		background: "bg-[#0b0f19]",
		myBubble: {
			bg: "bg-gradient-to-r from-cyan-500 to-blue-600",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-[#161f30]",
			text: "text-cyan-50",
			border: "border-cyan-900/60 shadow-slate-950/60",
		},
		timePill: {
			bg: "bg-[#161f30]",
			text: "text-cyan-400",
			border: "border-cyan-800/50",
		},
		timestampText: "text-cyan-400/80",
	},
	{
		id: "minimal",
		name: "Tối Giản (Minimalist)",
		description: "Đen trắng tương phản thanh lịch, phong cách tối giản Bắc Âu",
		previewHex: "#18181b",
		secondaryPreviewHex: "#f4f4f5",
		isDark: false,
		background: "bg-[#fafafa]",
		myBubble: {
			bg: "bg-zinc-900",
			text: "text-white",
		},
		theirBubble: {
			bg: "bg-white",
			text: "text-zinc-800",
			border: "border-zinc-200 shadow-xs",
		},
		timePill: {
			bg: "bg-zinc-100",
			text: "text-zinc-600",
			border: "border-zinc-200",
		},
		timestampText: "text-zinc-400",
	},
];

export const DEFAULT_CHAT_THEME: ChatThemePreset = CHAT_THEME_PRESETS[0];

/**
 * Lấy bộ phối màu hoàn chỉnh cho phòng chat
 */
export function getChatTheme(themeId?: string | null, bgId?: string | null): ChatThemePreset {
	if (themeId) {
		if (themeId === "brand") return CHAT_THEME_PRESETS[1]; // emerald
		const found = CHAT_THEME_PRESETS.find((t) => t.id === themeId);
		if (found) return found;
	}
	if (bgId === "dark") {
		return CHAT_THEME_PRESETS.find((t) => t.id === "dark") || CHAT_THEME_PRESETS[0];
	}
	return CHAT_THEME_PRESETS[0];
}

/**
 * Định dạng thời gian ngắt quãng theo phong cách Facebook Messenger
 */
export function formatMessengerTime(dateStr: string): string {
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) return "";

	const now = new Date();
	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const isYesterday =
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear();

	const timeStr = date.toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});

	if (isToday) {
		return `Hôm nay, ${timeStr}`;
	}
	if (isYesterday) {
		return `Hôm qua, ${timeStr}`;
	}

	const isSameYear = date.getFullYear() === now.getFullYear();
	const dateStrFormatted = date.toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		...(isSameYear ? {} : { year: "numeric" }),
	});

	return `${dateStrFormatted}, ${timeStr}`;
}

/**
 * Kiểm tra xem có cần hiển thị nhãn mốc thời gian ở giữa hai tin nhắn hay không (giống Messenger)
 */
export function shouldShowTimeSeparator(currMsgDateStr: string, prevMsgDateStr?: string): boolean {
	if (!prevMsgDateStr) return true; // Tin nhắn đầu tiên luôn có nhãn thời gian bắt đầu cuộc trò chuyện

	const currTime = new Date(currMsgDateStr).getTime();
	const prevTime = new Date(prevMsgDateStr).getTime();
	if (isNaN(currTime) || isNaN(prevTime)) return false;

	// Cách nhau hơn 15 phút
	if (currTime - prevTime > 15 * 60 * 1000) return true;

	// Khác ngày theo lịch
	const currDate = new Date(currMsgDateStr);
	const prevDate = new Date(prevMsgDateStr);
	return currDate.toDateString() !== prevDate.toDateString();
}

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

/**
 * Trích xuất danh sách URLs từ content của tin nhắn đa phương tiện.
 * Hỗ trợ định dạng JSON array: ["url1", "url2"], newline-separated, hoặc URL đơn lẻ.
 */
export function parseMediaUrls(content?: string): string[] {
	if (!content) return [];
	const trimmed = content.trim();
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) return parsed.filter(Boolean);
		} catch {}
	}
	if (trimmed.includes("\n")) {
		return trimmed.split("\n").map((s) => s.trim()).filter(Boolean);
	}
	return [trimmed];
}

/**
 * Định dạng dòng tóm tắt tin nhắn cuối cùng hiển thị ngoài danh sách hội thoại.
 */
export function formatConversationLastMessage(
	lastMessage?: string,
	messageType?: string,
	isMyMessage?: boolean
): string {
	if (!lastMessage) return "Chưa có tin nhắn";
	if (lastMessage === "Tin nhắn đã được thu hồi") return "Tin nhắn đã được thu hồi";

	const type = (messageType || "").toLowerCase();
	if (type === "image" || lastMessage.includes(".jpg") || lastMessage.includes(".png") || lastMessage.includes(".webp") || lastMessage.includes(".jpeg")) {
		const urls = parseMediaUrls(lastMessage);
		const count = urls.length > 0 ? urls.length : 1;
		if (count > 1) {
			return isMyMessage ? `Bạn đã gửi ${count} ảnh` : `Đã gửi ${count} ảnh`;
		}
		return isMyMessage ? "Bạn đã gửi 1 ảnh" : "Đã gửi 1 ảnh";
	}

	if (type === "video" || lastMessage.includes(".mp4") || lastMessage.includes(".mov") || lastMessage.includes(".webm")) {
		const urls = parseMediaUrls(lastMessage);
		const count = urls.length > 0 ? urls.length : 1;
		if (count > 1) {
			return isMyMessage ? `Bạn đã gửi ${count} video` : `Đã gửi ${count} video`;
		}
		return isMyMessage ? "Bạn đã gửi 1 video" : "Đã gửi 1 video";
	}

	if (type === "sticker") return "[Sticker 3D]";
	if (type === "gif") return "[Ảnh GIF]";

	return lastMessage;
}

/**
 * Tải tệp hình ảnh hoặc video từ URL về máy người dùng (hỗ trợ Cross-Origin S3/MinIO qua Blob).
 */
export async function downloadChatMedia(url: string, defaultName = "media") {
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP error ${res.status}`);
		const blob = await res.blob();
		const blobUrl = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		const ext = url.split("?")[0].split(".").pop() || "";
		const rawName = url.split("/").pop()?.split("?")[0] || defaultName;
		a.download = rawName.includes(".") ? rawName : `${rawName}.${ext || "png"}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
	} catch (error) {
		console.warn("Direct blob download failed, fallback to link:", error);
		const a = document.createElement("a");
		a.href = url;
		a.download = url.split("/").pop()?.split("?")[0] || defaultName;
		a.target = "_blank";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
}

