import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

// USE_MOCK_DATA flag for fallback testing
const USE_MOCK_DATA = false;

export function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !email.includes("@")) {
			toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
			return;
		}

		try {
			setIsLoading(true);
			if (USE_MOCK_DATA) {
				await new Promise((res) => setTimeout(res, 800));
			} else {
				await api.post("/identity/users/forgot-password", { email });
			}
			setIsSubmitted(true);
			toast.success("Yêu cầu đã được gửi! Vui lòng kiểm tra hộp thư email của bạn.");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi gửi yêu cầu khôi phục mật khẩu.";
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-brand-light font-sans text-brand-dark flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-white border border-brand-border rounded-3xl p-6 md:p-8 shadow-xl text-left space-y-6">
				<div className="flex items-center gap-3 border-b border-brand-border pb-4">
					<div className="p-2.5 bg-brand-primary/20 text-brand-dark rounded-2xl">
						<KeyRound className="w-6 h-6 text-brand-primary-deep" />
					</div>
					<div>
						<h1 className="text-xl font-black text-brand-dark tracking-tight">Quên Mật Khẩu</h1>
						<p className="text-xs text-brand-muted font-bold">Khôi phục quyền truy cập tài khoản</p>
					</div>
				</div>

				{isSubmitted ? (
					<div className="space-y-4 text-center py-4">
						<CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
						<h3 className="text-base font-bold text-brand-dark">Đã Gửi Hướng Dẫn Kích Hoạt!</h3>
						<p className="text-xs text-brand-muted leading-relaxed">
							Hệ thống đã gửi email khôi phục mật khẩu tới địa chỉ <strong className="text-brand-dark">{email}</strong>. Vui lòng kiểm tra hòm thư (bao gồm cả thư rác / Spam).
						</p>
						<button
							onClick={() => setIsSubmitted(false)}
							className="text-xs font-bold text-brand-primary-deep hover:underline cursor-pointer border-none bg-transparent"
						>
							Thử lại với email khác
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<p className="text-xs text-brand-muted leading-relaxed font-semibold">
							Nhập email đăng ký của bạn. Chúng tôi sẽ gửi liên kết khôi phục mật khẩu bảo mật qua hệ thống MailKit.
						</p>

						<div className="space-y-1.5">
							<label className="text-xs font-extrabold text-brand-dark uppercase tracking-wider block">
								Địa Chỉ Email
							</label>
							<div className="relative">
								<Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="nguyenvana@gmail.com"
									className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 bg-brand-dark hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
						>
							{isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
							{isLoading ? "Đang Gửi Email..." : "Gửi Yêu Cầu Khôi Phục"}
						</button>
					</form>
				)}

				<div className="pt-4 border-t border-brand-border/60 text-center">
					<Link
						to="/login"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-dark transition-colors"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						<span>Quay lại trang Đăng nhập</span>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default ForgotPasswordPage;
