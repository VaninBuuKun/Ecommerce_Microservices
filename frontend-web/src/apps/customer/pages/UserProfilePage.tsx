import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, MapPin, Package, CreditCard, ArrowLeftRight } from "lucide-react";
import { useAuthStore, AccountInfoTab } from "@/domains/auth";
import { ShippingAddressTab } from "@/domains/address";
import { MyOrdersTab, RefundRequestsTab } from "@/domains/order";
import { WalletTab } from "@/domains/wallet";

export default function UserProfilePage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, setUser } = useAuthStore();

	// Read tab query param, default to "profile"
	const params = new URLSearchParams(location.search);
	const initialTab =
		params.get("tab") ||
		(location.pathname === "/orders" ? "orders" : "profile");
	
	const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders" | "wallet" | "refunds">(
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
					<div className="flex items-center gap-3 p-4 bg-brand-light-soft border border-brand-border rounded-2xl">
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
					<div className="bg-white border border-brand-border rounded-2xl p-2.5 space-y-1 shadow-sm">
						<button
							onClick={() => {
								setActiveTab("profile");
								navigate("/profile?tab=profile");
							}}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === "profile"
									? "bg-brand-primary text-brand-dark"
									: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark"
							}`}
						>
							<User className="w-4 h-4" />
							Thông tin tài khoản
						</button>
						<button
							onClick={() => {
								setActiveTab("addresses");
								navigate("/profile?tab=addresses");
							}}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === "addresses"
									? "bg-brand-primary text-brand-dark"
									: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark"
							}`}
						>
							<MapPin className="w-4 h-4" />
							Địa chỉ nhận hàng
						</button>
						<button
							onClick={() => {
								setActiveTab("orders");
								navigate("/profile?tab=orders");
							}}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === "orders"
									? "bg-brand-primary text-brand-dark"
									: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark"
							}`}
						>
							<Package className="w-4 h-4" />
							Đơn hàng của tôi
						</button>
						<button
							onClick={() => {
								setActiveTab("wallet");
								navigate("/profile?tab=wallet");
							}}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === "wallet"
									? "bg-brand-primary text-brand-dark"
									: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark"
							}`}
						>
							<CreditCard className="w-4 h-4" />
							<span>Quản lý ví</span>
						</button>
						<button
							onClick={() => {
								setActiveTab("refunds");
								navigate("/profile?tab=refunds");
							}}
							className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
								activeTab === "refunds"
									? "bg-brand-primary text-brand-dark"
									: "text-brand-muted hover:bg-brand-light-soft hover:text-brand-dark"
							}`}
						>
							<ArrowLeftRight className="w-4 h-4" />
							Yêu cầu hoàn tiền
						</button>
					</div>
				</div>

				{/* CONTENT MAIN DISPLAY */}
				<div className="flex-1 bg-white border border-brand-border rounded-2xl p-6 shadow-sm min-h-[60vh]">
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
				</div>
			</div>
		</div>
	);
}
