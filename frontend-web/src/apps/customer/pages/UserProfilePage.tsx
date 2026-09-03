import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, MapPin, Package, CreditCard, ArrowLeftRight, Bell } from "lucide-react";
import { useAuthStore, AccountInfoTab } from "@/domains/auth";
import { ShippingAddressTab } from "@/domains/address";
import { MyOrdersTab, RefundRequestsTab } from "@/domains/order";
import { WalletTab } from "@/domains/wallet";
import { NotificationsTab } from "@/domains/notification";

export default function UserProfilePage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, setUser } = useAuthStore();

	// Read tab query param, default to "profile"
	const params = new URLSearchParams(location.search);
	const initialTab =
		params.get("tab") ||
		(location.pathname === "/orders" ? "orders" : "profile");
	
	const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders" | "wallet" | "refunds" | "notifications">(
		initialTab as any,
	);

	// Sync tab selection with route / params changes
	useEffect(() => {
		const tab =
			params.get("tab") ||
			(location.pathname === "/orders" ? "orders" : "profile");
		setActiveTab(tab as any);
	}, [location.pathname, location.search]);

	return (
		<div className="max-w-6xl mx-auto px-4 py-8 font-sans text-left min-h-[75vh]">
			<div className="flex flex-col md:flex-row gap-6">
				{/* SIDEBAR */}
				<div className="w-full md:w-64 shrink-0 space-y-4">
					{/* Profile summary card */}
					<div className="flex items-center gap-3 p-4 bg-brand-light-soft border border-brand-border rounded-md">
						<div className="relative">
							<img
								src={
									user?.avatarUrl ||
									"https://cdn-icons-png.flaticon.com/512/149/149071.png"
								}
								alt="Avatar"
								className="w-12 h-12 rounded-full object-cover border border-brand-border"
							/>
						</div>
						<div className="min-w-0">
							<h3 className="text-sm font-black text-brand-dark truncate">
								{user?.lastName} {user?.firstName}
							</h3>
							<p className="text-[10px] text-brand-muted font-bold truncate">
								{user?.email}
							</p>
						</div>
					</div>

					{/* Navigation menus */}
					<div className="bg-white border border-brand-border rounded-md p-3 space-y-1.5 shadow-sm">
						<button
							onClick={() => {
								setActiveTab("profile");
								navigate("/profile?tab=profile");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "profile"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<User className={`w-4 h-4 ${activeTab === "profile" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Thông tin tài khoản</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("addresses");
								navigate("/profile?tab=addresses");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "addresses"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<MapPin className={`w-4 h-4 ${activeTab === "addresses" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Địa chỉ nhận hàng</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("orders");
								navigate("/profile?tab=orders");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "orders"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<Package className={`w-4 h-4 ${activeTab === "orders" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Đơn hàng của tôi</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("wallet");
								navigate("/profile?tab=wallet");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "wallet"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<CreditCard className={`w-4 h-4 ${activeTab === "wallet" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Quản lý ví</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("refunds");
								navigate("/profile?tab=refunds");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "refunds"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<ArrowLeftRight className={`w-4 h-4 ${activeTab === "refunds" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Yêu cầu hoàn tiền</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("notifications");
								navigate("/profile?tab=notifications");
							}}
							className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
								activeTab === "notifications"
									? "text-brand-primary-deep bg-brand-primary/10"
									: "text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft"
							}`}
						>
							<Bell className={`w-4 h-4 ${activeTab === "notifications" ? "text-brand-primary-deep" : "text-brand-muted"}`} />
							<span>Thông báo</span>
						</button>
					</div>
				</div>

				{/* CONTENT MAIN DISPLAY */}
				<div className="flex-1 bg-white border border-brand-border rounded-md p-6 shadow-sm min-h-[60vh]">
					{activeTab === "profile" && (
						<AccountInfoTab user={user} setUser={setUser} />
					)}
					{activeTab === "addresses" && (
						<ShippingAddressTab />
					)}
					{activeTab === "orders" && (
						<MyOrdersTab customerId={user?.id ? Number(user.id) : undefined} />
					)}
					{activeTab === "wallet" && (
						<WalletTab />
					)}
					{activeTab === "refunds" && (
						<RefundRequestsTab />
					)}
					{activeTab === "notifications" && (
						<NotificationsTab initialNotificationId={params.get("id")} />
					)}
				</div>
			</div>
		</div>
	);
}
