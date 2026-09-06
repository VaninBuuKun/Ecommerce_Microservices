import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CommentOutlined, CloseOutlined } from "@ant-design/icons";
import { BotMessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/core";
import { useChatStore } from "@/domains/notification";
import type { Conversation } from "@/domains/notification";
import { useAuthStore, useAuthModalStore } from "@/domains/auth";
import { ChatMiniModal } from "./ChatMiniModal";

export function ChatBubbleButton() {
    const {
        isOpen,
        toggleChat,
        unreadCount,
        openChatWithShop,
        openChat,
        conversations,
        setConversations,
        activeRoom,
        setActiveRoom,
        setLoadingConversations,
    } = useChatStore();
    const accessToken = useAuthStore((s) => s.accessToken);
    const { openAuthModal } = useAuthModalStore();
    const location = useLocation();
    const isSeller = location.pathname.startsWith("/seller");

    // Preload trước danh sách conversations ngay khi user đã đăng nhập
    useEffect(() => {
        if (!accessToken) return;

        const preloadConversations = async () => {
            try {
                if (conversations.length === 0) {
                    setLoadingConversations(true);
                }
                const res = await api.get("/chat/conversations", { params: { isSeller } });
                const list: Conversation[] = res.data?.value || res.data || [];
                setConversations(list);
            } catch (err) {
                console.warn("[ChatBubble] Preload conversations failed:", err);
            } finally {
                setLoadingConversations(false);
            }
        };

        preloadConversations();
    }, [accessToken, isSeller]);

    // Lắng nghe sự kiện "open-shop-chat"
    useEffect(() => {
        const handleOpenShopChat = (e: any) => {
            if (!accessToken) {
                openAuthModal({
                    title: "Trò chuyện với người bán",
                    description: "Vui lòng đăng nhập tài khoản để kết nối và nhắn tin trực tiếp với cửa hàng.",
                });
                return;
            }
            if (e.detail?.shopId) {
                openChatWithShop(
                    Number(e.detail.shopId),
                    e.detail.shopName || `Shop #${e.detail.shopId}`,
                    e.detail.shopAvatar
                );
            } else {
                openChat();
            }
        };

        window.addEventListener("open-shop-chat", handleOpenShopChat);
        return () => window.removeEventListener("open-shop-chat", handleOpenShopChat);
    }, [openChatWithShop, openChat, accessToken, openAuthModal]);

    return (
        <>
            {/* Floating button group docked sát mép dưới bên phải */}
            <div className="fixed bottom-3 right-4 z-[9999] flex flex-col gap-3 items-end select-none">
                {/* 1. Nút Trợ lý AI (Kích thước w-12 h-12 đồng bộ) */}
                <motion.button
                    whileHover={{ scale: 1.08, x: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() =>
                        toast.info("✨ Trợ lý AI thông minh đang được hoàn thiện và sẽ sớm phục vụ bạn!", {
                            position: "bottom-right",
                        })
                    }
                    className="group relative w-12 h-12 rounded-xl bg-gray-950 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/35 hover:border-indigo-400 transition-all duration-200 cursor-pointer flex items-center justify-center overflow-visible"
                    title="Trợ lý AI Thông Minh"
                >
                    <BotMessageSquare className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />

                    {/* Dot thông báo hiệu ứng Ping */}
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-gray-950"></span>
                    </span>

                    {/* Tooltip on hover */}
                    <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-gray-800 flex items-center gap-1">
                        Trợ lý AI
                    </span>
                </motion.button>

                {/* 2. Nút Bong bóng Chat Chính */}
                <motion.button
                    id="chat-bubble-btn"
                    whileHover={{ scale: 1.08, x: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                        if (!accessToken) {
                            openAuthModal({
                                title: "Tin nhắn & Hỗ trợ",
                                description: "Vui lòng đăng nhập để mở trung tâm tin nhắn và kết nối với các cửa hàng.",
                            });
                            return;
                        }
                        toggleChat();
                    }}
                    className="group relative w-12 h-12 rounded-xl bg-brand-dark hover:bg-black text-brand-primary shadow-xl shadow-brand-dark/25 hover:shadow-2xl flex items-center justify-center border-2 border-brand-primary/40 cursor-pointer transition-all duration-200"
                    title={isOpen ? undefined : "Mở Trò Chuyện"}
                >
                    {isOpen ? (
                        <CloseOutlined className="text-xl text-white" />
                    ) : (
                        <CommentOutlined className="text-2xl text-brand-primary" />
                    )}

                    {/* Badge chưa đọc */}
                    {unreadCount > 0 && !isOpen && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs z-10"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </motion.span>
                    )}

                    {/* Tooltip hover (Ẩn hoàn toàn khi isOpen = true) */}
                    {!isOpen && (
                        <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-gray-800">
                            Chat với Cửa Hàng
                        </span>
                    )}
                </motion.button>
            </div>

            {/* Mini Modal rendered into portal at body level */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && <ChatMiniModal isSeller={isSeller} />}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

export default ChatBubbleButton;