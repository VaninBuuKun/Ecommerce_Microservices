import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
	ShoppingBag, 
	Package, 
	ArrowLeftRight, 
	FolderTree, 
	Users, 
	Store, 
	LogOut, 
	ShieldAlert, 
	Ticket, 
	Wallet, 
	Image as ImageIcon, 
	CreditCard, 
	Truck,
	Menu,
	X
} from "lucide-react";
import { useAuthStore, authApi } from "@/domains/auth";

export default function AdminLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuthStore();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = async () => {
		await authApi.logout();
		navigate("/login");
	};

	const getSidebarLinkClass = (path: string) => {
		const isSelected = location.pathname.startsWith(path);
		return isSelected
			? "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-brand-primary-deep bg-brand-primary/10 transition-colors cursor-pointer"
			: "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer";
	};

	const navItems = [
		{ to: "/admin/products", label: "Quản lý sản phẩm", icon: ShoppingBag },
		{ to: "/admin/banners", label: "Quản lý Banner", icon: ImageIcon },
		{ to: "/admin/orders", label: "Quản lý đơn hàng", icon: Package },
		{ to: "/admin/shipments", label: "Vận chuyển & Webhook", icon: Truck },
		{ to: "/admin/refunds", label: "Các yêu cầu hoàn tiền", icon: ArrowLeftRight },
		{ to: "/admin/categories", label: "Quản lý Category", icon: FolderTree },
		{ to: "/admin/users", label: "Quản lý người dùng", icon: Users },
		{ to: "/admin/shops", label: "Quản lý Shop", icon: Store },
		{ to: "/admin/kyc", label: "Quản lý KYC", icon: ShieldAlert },
		{ to: "/admin/vouchers", label: "Quản lý Voucher", icon: Ticket },
		{ to: "/admin/wallets", label: "Quản lý ví", icon: Wallet },
		{ to: "/admin/payment-methods", label: "Phương thức thanh toán", icon: CreditCard },
	];

	return (
		<div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">
			{/* ADMIN HEADER */}
			<header className="sticky top-0 z-50 w-full h-14 bg-white border-b border-brand-border px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				<div className="flex items-center gap-3">
					{/* Mobile Hamburger Toggle */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="p-1.5 rounded-md hover:bg-brand-light-soft text-brand-dark lg:hidden border-none bg-transparent cursor-pointer"
						aria-label="Toggle Navigation Menu"
					>
						{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
					</button>

					<Link to="/admin" className="flex items-center gap-2">
						<img
							src="/ecommerce-icon.png"
							alt="Logo"
							className="w-7 h-7 object-contain"
							onError={(e) => {
								(e.target as HTMLImageElement).src =
									"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
							}}
						/>
						<span className="text-xs font-black text-brand-dark tracking-wide uppercase flex items-center gap-1.5">
							Admin Portal
							<span className="bg-red-500 text-white font-extrabold text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-normal hidden sm:inline-block">
								System
							</span>
						</span>
					</Link>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					<div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-lg text-left">
						<img
							src={user?.avatarUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
							alt="Admin Avatar"
							className="w-6 h-6 rounded-full object-cover border border-brand-border"
						/>
						<div className="hidden sm:block text-left">
							<p className="font-bold text-brand-dark text-xs truncate max-w-30">
								{user?.lastName} {user?.firstName || "System Admin"}
							</p>
							<p className="text-[9px] text-brand-muted font-bold">Quản trị viên</p>
						</div>
					</div>
					<div className="h-6 w-px bg-brand-border" />
					<button
						onClick={handleLogout}
						className="text-brand-muted hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer border-none bg-transparent"
					>
						<LogOut className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">Đăng xuất</span>
					</button>
				</div>
			</header>

			{/* BODY WORKSPACE */}
			<div className="flex-1 flex overflow-hidden relative">
				{/* MOBILE SIDEBAR DRAWER & BACKDROP */}
				{isMobileMenuOpen && (
					<div 
						className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-40 lg:hidden"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
				)}

				<aside 
					className={`fixed lg:static top-14 bottom-0 left-0 z-40 w-64 bg-white border-r border-brand-border flex flex-col shrink-0 overflow-y-auto p-4 select-none transition-transform duration-200 ease-in-out ${
						isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
					}`}
				>
					<div className="px-3 text-[10px] font-black text-brand-muted uppercase tracking-wider mb-2">
						Menu hệ thống
					</div>
					<nav className="space-y-1">
						{navItems.map((item) => {
							const IconComponent = item.icon;
							return (
								<Link
									key={item.to}
									to={item.to}
									onClick={() => setIsMobileMenuOpen(false)}
									className={getSidebarLinkClass(item.to)}
								>
									<IconComponent className="w-4 h-4 text-brand-muted shrink-0" />
									<span className="truncate">{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</aside>

				{/* ADMIN CONTENT */}
				<main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 flex flex-col w-full min-w-0">
					<div className="flex-1 bg-white border border-brand-border rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-3 sm:p-5 md:p-6 w-full min-w-0">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
