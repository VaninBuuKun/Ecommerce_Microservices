import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService, useAuthStore } from "@/domains/auth";
import { Terminal, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { checkIsAdmin } from "@/shared/utils/authHelper";

interface FormValues {
	username: string;
	password: string;
}

export default function LoginPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const emailParam = searchParams.get("email") || "";
	const redirectParam = searchParams.get("redirect") || "/";

	const { accessToken, user, clearState } = useAuthStore();
	const [showPassword, setShowPassword] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		defaultValues: {
			username: emailParam,
			password: "",
		},
	});

	useEffect(() => {
		if (emailParam) {
			setValue("username", emailParam);
		}

		if (accessToken) {
			if (!emailParam || (user?.email && user.email.toLowerCase() === emailParam.toLowerCase())) {
				if (checkIsAdmin()) {
					navigate("/admin", { replace: true });
				} else {
					navigate(redirectParam, { replace: true });
				}
				return;
			}

			// Nếu đang login tài khoản khác với email trong link
			clearState();
			toast.info(`Chuyển sang đăng nhập tài khoản ${emailParam}`);
		}
	}, [accessToken, user, emailParam, redirectParam, navigate, clearState, setValue]);

	const onSubmit = async (data: FormValues) => {
		setErrorMsg(null);
		try {
			const res = await authService.login(data.username, data.password);
			if (res.isSuccess === false) {
				setErrorMsg(
					res.error?.message ||
						"Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.",
				);
				return;
			}
			if (checkIsAdmin()) {
				navigate("/admin");
			} else {
				navigate(redirectParam);
			}
		} catch (err: any) {
			setErrorMsg(
				err.response?.data ||
					"Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.",
			);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-8 font-sans">
			<div className="w-full max-w-4xl bg-white border border-brand-border rounded-lg shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch">
				{/* Left column: Login Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="p-8 flex flex-col justify-center space-y-4 text-left"
				>
					<div className="space-y-1">
						<h1 className="text-2xl font-bold text-brand-dark tracking-tight">
							Chào mừng trở lại
						</h1>
						<p className="text-xs text-brand-muted">
							Đăng nhập vào hệ thống để tiếp tục mua sắm
						</p>
					</div>

					{errorMsg && (
						<div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
							{errorMsg}
						</div>
					)}

					<div className="space-y-3">
						<div>
							<label className="block text-xs font-bold text-brand-dark mb-1">
								Email / Username
							</label>
							<input
								type="text"
								placeholder="m@example.com"
								{...register("username", {
									required: "Vui lòng điền Email/Username",
								})}
								className="w-full px-3 py-2 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
							/>
							{errors.username && (
								<span className="text-[10px] text-red-500 mt-1 block">
									{errors.username.message}
								</span>
							)}
						</div>

						<div>
							<div className="flex items-center justify-between mb-1">
								<label className="block text-xs font-bold text-brand-dark">
									Mật khẩu
								</label>
								<Link
									to="/forgot-password"
									className="text-xs text-brand-primary hover:underline font-medium"
								>
									Quên mật khẩu?
								</Link>
							</div>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									{...register("password", {
										required: "Vui lòng điền mật khẩu",
									})}
									className="w-full px-3 py-2 pr-10 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark p-1 cursor-pointer border-none bg-transparent"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
							{errors.password && (
								<span className="text-[10px] text-red-500 mt-1 block">
									{errors.password.message}
								</span>
							)}
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
								Đang xử lý...
							</>
						) : (
							"Đăng nhập"
						)}
					</button>

					<div className="relative flex items-center justify-center my-1">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-brand-border"></div>
						</div>
						<span className="relative bg-white px-3 text-[10px] text-brand-muted uppercase font-bold tracking-wider">
							Hoặc tiếp tục với
						</span>
					</div>

					{/* Social Logins */}
					<div className="grid grid-cols-2 gap-3">
						<button
							type="button"
							className="flex items-center justify-center gap-2 py-2 border border-brand-border rounded hover:bg-brand-light-soft text-xs font-bold text-brand-dark cursor-pointer"
						>
							Google
						</button>
						<button
							type="button"
							className="flex items-center justify-center gap-2 py-2 border border-brand-border rounded hover:bg-brand-light-soft text-xs font-bold text-brand-dark cursor-pointer"
						>
							Apple
						</button>
					</div>

					<p className="text-center text-xs text-brand-muted pt-1">
						Chưa có tài khoản?{" "}
						<Link
							to="/register"
							className="text-brand-primary hover:underline font-semibold"
						>
							Đăng ký ngay
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
							Cửa ngõ dẫn tới bình nguyên vô tận.
						</h3>
					</div>

					{/* Code block decoration */}
					<div className="relative z-10 my-6 rounded border border-brand-dark-lift bg-black/40 p-4 font-mono text-[10px] text-gray-300 space-y-2">
						<span className="text-brand-primary flex items-center gap-1">
							<Terminal className="w-3.5 h-3.5" /> welcome.py
						</span>
						<p className="text-green-400">
							print("Chào mừng quay trở lại!")
						</p>
						<p className="text-gray-500">
							# Khởi tạo giỏ hàng và đồng bộ session
						</p>
						<p className="text-brand-primary-soft">
							init_customer_session(user_id="buu_store")
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
