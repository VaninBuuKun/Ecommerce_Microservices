import type { ChatItemTheme, ChatBgTheme } from "../../types/chat.types";

export const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👏", "📦", "🛍️", "⭐", "💯", "🙏", "😍", "✨", "🎁"];

// Bảng màu bong bóng tin nhắn (Chat Item Bubble)
// Khi màu trong DB là null -> Mặc định là 'rose' (Hồng / Đỏ Rose giống hệt ảnh mẫu của User)
export const CHAT_ITEM_THEMES: ChatItemTheme[] = [
	{ id: "rose", name: "Hoa hồng (Mặc định)", bg: "bg-rose-500", text: "text-white", hex: "#f43f5e" },
	{ id: "dark", name: "Cổ điển (Brand Dark)", bg: "bg-brand-dark", text: "text-white", hex: "#171717" },
	{ id: "brand", name: "Xanh lục (Brand Green)", bg: "bg-brand-primary-deep", text: "text-brand-dark", hex: "#24b47e" },
	{ id: "blue", name: "Đại dương", bg: "bg-blue-600", text: "text-white", hex: "#2563eb" },
	{ id: "indigo", name: "Tím Indigo", bg: "bg-indigo-600", text: "text-white", hex: "#4f46e5" },
	{ id: "emerald", name: "Ngọc bích", bg: "bg-emerald-600", text: "text-white", hex: "#059669" },
	{ id: "orange", name: "Cam Sunset", bg: "bg-orange-600", text: "text-white", hex: "#ea580c" },
];

// Bảng màu nền khung chat (Chat Background)
export const CHAT_BG_THEMES: ChatBgTheme[] = [
	{ id: "white", name: "Trắng", bg: "bg-white", hex: "#ffffff", border: "border-slate-200" },
	{ id: "slate", name: "Xám nhạt", bg: "bg-slate-50/70", hex: "#f8fafc", border: "border-slate-300" },
	{ id: "blue", name: "Xanh phấn", bg: "bg-blue-50/40", hex: "#eff6ff", border: "border-blue-200" },
	{ id: "cream", name: "Be ấm", bg: "bg-[#faf8f5]", hex: "#faf8f5", border: "border-amber-200" },
	{ id: "dark", name: "Tối Obsidian", bg: "bg-slate-900", hex: "#0f172a", border: "border-slate-700" },
];

export const DEFAULT_CHAT_ITEM_THEME: ChatItemTheme = CHAT_ITEM_THEMES[0]; // rose
export const DEFAULT_CHAT_BG_THEME: ChatBgTheme = CHAT_BG_THEMES[0]; // white
