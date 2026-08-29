import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

// USE_MOCK_DATA flag for fallback testing
const USE_MOCK_DATA = false;

export function ResetPasswordPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const tokenParam = searchParams.get("token") || "";
	const emailParam = searchParams.get("email") || "";

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword.length < 6) {
			toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Mật khẩu xác nhận không khớp!");
			return;
		}

		try {
			setIsLoading(true);
			if (USE_MOCK_DATA) {
				await new Promise((res) => setTimeout(res, 800));
			} else {
				await api.post("/identity/users/reset-password", {
					email: emailParam,
					token: tokenParam,
					newPassword,
				});
			}
			setIsSuccess(true);
			toast.success("Đặt lại mật khẩu thành công!");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra hoặc token đã hết hạn.";
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
						<Lock className="w-6 h-6 text-brand-primary-deep" />
					</div>
					<div>
						<h1 className="text-xl font-black text-brand-dark tracking-tight">Đặt Lại Mật Khẩu</h1>
						<p className="text-xs text-brand-muted font-bold">Nhập mật khẩu mới cho tài khoản</p>
					</div>
				</div>

				{isSuccess ? (
					<div className="space-y-4 text-center py-4">
						<CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
						<h3 className="text-base font-bold text-brand-dark">Đổi Mật Khẩu Thành Công!</h3>
						<p className="text-xs text-brand-muted leading-relaxed">
							Mật khẩu của bạn đã được cập nhật an toàn. Bạn có thể đăng nhập ngay với mật khẩu mới.
						</p>
						<button
							onClick={() => navigate("/login")}
							className="w-full py-3 bg-brand-dark hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border-none"
						>
							Đăng Nhập Ngay
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-xs font-extrabold text-brand-dark uppercase tracking-wider block">
								Mật Khẩu Mới
							</label>
							<div className="relative">
								<Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
								<input
									type={showPassword ? "text" : "password"}
									required
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Tối thiểu 6 ký tự"
									className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-extrabold text-brand-dark uppercase tracking-wider block">
								Xác Nhận Mật Khẩu Mới
							</label>
							<div className="relative">
								<Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
								<input
									type={showPassword ? "text" : "password"}
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Nhập lại mật khẩu mới"
									className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-brand-border rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 bg-brand-dark hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
						>
							{isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
							{isLoading ? "Đang Cập Nhật..." : "Lưu Mật Khẩu Mới"}
						</button>
					</form>
				)}

				<div className="pt-4 border-t border-brand-border/60 text-center">
					<Link
						to="/login"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-dark transition-colors"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						<span>Hủy & Quay lại Đăng nhập</span>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default ResetPasswordPage;
