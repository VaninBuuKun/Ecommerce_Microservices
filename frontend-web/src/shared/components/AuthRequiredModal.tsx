import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogIn, X, Lock, Sparkles, UserPlus, ArrowRight } from "lucide-react";
import { useAuthModalStore } from "@/domains/auth";

export const AuthRequiredModal: React.FC = () => {
    const navigate = useNavigate();
    const { isOpen, title, description, redirectUrl, closeAuthModal } = useAuthModalStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                closeAuthModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeAuthModal]);

    if (typeof document === "undefined") return null;

    const handleLogin = () => {
        closeAuthModal();
        const target = redirectUrl || window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(target)}`);
    };

    const handleRegister = () => {
        closeAuthModal();
        navigate("/register");
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        className="absolute inset-0 bg-brand-dark/70 backdrop-blur-xs"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="relative w-full max-w-[390px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden z-10 font-sans"
                    >
                        {/* Soft Brand Glow Background */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-28 bg-brand-primary/20 blur-[40px] pointer-events-none rounded-full" />

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={closeAuthModal}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border-none z-20"
                            aria-label="Đóng"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10">
                            {/* Icon Header */}
                            <div className="relative mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-brand-dark shadow-xs">
                                    <Lock className="w-7 h-7 text-brand-dark" />
                                </div>
                            </div>

                            {/* Title & Description */}
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">
                                {title || "Yêu cầu đăng nhập"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-1">
                                {description || "Vui lòng đăng nhập để tiếp tục trải nghiệm đầy đủ tính năng mua sắm và kết nối cùng chúng tôi."}
                            </p>

                            {/* Actions */}
                            <div className="w-full space-y-2.5">
                                {/* Button Primary */}
                                <button
                                    type="button"
                                    onClick={handleLogin}
                                    className="group w-full h-11 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl transition-all shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/35 flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Đăng nhập ngay</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>

                                {/* Button Secondary */}
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    className="w-full h-11 bg-slate-100 hover:bg-slate-200/70 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/60 transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
                                >
                                    <UserPlus className="w-4 h-4 text-slate-600" />
                                    <span>Đăng ký tài khoản mới</span>
                                </button>
                            </div>

                            {/* Dismiss Link */}
                            <button
                                type="button"
                                onClick={closeAuthModal}
                                className="mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                                Để sau, tôi muốn xem tiếp
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AuthRequiredModal;