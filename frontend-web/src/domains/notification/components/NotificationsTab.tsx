import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Bell,
	CheckCheck,
	ArrowLeft,
	CreditCard,
	Package,
	ShieldAlert,
	Sparkles,
	Wallet,
	Clock,
	CheckCircle2,
	AlertCircle,
	ExternalLink,
	Loader2,
	ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationDto } from "../types/notification.types";

interface NotificationsTabProps {
	initialNotificationId?: string | null;
}

type FilterCategory = "all" | "orders" | "payments" | "security";

export function NotificationsTab({ initialNotificationId }: NotificationsTabProps) {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, isMarkingAll } =
		useNotifications();

	const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
	const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);

	// Load notification from URL query if ?id= is present
	useEffect(() => {
		const notiId = searchParams.get("id") || initialNotificationId;
		if (notiId && notifications.length > 0) {
			const found = notifications.find((n) => String(n.id) === String(notiId));
			if (found) {
				setSelectedNotification(found);
				if (!found.isRead) {
					markAsRead(found.id);
				}
			}
		} else if (!notiId) {
			setSelectedNotification(null);
		}
	}, [searchParams, notifications, initialNotificationId, markAsRead]);

	// Filter notifications by category
	const filteredNotifications = notifications.filter((item) => {
		if (selectedCategory === "all") return true;
		const type = item.type?.toLowerCase() || "";
		if (selectedCategory === "orders") {
			return (
				type.includes("order") ||
				type.includes("suborder") ||
				type.includes("ship") ||
				type.includes("refund")
			);
		}
		if (selectedCategory === "payments") {
			return (
				type.includes("payment") ||
				type.includes("withdrawal") ||
				type.includes("wallet")
			);
		}
		if (selectedCategory === "security") {
			return (
				type.includes("password") ||
				type.includes("device") ||
				type.includes("otp") ||
				type.includes("register") ||
				type.includes("auth")
			);
		}
		return true;
	});

	const handleSelectNotification = (noti: NotificationDto) => {
		setSelectedNotification(noti);
		if (!noti.isRead) {
			markAsRead(noti.id);
		}
		setSearchParams({ tab: "notifications", id: String(noti.id) });
	};

	const handleBackToList = () => {
		setSelectedNotification(null);
		setSearchParams({ tab: "notifications" });
	};

	const handleMarkAllRead = () => {
		if (unreadCount === 0) return;
		markAllAsRead(undefined, {
			onSuccess: () => {
				toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
			},
			onError: () => {
				toast.error("Không thể đánh dấu đã đọc. Vui lòng thử lại!");
			},
		});
	};

	// Format relative or date time
	const formatDateTime = (dateStr: string) => {
		if (!dateStr) return "";
		try {
			const date = new Date(dateStr);
			const now = new Date();
			const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

			if (diffHours < 1) {
				const diffMins = Math.max(1, Math.floor((now.getTime() - date.getTime()) / (1000 * 60)));
				return `${diffMins} phút trước`;
			}
			if (diffHours < 24) {
				return `${diffHours} giờ trước`;
			}
			if (diffHours < 48) {
				return "Hôm qua";
			}
			return date.toLocaleDateString("vi-VN", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return dateStr;
		}
	};

	// Icon and theme config helper
	const getNotificationTheme = (type?: string) => {
		const t = type?.toLowerCase() || "";
		if (t.includes("payment") || t.includes("withdrawal") || t.includes("wallet")) {
			return {
				icon: CreditCard,
				badge: "Thanh toán & Ví",
				badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
				iconBg: "bg-emerald-100 text-emerald-600",
				borderAccent: "border-emerald-500",
			};
		}
		if (t.includes("order") || t.includes("ship") || t.includes("suborder") || t.includes("refund")) {
			return {
				icon: Package,
				badge: "Đơn hàng",
				badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
				iconBg: "bg-blue-100 text-blue-600",
				borderAccent: "border-blue-500",
			};
		}
		if (t.includes("password") || t.includes("device") || t.includes("auth") || t.includes("otp")) {
			return {
				icon: ShieldAlert,
				badge: "Bảo mật tài khoản",
				badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
				iconBg: "bg-amber-100 text-amber-600",
				borderAccent: "border-amber-500",
			};
		}
		return {
			icon: Bell,
			badge: "Hệ thống",
			badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
			iconBg: "bg-slate-100 text-slate-600",
			borderAccent: "border-brand-primary",
		};
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-brand-muted text-xs font-bold">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				<span>Đang tải danh sách thông báo...</span>
			</div>
		);
	}

	// ==========================================
	// DETAIL VIEW
	// ==========================================
	if (selectedNotification) {
		const theme = getNotificationTheme(selectedNotification.type);
		const IconComponent = theme.icon;
		const typeStr = selectedNotification.type?.toLowerCase() || "";

		return (
			<div className="space-y-6 font-sans text-left">
				{/* Back Button & Header */}
				<div className="flex items-center justify-between pb-4 border-b border-brand-border">
					<button
						onClick={handleBackToList}
						className="inline-flex items-center gap-2 text-xs font-black text-brand-dark hover:text-brand-primary-deep transition-colors cursor-pointer group"
					>
						<ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
						<span>Quay lại danh sách thông báo</span>
					</button>

					<span className="text-[11px] font-bold text-brand-muted flex items-center gap-1.5">
						<Clock className="w-3.5 h-3.5" />
						{formatDateTime(selectedNotification.createdAt)}
					</span>
				</div>

				{/* Detail Card */}
				<div className="bg-white border border-brand-border rounded-lg p-6 shadow-sm space-y-6">
					{/* Category Badge & Title */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${theme.badgeBg}`}
							>
								<IconComponent className="w-3.5 h-3.5" />
								{theme.badge}
							</span>
							{selectedNotification.referenceId && (
								<span className="text-[11px] font-bold text-brand-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
									Mã tham chiếu: #{selectedNotification.referenceId}
								</span>
							)}
						</div>
						<h1 className="text-lg font-black text-brand-dark leading-snug">
							{selectedNotification.title}
						</h1>
					</div>

					{/* Body Content */}
					<div className="p-4 bg-brand-light-soft/70 border border-brand-border rounded-md text-xs font-medium text-brand-dark leading-relaxed whitespace-pre-line">
						{selectedNotification.body}
					</div>

					{/* Contextual Rich Views depending on Notification Type */}
					{typeStr.includes("payment") && (
						<div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-md space-y-3">
							<div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
								<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
								<span>Chi tiết giao dịch thanh toán thành công</span>
							</div>
							<p className="text-[11px] text-emerald-700 leading-relaxed font-bold">
								Khoản thanh toán cho đơn hàng của bạn đã được đối soát và ghi nhận thành công. Đơn hàng đang được tự động chuyển cho người bán để đóng gói và vận chuyển.
							</p>
							<div className="pt-2 flex flex-wrap gap-2">
								<button
									onClick={() => navigate("/profile?tab=orders")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded shadow-sm transition-colors cursor-pointer"
								>
									<ShoppingBag className="w-3.5 h-3.5" />
									Xem đơn hàng của tôi
								</button>
							</div>
						</div>
					)}

					{(typeStr.includes("suborder") || typeStr.includes("order") || typeStr.includes("ship")) && (
						<div className="p-4 bg-blue-50/70 border border-blue-200 rounded-md space-y-3">
							<div className="flex items-center gap-2 text-blue-800 font-black text-xs">
								<Package className="w-4 h-4 text-blue-600 shrink-0" />
								<span>Tiến trình xử lý & vận chuyển đơn hàng</span>
							</div>
							<p className="text-[11px] text-blue-700 leading-relaxed font-bold">
								Bạn có thể theo dõi hành trình đơn hàng, xem mã vận đơn GHN cũng như thông tin kiện hàng chi tiết trong trang quản lý đơn hàng.
							</p>
							<div className="pt-2 flex flex-wrap gap-2">
								<button
									onClick={() => navigate("/profile?tab=orders")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded shadow-sm transition-colors cursor-pointer"
								>
									<ExternalLink className="w-3.5 h-3.5" />
									Kiểm tra trạng thái đơn hàng
								</button>
							</div>
						</div>
					)}

					{typeStr.includes("withdrawal") && (
						<div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-md space-y-3">
							<div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
								<Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
								<span>Giải ngân tiền về tài khoản ngân hàng</span>
							</div>
							<p className="text-[11px] text-emerald-700 leading-relaxed font-bold">
								Yêu cầu rút tiền của bạn đã được ban quản trị xét duyệt và chuyển khoản thành công. Vui lòng kiểm tra tài khoản ngân hàng thụ hưởng hoặc kiểm tra lịch sử biến động số dư trong ví.
							</p>
							<div className="pt-2 flex flex-wrap gap-2">
								<button
									onClick={() => navigate("/profile?tab=wallet")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded shadow-sm transition-colors cursor-pointer"
								>
									<Wallet className="w-3.5 h-3.5" />
									Quản lý ví & giao dịch
								</button>
							</div>
						</div>
					)}

					{(typeStr.includes("password") || typeStr.includes("device")) && (
						<div className="p-4 bg-amber-50/70 border border-amber-200 rounded-md space-y-3">
							<div className="flex items-center gap-2 text-amber-800 font-black text-xs">
								<ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
								<span>Thông báo bảo mật quan trọng</span>
							</div>
							<p className="text-[11px] text-amber-700 leading-relaxed font-bold">
								Hệ thống đã tự động vô hiệu hóa các phiên đăng nhập cũ trên các thiết bị khác để bảo vệ an toàn cho tài khoản của bạn. Nếu không phải bạn thực hiện thao tác này, hãy đổi mật khẩu ngay lập tức!
							</p>
							<div className="pt-2 flex flex-wrap gap-2">
								<button
									onClick={() => navigate("/profile?tab=profile")}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded shadow-sm transition-colors cursor-pointer"
								>
									<ShieldAlert className="w-3.5 h-3.5" />
									Kiểm tra tài khoản & Đổi mật khẩu
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	// ==========================================
	// MASTER LIST VIEW
	// ==========================================
	return (
		<div className="space-y-6 font-sans text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
				<div>
					<h1 className="text-base font-black text-brand-dark flex items-center gap-2">
						<span>Thông báo của tôi</span>
						{unreadCount > 0 && (
							<span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
								{unreadCount} mới
							</span>
						)}
					</h1>
					<p className="text-xs text-brand-muted mt-0.5">
						Danh sách thông báo và cập nhật quan trọng trong 15 ngày gần nhất.
					</p>
				</div>

				<button
					onClick={handleMarkAllRead}
					disabled={unreadCount === 0 || isMarkingAll}
					className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer ${
						unreadCount > 0
							? "bg-brand-light-soft hover:bg-brand-primary/20 text-brand-dark border border-brand-border"
							: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
					}`}
				>
					<CheckCheck className="w-4 h-4 text-brand-primary-deep" />
					<span>Đánh dấu tất cả đã đọc</span>
				</button>
			</div>

			{/* Category Filter Tabs */}
			<div className="flex flex-wrap gap-2 pb-1">
				<button
					onClick={() => setSelectedCategory("all")}
					className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
						selectedCategory === "all"
							? "bg-brand-dark text-white shadow-sm"
							: "bg-slate-100 text-brand-muted hover:bg-slate-200 hover:text-brand-dark"
					}`}
				>
					Tất cả ({notifications.length})
				</button>
				<button
					onClick={() => setSelectedCategory("orders")}
					className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
						selectedCategory === "orders"
							? "bg-blue-600 text-white shadow-sm"
							: "bg-slate-100 text-brand-muted hover:bg-slate-200 hover:text-brand-dark"
					}`}
				>
					Đơn hàng
				</button>
				<button
					onClick={() => setSelectedCategory("payments")}
					className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
						selectedCategory === "payments"
							? "bg-emerald-600 text-white shadow-sm"
							: "bg-slate-100 text-brand-muted hover:bg-slate-200 hover:text-brand-dark"
					}`}
				>
					Thanh toán & Ví
				</button>
				<button
					onClick={() => setSelectedCategory("security")}
					className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
						selectedCategory === "security"
							? "bg-amber-600 text-white shadow-sm"
							: "bg-slate-100 text-brand-muted hover:bg-slate-200 hover:text-brand-dark"
					}`}
				>
					Bảo mật & Tài khoản
				</button>
			</div>

			{/* List of Notifications */}
			{filteredNotifications.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-brand-light-soft/40 border border-brand-border rounded-lg">
					<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-brand-muted">
						<Bell className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<p className="text-xs font-black text-brand-dark">Không có thông báo nào</p>
						<p className="text-[11px] text-brand-muted">
							Bạn không có thông báo nào thuộc danh mục này trong 15 ngày qua.
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-2.5">
					{filteredNotifications.map((item) => {
						const theme = getNotificationTheme(item.type);
						const IconComponent = theme.icon;

						return (
							<div
								key={item.id}
								onClick={() => handleSelectNotification(item)}
								className={`group relative flex items-start gap-3.5 p-4 rounded-lg border transition-all cursor-pointer ${
									!item.isRead
										? "bg-amber-50/30 border-amber-200/80 shadow-xs hover:bg-amber-50/60"
										: "bg-white border-brand-border hover:bg-brand-light-soft/60 hover:border-slate-300"
								}`}
							>
								{/* Left Icon */}
								<div
									className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg}`}
								>
									<IconComponent className="w-4 h-4" />
								</div>

								{/* Content Body */}
								<div className="flex-1 min-w-0 space-y-1">
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2 flex-wrap">
											<span
												className={`px-2 py-0.5 rounded text-[10px] font-black border ${theme.badgeBg}`}
											>
												{theme.badge}
											</span>
											<h3
												className={`text-xs font-black truncate ${
													!item.isRead ? "text-brand-dark font-extrabold" : "text-slate-700"
												}`}
											>
												{item.title}
											</h3>
										</div>

										<span className="text-[10px] text-brand-muted font-bold whitespace-nowrap">
											{formatDateTime(item.createdAt)}
										</span>
									</div>

									<p className="text-xs text-brand-muted line-clamp-2 leading-relaxed font-normal">
										{item.body}
									</p>
								</div>

								{/* Unread indicator dot */}
								{!item.isRead && (
									<div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 self-center" />
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
