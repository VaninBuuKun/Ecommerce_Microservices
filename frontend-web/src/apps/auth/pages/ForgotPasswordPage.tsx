import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck, Terminal } from "lucide-react";
import { authService } from "@/domains/auth";
import { toast } from "react-toastify";

export function ForgotPasswordPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState<1 | 2>(1);
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// BƯỚC 1: Gửi mã OTP về email
	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedEmail = email.trim();
		if (!trimmedEmail || !trimmedEmail.includes("@")) {
			toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
			return;
		}

		try {
			setIsLoading(true);
			const res = await authService.forgotPassword(trimmedEmail);
			if (res.isSuccess === false) {
				toast.error(res.error?.message || "Không thể gửi yêu cầu mã OTP.");
				return;
			}
			setStep(2);
			toast.success("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi gửi yêu cầu.";
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	};

	// BƯỚC 2: Xác nhận OTP và đặt lại mật khẩu mới
	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedOtp = otp.trim();
		if (!trimmedOtp || trimmedOtp.length !== 6) {
			toast.error("Vui lòng nhập đúng mã OTP 6 chữ số!");
			return;
		}
		if (newPassword.length < 6) {
			toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự!");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("Mật khẩu xác nhận không khớp!");
			return;
		}

		try {
			setIsLoading(true);
			const res = await authService.resetPasswordWithOtp({
				email: email.trim(),
				otp: trimmedOtp,
				newPassword,
			});

			if (res.isSuccess === false) {
				toast.error(res.error?.message || "Đặt lại mật khẩu thất bại.");
				return;
			}

			setIsSuccess(true);
			toast.success("Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.response?.data || "Mã OTP không đúng hoặc đã hết hạn.";
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackToLogin = () => {
		setNewPassword("");
		setConfirmPassword("");
		navigate("/login");
	};

	const handleSwitchEmail = () => {
		setStep(1);
		setOtp("");
		setNewPassword("");
		setConfirmPassword("");
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-8 font-sans">
			<div className="w-full max-w-4xl bg-white border border-brand-border rounded shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch">
				{/* Left column: Form */}
				<div className="p-8 flex flex-col justify-center space-y-4 text-left">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-brand-dark tracking-tight">
							Quên mật khẩu
						</h1>
						<p className="text-xs text-brand-muted">
							Khôi phục quyền truy cập tài khoản của bạn
						</p>
					</div>

					{isSuccess ? (
						<div className="space-y-4 py-2">
							<div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
								<span>Đổi mật khẩu thành công cho tài khoản <strong>{email}</strong>.</span>
							</div>
							<Link
								to={`/login?email=${encodeURIComponent(email)}`}
								className="w-full py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded font-semibold text-xs transition-colors shadow-sm inline-block text-center cursor-pointer border-none"
							>
								Đăng nhập ngay
							</Link>
						</div>
					) : step === 1 ? (
						<form onSubmit={handleSendOtp} className="space-y-4" autoComplete="off">
							<p className="text-xs text-brand-muted leading-relaxed">
								Nhập email đăng ký của bạn. Hệ thống sẽ gửi mã OTP xác thực 6 chữ số về hòm thư để đặt lại mật khẩu.
							</p>

							<div>
								<label className="block text-xs font-bold text-brand-dark mb-1">
									Email nhận mã OTP
								</label>
								<div className="relative">
									<input
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="m@example.com"
										className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 border-none disabled:opacity-60"
							>
								{isLoading ? (
									<>
										<div className="w-3.5 h-3.5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin"></div>
										Đang gửi mã...
									</>
								) : (
									"Gửi mã xác thực OTP"
								)}
							</button>

							<p className="text-center text-xs text-brand-muted pt-2">
								Nhớ mật khẩu rồi?{" "}
								<Link
									to="/login"
									className="text-brand-primary hover:underline font-semibold"
								>
									Quay lại đăng nhập
								</Link>
							</p>
						</form>
					) : (
						<div>
							<form onSubmit={handleResetPassword} className="space-y-3" autoComplete="off">
								{/* 
									CRITICAL BROWSER CREDENTIAL FIX:
									Bổ sung trường ẩn username khai báo email. 
									Trình duyệt sẽ hiểu mật khẩu mới thuộc về Gmail, KHÔNG bị gán OTP làm username!
								*/}
								<input
									type="text"
									name="username"
									value={email}
									autoComplete="username"
									className="sr-only"
									tabIndex={-1}
									aria-hidden="true"
									readOnly
								/>

								<div className="p-2.5 bg-brand-light-soft border border-brand-border rounded text-xs flex items-center justify-between">
									<span className="text-brand-muted text-[11px]">Mã gửi đến: <strong className="text-brand-dark">{email}</strong></span>
									<button
										type="button"
										onClick={handleSwitchEmail}
										className="text-brand-primary text-[11px] font-bold hover:underline cursor-pointer border-none bg-transparent"
									>
										Đổi email
									</button>
								</div>

								<div>
									<label className="block text-xs font-bold text-brand-dark mb-1">
										Mã OTP 6 chữ số
									</label>
									<input
										type="text"
										name="one-time-code"
										inputMode="numeric"
										pattern="[0-9]*"
										maxLength={6}
										required
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
										placeholder="123456"
										autoComplete="one-time-code"
										data-lpignore="true"
										data-1p-ignore="true"
										className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs tracking-widest font-mono text-center font-bold focus:outline-none focus:border-brand-primary text-brand-dark"
									/>
								</div>

								<div>
									<label className="block text-xs font-bold text-brand-dark mb-1">
										Mật khẩu mới
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											name="new-password"
											autoComplete="new-password"
											required
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="••••••••"
											className="w-full px-3 py-2 pr-8 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-1.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark p-1 cursor-pointer border-none bg-transparent"
											tabIndex={-1}
										>
											{showPassword ? (
												<EyeOff className="w-3.5 h-3.5" />
											) : (
												<Eye className="w-3.5 h-3.5" />
											)}
										</button>
									</div>
								</div>

								<div>
									<label className="block text-xs font-bold text-brand-dark mb-1">
										Xác nhận mật khẩu
									</label>
									<div className="relative">
										<input
											type={showConfirmPassword ? "text" : "password"}
											name="confirm-password"
											autoComplete="new-password"
											required
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="••••••••"
											className="w-full px-3 py-2 pr-8 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-1.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark p-1 cursor-pointer border-none bg-transparent"
											tabIndex={-1}
										>
											{showConfirmPassword ? (
												<EyeOff className="w-3.5 h-3.5" />
											) : (
												<Eye className="w-3.5 h-3.5" />
											)}
										</button>
									</div>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 border-none disabled:opacity-60 mt-1"
								>
									{isLoading ? (
										<>
											<div className="w-3.5 h-3.5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin"></div>
											Đang xác thực...
										</>
									) : (
										"Xác nhận & Đổi mật khẩu"
									)}
								</button>
							</form>

							{/* 
								CRITICAL FIX: 
								Nút quay lại đăng nhập đặt NGOÀI thẻ form và dọn dẹp state mật khẩu khi click.
								Trình duyệt tuyệt đối không kích hoạt popup hỏi lưu credentials với mã OTP!
							*/}
							<div className="text-center pt-2">
								<button
									type="button"
									onClick={handleBackToLogin}
									className="text-xs text-brand-muted hover:text-brand-dark hover:underline cursor-pointer border-none bg-transparent"
								>
									← Quay lại đăng nhập
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Right column: Graphic/Cover page */}
				<div className="hidden md:flex bg-brand-dark-surface p-8 relative overflow-hidden flex-col justify-between text-left border-l border-brand-border">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl -z-0"></div>

					<div className="relative z-10 space-y-2">
						<span className="text-[10px] font-black text-brand-primary tracking-widest uppercase flex items-center gap-1.5">
							⚡ BUUSTORE
						</span>
						<h3 className="text-2xl font-black text-white leading-tight tracking-tight">
							Bảo mật tài khoản của bạn.
						</h3>
					</div>

					{/* Code block decoration */}
					<div className="relative z-10 my-6 rounded border border-brand-dark-lift bg-black/40 p-4 font-mono text-[10px] text-gray-300 space-y-2">
						<span className="text-brand-primary flex items-center gap-1">
							<Terminal className="w-3.5 h-3.5" /> reset_password.py
						</span>
						<p className="text-green-400">
							verify_security_token(user_id)
						</p>
						<p className="text-gray-500">
							# Gửi mã OTP xác thực tới hộp thư người dùng
						</p>
						<p className="text-brand-primary-soft">
							deliver_otp(method="email_smtp")
						</p>
					</div>

					<div className="relative z-10 text-[10px] text-brand-muted">
						© 2026 BuuStore Inc. Bảo lưu mọi quyền.
					</div>
				</div>
			</div>
		</div>
	);
}

export default ForgotPasswordPage;
