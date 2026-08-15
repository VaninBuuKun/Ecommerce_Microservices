import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	ShoppingBag,
	Search,
	LogOut,
	Package,
	Settings,
	Store,
	Bell,
} from "lucide-react";
import { useAuthStore, authService } from "../features/auth";
import { useCartQuery } from "../features/cart/hooks/useCartQuery";

export default function Header() {
	const navigate = useNavigate();
	const { user, isInitializing } = useAuthStore();
	const { data: cart } = useCartQuery();

	const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
	const [showCartDropdown, setShowCartDropdown] = useState(false);
	const [showNotificationDropdown, setShowNotificationDropdown] =
		useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const searchRef = useRef<HTMLDivElement>(null);

	// Close search suggestions when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				searchRef.current &&
				!searchRef.current.contains(event.target as Node)
			) {
				setShowSearchSuggestions(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = async () => {
		await authService.logout();
		navigate("/login");
	};

	const mockSuggestions = [
		"Áo Hoodie Streetwear Emerald",
		"Quần Cargo Đen Technical",
		"Túi Đeo Chéo Canvas Minimalist",
		"Kính Râm Polarized Cao Cấp",
	];

	// Flatten all items from shop groups to preview in dropdown
	const previewCartItems = cart?.shopGroups?.flatMap((group) => group.items) || [];
	const totalCartItemsCount = previewCartItems.length;

	const mockNotifications = [
		{
			id: 1,
			title: "Đơn hàng mới",
			content: "Shop của bạn nhận được đơn hàng mới #129384",
			time: "10 phút trước",
			read: false,
		},
		{
			id: 2,
			title: "Khuyến mãi cực hot",
			content: "Ví Shopee đang có chương trình hoàn xu đến 50%",
			time: "2 giờ trước",
			read: false,
		},
		{
			id: 3,
			title: "Cập nhật tài khoản",
			content:
				"Thông tin tài khoản định danh của bạn đã được duyệt thành công",
			time: "1 ngày trước",
			read: true,
		},
	];

	return (
		<header className="sticky top-0 z-50 w-full h-14 bg-white/80 backdrop-blur-md border-b border-brand-border px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] font-sans">
			{/* KHỐI BÊN TRÁI: Logo + Thanh Search cố định */}
			<div className="flex items-center gap-40 flex-1 min-w-0 pr-4">
				{/* Logo */}
				<Link
					to="/"
					className="flex items-center gap-2 font-bold text-lg text-brand-dark tracking-tight shrink-0 h-8"
				>
					<img
						src="/ecommerce-icon.png"
						alt="Buu Store"
						className="w-7 h-7 object-contain"
						onError={(e) => {
							(e.target as HTMLImageElement).src =
								"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
						}}
					/>
					<span className="font-extrabold text-brand-dark tracking-tighter leading-none">
						BUU
						<span className="text-brand-primary font-medium">
							STORE
						</span>
					</span>
				</Link>

				{/* Thanh Search thông minh (Chiều cao h-8 chuẩn) */}
				<div
					ref={searchRef}
					className="relative w-full max-w-2xl hidden sm:block"
				>
					<div className="relative flex items-center w-full">
						<input
							type="text"
							placeholder="Tìm kiếm sản phẩm, thương hiệu..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setShowSearchSuggestions(true)}
							className="w-full h-8 pl-3 pr-10 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark font-sans"
						/>
						<button className="absolute right-2 p-1 text-brand-muted hover:text-brand-primary transition-colors flex items-center justify-center">
							<Search className="w-3.5 h-3.5" />
						</button>
					</div>

					{/* Gợi ý tìm kiếm */}
					{showSearchSuggestions && (
						<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded shadow-lg p-2 text-left z-50">
							<span className="block text-[10px] text-brand-muted font-bold px-2 py-1 uppercase tracking-wider">
								Tìm kiếm phổ biến
							</span>
							<div className="mt-1">
								{mockSuggestions
									.filter((s) =>
										s
											.toLowerCase()
											.includes(
												searchQuery.toLowerCase(),
											),
									)
									.map((suggestion, idx) => (
										<button
											key={idx}
											onClick={() => {
												setSearchQuery(suggestion);
												setShowSearchSuggestions(false);
											}}
											className="w-full text-left px-2 py-1.5 text-xs text-brand-dark hover:bg-brand-light-soft hover:text-brand-primary rounded transition-colors"
										>
											{suggestion}
										</button>
									))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* KHỐI BÊN PHẢI: Kênh bán + Giỏ hàng + Auth Slot (Tất cả có h-8 chuẩn) */}
			<div className="flex items-center gap-3 shrink-0 ml-auto h-8">
				{/* Chỉ hiển thị Kênh người bán và Giỏ hàng khi ĐÃ ĐĂNG NHẬP */}
				{!isInitializing && user && (
					<>
						{/* Kênh người bán (h-8) */}
						<Link
							to="/seller"
							className="hidden md:flex items-center gap-1.5 h-8 px-2.5 text-xs font-bold text-brand-dark rounded hover:bg-brand-primary/15 hover:text-brand-primary-deep transition-colors"
						>
							<Store className="w-3.5 h-3.5" />
							Kênh người bán
						</Link>

						<span className="text-brand-border hidden md:inline">
							|
						</span>

						{/* GIỎ HÀNG (h-8 w-8) */}
						<div
							className="relative flex items-center"
							onMouseEnter={() => setShowCartDropdown(true)}
							onMouseLeave={() => setShowCartDropdown(false)}
						>
							<button
								onClick={() => navigate("/cart")}
								className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer"
							>
								<ShoppingBag className="w-4.5 h-4.5" />
								{totalCartItemsCount > 0 && (
									<span className="absolute top-0 right-0 bg-brand-primary text-brand-dark font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
										{totalCartItemsCount}
									</span>
								)}
							</button>

							{showCartDropdown && (
								<div className="absolute right-0 top-full pt-1.5 w-72 z-50">
									<div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
										<span className="block text-xs font-bold text-brand-dark border-b border-brand-border pb-2 mb-2">
											Giỏ hàng của tôi
										</span>

										<div className="space-y-3 max-h-48 overflow-y-auto">
											{previewCartItems.length === 0 ? (
												<div className="text-center py-4 text-[11px] text-brand-muted font-medium">
													Giỏ hàng trống
												</div>
											) : (
												previewCartItems.map((item) => (
													<div
														key={item.productVariantId}
														className="flex items-center gap-3"
													>
														<img
															src={item.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
															alt={item.productName}
															className="w-10 h-10 object-cover rounded border border-brand-border"
														/>
														<div className="flex-1 min-w-0">
															<h4 className="text-[11px] font-bold text-brand-dark truncate">
																{item.productName}
															</h4>
															<div className="flex items-center gap-1.5">
																{item.discountPrice && item.discountPrice < item.unitPrice ? (
																	<>
																		<span className="text-[10px] text-brand-primary-deep font-black">
																			{item.discountPrice.toLocaleString("vi-VN")}đ
																		</span>
																		<span className="text-[8px] text-brand-muted line-through font-bold">
																			{item.unitPrice.toLocaleString("vi-VN")}đ
																		</span>
																	</>
																) : (
																	<span className="text-[10px] text-brand-primary-deep font-black">
																		{item.unitPrice.toLocaleString("vi-VN")}đ
																	</span>
																)}
															</div>
														</div>
													</div>
												))
											)}
										</div>

										<div className="border-t border-brand-border mt-3 pt-2.5 flex justify-end">
											<button
												onClick={() => {
													setShowCartDropdown(false);
													navigate("/cart");
												}}
												className="px-4 py-1.5 bg-brand-dark text-white rounded text-[10px] font-bold hover:bg-brand-primary hover:text-brand-dark transition-colors cursor-pointer border-none"
											>
												Xem giỏ hàng
											</button>
										</div>
									</div>
								</div>
							)}
						</div>

						<span className="text-brand-border hidden md:inline">
							|
						</span>

						{/* THÔNG BÁO (h-8 w-8) */}
						<div
							className="relative flex items-center"
							onMouseEnter={() =>
								setShowNotificationDropdown(true)
							}
							onMouseLeave={() =>
								setShowNotificationDropdown(false)
							}
						>
							<button className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer">
								<Bell className="w-4.5 h-4.5" />
								<span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
									3
								</span>
							</button>

							{showNotificationDropdown && (
								<div className="absolute right-0 top-full pt-1.5 w-80 z-50">
									<div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
										<span className="block text-xs font-bold text-brand-dark border-b border-brand-border pb-2 mb-2">
											Thông báo mới nhận
										</span>
										<div className="space-y-2 max-h-60 overflow-y-auto">
											{mockNotifications.map((notif) => (
												<div
													key={notif.id}
													className={`p-2 rounded text-xs transition-colors ${notif.read ? "bg-transparent" : "bg-brand-light-soft border-l-2 border-brand-primary"}`}
												>
													<div className="flex justify-between items-start mb-0.5">
														<h4 className="font-bold text-brand-dark">
															{notif.title}
														</h4>
														<span className="text-[9px] text-brand-muted shrink-0">
															{notif.time}
														</span>
													</div>
													<p className="text-brand-muted text-[11px] leading-snug">
														{notif.content}
													</p>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					</>
				)}

				{/* Ô AUTH SLOT (Xử lý Đăng nhập / Đăng ký hoặc Avatar) */}
				{isInitializing ? (
					<div className="w-8 h-8 rounded-full bg-brand-border/60 animate-pulse shrink-0" />
				) : user ? (
					<div
						className="relative flex items-center"
						onMouseEnter={() => setShowUserDropdown(true)}
						onMouseLeave={() => setShowUserDropdown(false)}
					>
						<button className="w-8 h-8 hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer flex items-center justify-center p-0.5">
							<img
								src={user.avatarUrl}
								alt="Avatar"
								className="w-7 h-7 rounded-full object-cover border border-brand-border"
								onError={(e) => {
									(e.target as HTMLImageElement).src =
										"https://cdn-icons-png.flaticon.com/512/149/149071.png";
								}}
							/>
						</button>

						{showUserDropdown && (
							<div className="absolute right-0 top-full pt-1.5 w-56 z-50">
								<div className="bg-white border border-brand-border rounded shadow-xl p-3 z-50">
									<div className="flex items-center gap-3 pb-3 border-b border-brand-border mb-2">
										<img
											src={user.avatarUrl}
											alt="Avatar"
											className="w-11 h-11 rounded-full object-cover border border-brand-border"
											onError={(e) => {
												(
													e.target as HTMLImageElement
												).src =
													"https://cdn-icons-png.flaticon.com/512/149/149071.png";
											}}
										/>
										<div className="min-w-0">
											<h4 className="text-sm font-bold text-brand-dark truncate leading-tight text-left">
												{user.firstName +
													" " +
													user.lastName}
											</h4>
											<span className="text-xs text-brand-muted truncate block text-left">
												{user.email}
											</span>
										</div>
									</div>

									<div className="space-y-0.5 text-left">
										<Link
											to="/profile"
											className="flex items-center gap-2.5 w-full px-2 py-2 rounded text-sm text-brand-dark hover:bg-brand-light-soft hover:text-brand-primary transition-colors"
										>
											<Settings className="w-4 h-4 text-brand-muted" />
											Tài khoản của tôi
										</Link>

										<Link
											to="/orders"
											className="flex items-center gap-2.5 w-full px-2 py-2 rounded text-sm text-brand-dark hover:bg-brand-light-soft hover:text-brand-primary transition-colors"
										>
											<Package className="w-4 h-4 text-brand-muted" />
											Đơn hàng của tôi
										</Link>

										<div className="h-px bg-brand-border my-1.5" />

										<button
											onClick={handleLogout}
											className="flex items-center gap-2.5 w-full px-2 py-2 rounded text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
										>
											<LogOut className="w-4 h-4 text-red-400" />
											Đăng xuất
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center gap-1.5 h-8">
						<Link
							to="/login"
							className="flex items-center h-8 px-3 text-xs font-bold text-brand-dark rounded hover:bg-brand-primary/15 transition-colors text-center whitespace-nowrap"
						>
							Đăng nhập
						</Link>
						<Link
							to="/register"
							className="flex items-center h-8 px-3 text-xs font-bold bg-brand-primary text-brand-dark rounded transition-colors text-center whitespace-nowrap"
						>
							Đăng ký
						</Link>
					</div>
				)}
			</div>
		</header>
	);
}
