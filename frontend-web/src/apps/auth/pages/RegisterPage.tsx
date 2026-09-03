import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/domains/auth";
import { Terminal, Eye, EyeOff } from "lucide-react";

const registerSchema = z
	.object({
		email: z.string().email({ message: "Email không đúng định dạng" }),
		lastName: z.string().min(1, { message: "Họ và tên đệm là bắt buộc" }),
		firstName: z.string().min(1, { message: "Tên là bắt buộc" }),
		password: z
			.string()
			.min(6, { message: "Mật khẩu phải tối thiểu 6 ký tự" }),
		confirmPassword: z
			.string()
			.min(6, { message: "Xác nhận mật khẩu là bắt buộc" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Mật khẩu xác nhận không trùng khớp",
		path: ["confirmPassword"],
	});

type SignUpFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpFormValues>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: SignUpFormValues) => {
		setErrorMsg(null);
		setSuccessMsg(null);
		try {
			const res = await authService.register(
				data.email,
				data.password,
				data.firstName,
				data.lastName,
			);
			if (res.isSuccess === false) {
				setErrorMsg(
					res.error?.message ||
						"Đã xảy ra lỗi trong quá trình tạo tài khoản.",
				);
				return;
			}
			setSuccessMsg("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
			setTimeout(() => {
				navigate("/login");
			}, 1500);
		} catch (err: any) {
			setErrorMsg(
				err.response?.data ||
					err.response?.data?.message ||
					"Đã xảy ra lỗi trong quá trình tạo tài khoản.",
			);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-8 font-sans">
			<div className="w-full max-w-4xl bg-white border border-brand-border rounded-lg shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch">
				{/* Left column: Signup Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					autoComplete="off"
					className="p-8 flex flex-col justify-center space-y-4 text-left"
				>
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-brand-dark tracking-tight">
							Thành lập tài khoản
						</h1>
						<p className="text-xs text-brand-muted">
							Tham gia thế giới Supabaze Store ngay hôm nay
						</p>
					</div>

					{errorMsg && (
						<div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
							{errorMsg}
						</div>
					)}

					{successMsg && (
						<div className="p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
							{successMsg}
						</div>
					)}

					<div className="space-y-3">
						<div>
							<label className="block text-xs font-bold text-brand-dark mb-1">
								Email nhận tin
							</label>
							<input
								type="email"
								placeholder="name@example.com"
								autoComplete="off"
								{...register("email")}
								className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
							/>
							{errors.email && (
								<span className="text-[10px] text-red-500 mt-1 block">
									{errors.email.message}
								</span>
							)}
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-xs font-bold text-brand-dark mb-1">
									Họ & Tên đệm
								</label>
								<input
									type="text"
									placeholder="Nguyễn Văn"
									autoComplete="off"
									{...register("lastName")}
									className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
								/>
								{errors.lastName && (
									<span className="text-[10px] text-red-500 mt-1 block">
										{errors.lastName.message}
									</span>
								)}
							</div>
							<div>
								<label className="block text-xs font-bold text-brand-dark mb-1">
									Tên
								</label>
								<input
									type="text"
									placeholder="An"
									autoComplete="off"
									{...register("firstName")}
									className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
								/>
								{errors.firstName && (
									<span className="text-[10px] text-red-500 mt-1 block">
										{errors.firstName.message}
									</span>
								)}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-xs font-bold text-brand-dark mb-1">
									Mật khẩu
								</label>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										placeholder="••••••••"
										autoComplete="new-password"
										{...register("password")}
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
								{errors.password && (
									<span className="text-[10px] text-red-500 mt-1 block">
										{errors.password.message}
									</span>
								)}
							</div>
							<div>
								<label className="block text-xs font-bold text-brand-dark mb-1">
									Xác nhận lại
								</label>
								<div className="relative">
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder="••••••••"
										autoComplete="new-password"
										{...register("confirmPassword")}
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
								{errors.confirmPassword && (
									<span className="text-[10px] text-red-500 mt-1 block">
										{errors.confirmPassword.message}
									</span>
								)}
							</div>
						</div>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-2.5 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
					>
						{isSubmitting ? (
							<>
								<div className="w-3.5 h-3.5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin"></div>
								Đang tạo tài khoản...
							</>
						) : (
							"Đăng ký tài khoản"
						)}
					</button>

					<p className="text-center text-xs text-brand-muted pt-1">
						Đã có tài khoản?{" "}
						<Link
							to="/login"
							className="text-brand-primary hover:underline font-semibold"
						>
							Đăng nhập
						</Link>
					</p>
				</form>

				{/* Right column: Graphic/Cover page */}
				<div className="hidden md:flex bg-brand-dark-surface p-8 relative overflow-hidden flex-col justify-between text-left border-l border-brand-border">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl -z-0"></div>

					<div className="relative z-10 space-y-2">
						<span className="text-[10px] font-black text-brand-primary tracking-widest uppercase flex items-center gap-1.5">
							⚡ BUUSTORE
						</span>
						<h3 className="text-2xl font-black text-white leading-tight tracking-tight">
							Ký danh để vào bình nguyên vô tận.
						</h3>
					</div>

					{/* Code block decoration */}
					<div className="relative z-10 my-6 rounded border border-brand-dark-lift bg-black/40 p-4 font-mono text-[10px] text-gray-300 space-y-2">
						<span className="text-brand-primary flex items-center gap-1">
							<Terminal className="w-3.5 h-3.5" /> register.py
						</span>
						<p className="text-green-400">
							new_user = create_user_account()
						</p>
						<p className="text-gray-500">
							# Tạo cấu trúc token và gửi OTP (Mặc định: 123456)
						</p>
						<p className="text-brand-primary-soft">
							send_activation_code(email=new_user.email)
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
