import { useState, useEffect, useRef } from "react";
import {
	Link,
	Outlet,
	useNavigate,
	useLocation,
	useParams,
} from "react-router-dom";
import Breadcrumb, { type BreadcrumbItem } from "../components/Breadcrumb";
import {
	Bell,
	ChevronDown,
	ChevronRight,
	ShoppingBag,
	Percent,
	Users,
	Wallet,
	BarChart3,
	Settings,
	Package,
	Plus,
	Menu,
	X,
} from "lucide-react";
import { useSellerStore, useSellerProfileQuery } from "@/domains/seller";
import { ChatBubbleButton } from "@/shared/components";
import { useNotifications } from "@/domains/notification";


export default function SellerLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { shopId } = useParams<{ shopId?: string }>();
	const { data: profile, isLoading } = useSellerProfileQuery();
	const { activeShop, setActiveShop } = useSellerStore();
	const requestedProfileRef = useRef(false);
	const shops = profile?.shops ?? [];

	const [showShopDropdown, setShowShopDropdown] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const isEditProductPage = location.pathname.includes("/products/edit");
	const [showNotificationDropdown, setShowNotificationDropdown] =
		useState(false);
	const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
		{
			product: true,
			order: true,
			discount: false,
			customer: false,
			wallet: false,
			report: false,
			settings: false,
		},
	);

	const currentDashboardSuffix = location.pathname.includes("/dashboard")
		? location.pathname.slice(
				location.pathname.indexOf("/dashboard") + "/dashboard".length,
			)
		: "";
	const resolvedShop =
		shops.find((shop: any) => Number(shop.id) === Number(shopId)) ?? activeShop ?? null;
	const resolvedShopId = resolvedShop?.id ? Number(resolvedShop.id) : null;
	const sellerBasePath = resolvedShopId
		? `/seller/${resolvedShopId}/dashboard`
		: "/seller/dashboard";
	const normalizedLocationPath = shopId
		? location.pathname.replace(`/seller/${shopId}`, "/seller")
		: location.pathname;

	useEffect(() => {
		if (requestedProfileRef.current) return;

		if (!shops.length && !activeShop && !isLoading) {
			requestedProfileRef.current = true;
		}
	}, [shops.length, activeShop, isLoading]);

	useEffect(() => {
		if (isLoading) return;

		if (shopId) {
			if (shops.length > 0) {
				const matchedShop = shops.find(
					(shop: any) => String(shop.id) === shopId,
				);

				if (matchedShop && activeShop?.id !== matchedShop.id) {
					setActiveShop(matchedShop);
					return;
				}
				if (!matchedShop) {
					navigate("/seller", { replace: true });
				}
			} else if (requestedProfileRef.current && !activeShop) {
				navigate("/seller", { replace: true });
			}
			return;
		}

		if (activeShop?.id) {
			const nextPath = `${sellerBasePath}${currentDashboardSuffix}`;
			if (location.pathname !== nextPath) {
				navigate(nextPath, { replace: true });
			}
			return;
		}

		if (shops.length > 0) {
			setActiveShop(shops[0]);
			return;
		}

		if (requestedProfileRef.current && !activeShop) {
			navigate("/seller", { replace: true });
		}
	}, [
		shopId,
		shops,
		activeShop,
		navigate,
		setActiveShop,
		location.pathname,
		sellerBasePath,
		currentDashboardSuffix,
		isLoading,
	]);

	const toggleExpand = (menuKey: string) => {
		setExpandedMenus((prev) => ({
			...prev,
			[menuKey]: !prev[menuKey],
		}));
	};

	const handleSwitchShop = (shop: any) => {
		setActiveShop(shop);
		setShowShopDropdown(false);
		navigate(`/seller/${shop.id}/dashboard${currentDashboardSuffix}`);
	};

	// Helper trả về style động cho sublink dựa theo URL active
	const getSubLinkClass = (path: string) => {
		const isSelected = normalizedLocationPath === path;
		return isSelected
			? "block py-1 px-2 rounded text-[11px] font-bold text-brand-primary-deep bg-brand-primary/10 transition-colors"
			: "block py-1 px-2 rounded text-[11px] font-medium text-brand-muted hover:text-brand-primary-deep hover:bg-brand-primary/5 transition-colors";
	};

	const { notifications, unreadCount } = useNotifications();

	const getBreadcrumbItems = (): BreadcrumbItem[] => {
		const paths = location.pathname.split("/").filter(Boolean);
		const items: BreadcrumbItem[] = [
			{ label: "Người bán", path: sellerBasePath },
		];

		if (paths.includes("dashboard")) {
			items.push({ label: "Tổng quan" });
		} else if (paths.includes("products")) {
			if (paths.includes("edit")) {
				items.push({
					label: "Sản phẩm",
					path: `${sellerBasePath}/products/list`,
				});
				items.push({ label: "Chỉnh sửa" });
			} else {
				items.push({ label: "Quản lý sản phẩm" });
				if (paths.includes("list"))
					items.push({ label: "Danh sách sản phẩm" });
				else if (paths.includes("category"))
					items.push({ label: "Danh mục sản phẩm" });
			}
		} else if (paths.includes("orders")) {
			items.push({ label: "Quản lý đơn hàng" });
		} else {
			items.push({ label: "Tổng quan" });
		}

		return items;
	};

	if (isLoading && !resolvedShopId) {
		return (
			<div className="min-h-screen bg-brand-light-soft flex items-center justify-center font-sans">
				<div className="flex flex-col items-center gap-3 text-brand-muted text-xs">
					<div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
					Đang tải dữ liệu shop...
				</div>
			</div>
		);
	}

	if (!resolvedShop) return null;

	return (
		<div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">
			{/* HEADER NGƯỜI BÁN */}
			<header className="sticky top-0 z-50 w-full h-14 bg-white border-b border-brand-border px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
				<div className="flex items-center gap-3 sm:gap-4 min-w-0">
					{!isEditProductPage && (
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="p-1.5 rounded-md hover:bg-brand-light-soft text-brand-dark lg:hidden border-none bg-transparent cursor-pointer"
							aria-label="Toggle Seller Navigation Menu"
						>
							{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
						</button>
					)}
					<Link to="/" className="flex items-center h-8 shrink-0">
						<img
							src="/ecommerce-icon.png"
							alt="Logo"
							className="w-7 h-7 object-contain"
							onError={(e) => {
								(e.target as HTMLImageElement).src =
									"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
							}}
						/>
					</Link>
					<div className="h-4 w-px bg-brand-border hidden sm:block" />
					<div className="hidden sm:block truncate">
						<Breadcrumb items={getBreadcrumbItems()} />
					</div>
				</div>

				<div className="flex items-center gap-2 sm:gap-3">
					{/* Notifications */}
					<div
						className="relative flex items-center"
						onMouseEnter={() => setShowNotificationDropdown(true)}
						onMouseLeave={() => setShowNotificationDropdown(false)}
					>
						<button className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent">
							<Bell className="w-4.5 h-4.5" />
							{unreadCount > 0 && (
								<span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
									{unreadCount > 9 ? "9+" : unreadCount}
								</span>
							)}
						</button>

						{showNotificationDropdown && (
							<div className="absolute right-0 top-full pt-1.5 w-80 z-50">
								<div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
									<span className="block text-xs font-bold text-brand-dark border-b border-brand-border pb-2 mb-2">
										Thông báo mới nhận
									</span>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{notifications.length === 0 ? (
											<div className="py-6 text-center text-xs text-brand-muted font-medium">
												Chưa có thông báo mới nào
											</div>
										) : (
											notifications.map((notif: any) => (
												<div
													key={notif.id}
													className={`p-2 rounded text-xs transition-colors ${notif.isRead ? "bg-transparent" : "bg-brand-light-soft border-l-2 border-brand-primary"}`}
												>
													<div className="flex justify-between items-start mb-0.5">
														<h4 className="font-bold text-brand-dark">
															{notif.title}
														</h4>
														<span className="text-[9px] text-brand-muted shrink-0">
															{notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
														</span>
													</div>
													<p className="text-brand-muted text-[11px] leading-snug">
														{notif.body || notif.content}
													</p>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="h-6 w-px bg-brand-border" />

					{/* Shop Switcher */}
					<div
						className="relative"
						onMouseEnter={() => setShowShopDropdown(true)}
						onMouseLeave={() => setShowShopDropdown(false)}
					>
						<button className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-brand-light-soft transition-colors cursor-pointer text-left border-none bg-transparent">
							<img
								src={resolvedShop.logoUrl}
								alt={resolvedShop.name}
								className="w-6 h-6 rounded-full object-cover border border-brand-border"
								onError={(e) => {
									(e.target as HTMLImageElement).src =
										"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
								}}
							/>
							<span className="text-xs font-bold text-brand-dark max-w-24 sm:max-w-30 truncate">
								{resolvedShop.name}
							</span>
							<ChevronDown className="w-3.5 h-3.5 text-brand-muted shrink-0" />
						</button>

						{showShopDropdown && (
							<div className="absolute right-0 top-full pt-1.5 w-60 z-50">
								<div className="bg-white border border-brand-border rounded-xl shadow-xl p-2 text-left">
									<div className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-brand-border pb-1.5">
										Cửa hàng của tôi
									</div>

									<div className="space-y-0.5 max-h-48 overflow-y-auto mb-1">
										{shops.map((shop: any) => (
											<button
												key={shop.id}
												onClick={() =>
													handleSwitchShop(shop)
												}
												className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs text-left cursor-pointer transition-colors ${resolvedShop.id === shop.id ? "bg-brand-primary/10 text-brand-primary-deep font-bold" : "hover:bg-brand-light-soft text-brand-dark"}`}
											>
												<img
													src={shop.logoUrl}
													alt={shop.name}
													className="w-5 h-5 rounded-full object-cover border border-brand-border"
													onError={(e) => {
														(
															e.target as HTMLImageElement
														).src =
															"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
													}}
												/>
												<span className="truncate flex-1">
													{shop.name}
												</span>
											</button>
										))}
									</div>

									<div className="border-t border-brand-border pt-1">
										<button
											onClick={() =>
												navigate("/seller/onboarding")
											}
											className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-brand-primary-deep font-bold hover:bg-brand-light-soft cursor-pointer transition-colors"
										>
											<Plus className="w-3.5 h-3.5" />
											Tạo shop mới
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* CONTAINER BODY CHỨA SIDEBAR & CONTENT */}
			<div className="flex-1 flex overflow-hidden relative">
				{/* MOBILE DRAWER BACKDROP */}
				{!isEditProductPage && isMobileMenuOpen && (
					<div 
						className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-40 lg:hidden"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
				)}

				{/* SIDEBAR NGƯỜI BÁN */}
				{!isEditProductPage && (
					<aside className={`fixed lg:static top-14 bottom-0 left-0 z-40 w-64 bg-white border-r border-brand-border flex flex-col shrink-0 overflow-y-auto p-4 select-none transition-transform duration-200 ease-in-out ${
						isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
					}`}>
						<nav className="space-y-1.5">
							{/* Quản lý sản phẩm */}
							<div>
								<button
									onClick={() => toggleExpand("product")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<ShoppingBag className="w-4 h-4 text-brand-muted" />
										<span>Quản lý sản phẩm</span>
									</div>
									{expandedMenus.product ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.product && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/products/list"
											className={getSubLinkClass(
												"/seller/dashboard/products/list",
											)}
										>
											Sản phẩm
										</Link>
										<Link
											to="/seller/dashboard/products/bulk"
											className={getSubLinkClass(
												"/seller/dashboard/products/bulk",
											)}
										>
											Hàng loạt (Import/Export)
										</Link>
									</div>
								)}
							</div>

							{/* Quản lý Đơn hàng */}
							<div>
								<button
									onClick={() => toggleExpand("order")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<Package className="w-4 h-4 text-brand-muted" />
										<span>Quản lý Đơn hàng</span>
									</div>
									{expandedMenus.order ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.order && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/orders"
											className={getSubLinkClass(
												"/seller/dashboard/orders",
											)}
										>
											Đơn hàng
										</Link>
										<Link
											to="/seller/dashboard/refunds"
											className={getSubLinkClass(
												"/seller/dashboard/refunds",
											)}
										>
											Các yêu cầu hoàn tiền
										</Link>
									</div>
								)}
							</div>

							{/* Khuyến mãi */}
							<div>
								<button
									onClick={() => toggleExpand("discount")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<Percent className="w-4 h-4 text-brand-muted" />
										<span>Khuyến mãi</span>
									</div>
									{expandedMenus.discount ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.discount && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/coupons"
											className={getSubLinkClass(
												"/seller/dashboard/coupons",
											)}
										>
											Mã giảm giá
										</Link>
										<Link
											to="/seller/dashboard/flashsale"
											className={getSubLinkClass(
												"/seller/dashboard/flashsale",
											)}
										>
											Flash Sale
										</Link>
									</div>
								)}
							</div>

							{/* Khách hàng */}
							<div>
								<button
									onClick={() => toggleExpand("customer")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<Users className="w-4 h-4 text-brand-muted" />
										<span>Khách hàng</span>
									</div>
									{expandedMenus.customer ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.customer && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/reviews"
											className={getSubLinkClass(
												"/seller/dashboard/reviews",
											)}
										>
											Đánh giá sản phẩm
										</Link>
										<Link
											to="/seller/dashboard/qa"
											className={getSubLinkClass(
												"/seller/dashboard/qa",
											)}
										>
											Hỏi đáp sản phẩm
										</Link>
										<Link
											to="/seller/dashboard/followers"
											className={getSubLinkClass(
												"/seller/dashboard/followers",
											)}
										>
											Người theo dõi
										</Link>
									</div>
								)}
							</div>

							{/* Ví Người Bán */}
							<div>
								<button
									onClick={() => toggleExpand("wallet")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<Wallet className="w-4 h-4 text-brand-muted" />
										<span>Ví Người Bán</span>
									</div>
									{expandedMenus.wallet ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.wallet && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/balance"
											className={getSubLinkClass(
												"/seller/dashboard/balance",
											)}
										>
											Số dư
										</Link>
										<Link
											to="/seller/dashboard/transactions"
											className={getSubLinkClass(
												"/seller/dashboard/transactions",
											)}
										>
											Lịch sử giao dịch
										</Link>
										<Link
											to="/seller/dashboard/withdrawals"
											className={getSubLinkClass(
												"/seller/dashboard/withdrawals",
											)}
										>
											Yêu cầu rút tiền
										</Link>
									</div>
								)}
							</div>

							{/* Báo cáo */}
							<div>
								<button
									onClick={() => toggleExpand("report")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<BarChart3 className="w-4 h-4 text-brand-muted" />
										<span>Báo cáo</span>
									</div>
									{expandedMenus.report ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.report && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/revenue"
											className={getSubLinkClass(
												"/seller/dashboard/revenue",
											)}
										>
											Doanh thu
										</Link>
										<Link
											to="/seller/dashboard/top-products"
											className={getSubLinkClass(
												"/seller/dashboard/top-products",
											)}
										>
											Sản phẩm bán chạy
										</Link>
										<Link
											to="/seller/dashboard/sales-perf"
											className={getSubLinkClass(
												"/seller/dashboard/sales-perf",
											)}
										>
											Hiệu suất bán hàng
										</Link>
										<Link
											to="/seller/dashboard/customer-stats"
											className={getSubLinkClass(
												"/seller/dashboard/customer-stats",
											)}
										>
											Thống kê khách hàng
										</Link>
									</div>
								)}
							</div>

							{/* Cài đặt Shop */}
							<div>
								<button
									onClick={() => toggleExpand("settings")}
									className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-bold text-brand-dark hover:bg-brand-light-soft cursor-pointer"
								>
									<div className="flex items-center gap-2.5">
										<Settings className="w-4 h-4 text-brand-muted" />
										<span>Cài đặt Shop</span>
									</div>
									{expandedMenus.settings ? (
										<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
									) : (
										<ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
									)}
								</button>
								{expandedMenus.settings && (
									<div className="pl-3 mt-1 space-y-0.5 border-l border-brand-border ml-4">
										<Link
											to="/seller/dashboard/settings"
											className={getSubLinkClass(
												"/seller/dashboard/settings",
											)}
										>
											Thông tin shop
										</Link>
									</div>
								)}
							</div>
						</nav>
					</aside>
				)}

				{/* NỘI DUNG CHÍNH */}
				<main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 flex flex-col w-full min-w-0">
					<div className="flex-1 bg-white border border-brand-border rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-3 sm:p-5 md:p-6 w-full min-w-0">
						<Outlet />
					</div>
				</main>
			</div>
			{/* Chat floating bubble for Seller */}
			<ChatBubbleButton />
		</div>
	);
}

