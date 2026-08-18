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
	Wallet
} from "lucide-react";
import { useAuthStore } from "../features/auth/store";

export default function AdminLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuthStore();

	const handleLogout = () => {
		// Logic logout
		localStorage.removeItem("token");
		window.location.href = "/login";
	};

	const getSidebarLinkClass = (path: string) => {
		const isSelected = location.pathname.startsWith(path);
		return isSelected
			? "w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-bold text-brand-primary-deep bg-brand-primary/10 transition-colors cursor-pointer"
			: "w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer";
	};

	return (
		<div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">
			{/* ADMIN HEADER */}
			<header className="sticky top-0 z-50 w-full h-14 bg-white border-b border-brand-border px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				<div className="flex items-center gap-4">
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
							<span className="bg-red-500 text-white font-extrabold text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-normal">
								System
							</span>
						</span>
					</Link>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left">
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
						className="text-brand-muted hover:text-red-600 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
					>
						<LogOut className="w-3.5 h-3.5" />
						Đăng xuất
					</button>
				</div>
			</header>

			{/* BODY WORKSPACE */}
			<div className="flex-1 flex overflow-hidden">
				{/* ADMIN SIDEBAR */}
				<aside className="w-64 bg-white border-r border-brand-border flex flex-col shrink-0 overflow-y-auto p-4 select-none animate-in fade-in duration-200">
					<div className="px-3 text-[10px] font-black text-brand-muted uppercase tracking-wider mb-2">
						Menu hệ thống
					</div>
					<nav className="space-y-1.5">
						<Link to="/admin/products" className={getSidebarLinkClass("/admin/products")}>
							<ShoppingBag className="w-4 h-4 text-brand-muted" />
							<span>Quản lý sản phẩm</span>
						</Link>
						<Link to="/admin/orders" className={getSidebarLinkClass("/admin/orders")}>
							<Package className="w-4 h-4 text-brand-muted" />
							<span>Quản lý đơn hàng</span>
						</Link>
						<Link to="/admin/refunds" className={getSidebarLinkClass("/admin/refunds")}>
							<ArrowLeftRight className="w-4 h-4 text-brand-muted" />
							<span>Các yêu cầu hoàn tiền</span>
						</Link>
						<Link to="/admin/categories" className={getSidebarLinkClass("/admin/categories")}>
							<FolderTree className="w-4 h-4 text-brand-muted" />
							<span>Quản lý Category</span>
						</Link>
						<Link to="/admin/users" className={getSidebarLinkClass("/admin/users")}>
							<Users className="w-4 h-4 text-brand-muted" />
							<span>Quản lý người dùng</span>
						</Link>
						<Link to="/admin/shops" className={getSidebarLinkClass("/admin/shops")}>
							<Store className="w-4 h-4 text-brand-muted" />
							<span>Quản lý Shop</span>
						</Link>
						<Link to="/admin/vouchers" className={getSidebarLinkClass("/admin/vouchers")}>
							<Ticket className="w-4 h-4 text-brand-muted" />
							<span>Quản lý Voucher</span>
						</Link>
						<Link to="/admin/wallets" className={getSidebarLinkClass("/admin/wallets")}>
							<Wallet className="w-4 h-4 text-brand-muted" />
							<span>Quản lý ví</span>
						</Link>
					</nav>
				</aside>

				{/* ADMIN CONTENT */}
				<main className="flex-1 overflow-y-auto p-3 flex flex-col">
					<div className="flex-1 bg-white border border-brand-border rounded-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
