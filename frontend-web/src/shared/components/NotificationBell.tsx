import { useState, useEffect } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { api } from "@/core";
import { toast } from "react-toastify";

// USE_MOCK_DATA flag for fallback testing
const USE_MOCK_DATA = false;

interface NotificationItem {
	id: string;
	title: string;
	body: string;
	type: string;
	isRead: boolean;
	createdAt: string;
}

export function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchNotifications = async () => {
		try {
			setIsLoading(true);
			if (USE_MOCK_DATA) {
				await new Promise((res) => setTimeout(res, 300));
				setNotifications([
					{
						id: "1",
						title: "Đơn hàng mới #SUB1002",
						body: "Đơn hàng của bạn đang được người bán chuẩn bị đóng gói.",
						type: "OrderShipped",
						isRead: false,
						createdAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Thanh toán thành công",
						body: "Bạn đã thanh toán thành công 510.000đ qua VNPay.",
						type: "PaymentSucceeded",
						isRead: true,
						createdAt: new Date(Date.now() - 3600000).toISOString(),
					},
				]);
			} else {
				const res = await api.get("/notifications");
				const data = res.data?.value || res.data || [];
				setNotifications(Array.isArray(data) ? data : []);
			}
		} catch (err: any) {
			console.error("Lỗi khi tải thông báo:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchNotifications();
	}, []);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const handleMarkAsRead = async (id: string) => {
		try {
			if (!USE_MOCK_DATA) {
				await api.put(`/notifications/${id}/read`);
			}
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
			);
		} catch (err: any) {
			toast.error("Không thể cập nhật trạng thái thông báo.");
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			if (!USE_MOCK_DATA) {
				await api.put("/notifications/read-all");
			}
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
			toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
		} catch (err: any) {
			toast.error("Không thể đánh dấu tất cả là đã đọc.");
		}
	};

	return (
		<div className="relative">
			{/* Bell Trigger Button */}
			<button
				onClick={() => {
					setIsOpen(!isOpen);
					if (!isOpen) fetchNotifications();
				}}
				className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer border-none bg-transparent"
				title="Thông báo"
			>
				<Bell className="w-5 h-5 text-brand-dark" />
				{unreadCount > 0 && (
					<span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown Panel */}
			{isOpen && (
				<>
					{/* Overlay background to close */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					<div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-brand-border rounded-2xl shadow-2xl z-50 overflow-hidden text-left font-sans animate-in fade-in zoom-in-95 duration-150">
						<div className="p-3.5 border-b border-brand-border flex items-center justify-between bg-slate-50">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
								<Bell className="w-4 h-4 text-brand-primary" />
								Thông Báo ({unreadCount} chưa đọc)
							</h3>
							{unreadCount > 0 && (
								<button
									onClick={handleMarkAllAsRead}
									className="text-[10px] font-bold text-brand-primary-deep hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
								>
									<CheckCheck className="w-3.5 h-3.5" />
									Đọc tất cả
								</button>
							)}
						</div>

						<div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
							{isLoading ? (
								<div className="py-8 text-center text-xs font-bold text-brand-muted flex flex-col items-center gap-2">
									<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
									Đang tải thông báo...
								</div>
							) : notifications.length === 0 ? (
								<div className="py-8 text-center text-xs font-bold text-brand-muted">
									Bạn chưa có thông báo nào.
								</div>
							) : (
								notifications.map((item) => (
									<div
										key={item.id}
										onClick={() => !item.isRead && handleMarkAsRead(item.id)}
										className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 ${
											!item.isRead ? "bg-brand-primary/5" : "bg-white"
										}`}
									>
										<div className="flex items-start justify-between gap-2 mb-1">
											<h4 className="text-xs font-black text-brand-dark leading-snug">
												{item.title}
											</h4>
											{!item.isRead && (
												<span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
											)}
										</div>
										<p className="text-[11px] text-brand-muted leading-relaxed line-clamp-2">
											{item.body}
										</p>
										<span className="text-[9px] text-slate-400 font-semibold mt-1.5 block">
											{new Date(item.createdAt).toLocaleString("vi-VN")}
										</span>
									</div>
								))
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export default NotificationBell;
