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
	Heart,
} from "lucide-react";
import { authService, useAuthStore } from "@/domains/auth";
import { useCartQuery } from "@/domains/cart";
import { api } from "@/core";

import { checkIsAdmin } from "../shared/utils/authHelper";
import { useWishlist } from "@/domains/catalog";
import { useNotifications } from "@/domains/notification";

export default function Header() {
	const navigate = useNavigate();
	const { user, isInitializing } = useAuthStore();
	const { data: cart } = useCartQuery();
	const { wishlistItems } = useWishlist();
	const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

	const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
	const [showCartDropdown, setShowCartDropdown] = useState(false);
	const [showWishlistDropdown, setShowWishlistDropdown] = useState(false);
	const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState<any[]>([]);
	const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);

	// Fetch autocomplete suggestions from Catalog Service (PostgreSQL FTS)
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSuggestions([]);
			return;
		}

		const timer = setTimeout(async () => {
			try {
				setIsSearchingSuggestions(true);
				const res = await api.get("/catalog/products", {
					params: { searchTerm: searchQuery.trim(), limit: 5 },
				});
				const items = res.data?.value?.items || res.data?.items || [];
				setSuggestions(items);
			} catch (e) {
				console.error("Lỗi gợi ý tìm kiếm:", e);
			} finally {
				setIsSearchingSuggestions(false);
			}
		}, 250);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleExecuteSearch = (queryToSearch?: string) => {
		const term = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
		setShowSearchSuggestions(false);
		if (term) {
			navigate(`/explore?search=${encodeURIComponent(term)}`);
		} else {
			navigate("/explore");
		}
	};

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

	const isSystemAdmin = checkIsAdmin();

	// Flatten all items from shop groups to preview in dropdown (Lọc chỉ các item hợp lệ)
	const previewCartItems = cart?.shopGroups?.flatMap((group: any) => group.items || [])
		.filter((item: any) => item && item.productName && item.shopId > 0) || [];
	const totalCartItemsCount = previewCartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);


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
					{isSystemAdmin && (
						<span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black uppercase rounded animate-pulse">
							Admin Mode
						</span>
					)}
				</Link>

				{/* Thanh Search thông minh (Chiều cao h-8 chuẩn) */}
				<div
					ref={searchRef}
					className="relative w-full max-w-2xl hidden sm:block"
				>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleExecuteSearch();
						}}
						className="relative flex items-center w-full"
					>
						<input
							type="text"
							placeholder="Tìm kiếm sản phẩm, thương hiệu..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setShowSearchSuggestions(true)}
							className="w-full h-8 pl-3 pr-10 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark font-sans"
						/>
						<button
							type="submit"
							className="absolute right-2 p-1 text-brand-muted hover:text-brand-primary transition-colors flex items-center justify-center border-none bg-transparent cursor-pointer"
						>
							<Search className="w-3.5 h-3.5" />
						</button>
					</form>

					{/* Gợi ý tìm kiếm Fuzzy Search từ PostgreSQL */}
					{showSearchSuggestions && (
						<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl p-2.5 text-left z-50 animate-in fade-in duration-150">
							<span className="block text-[10px] text-brand-muted font-bold px-2 py-1 uppercase tracking-wider">
								{searchQuery.trim() ? "Gợi ý sản phẩm phù hợp" : "Tìm kiếm phổ biến"}
							</span>

							<div className="mt-1 space-y-1">
								{isSearchingSuggestions ? (
									<div className="p-3 text-center text-xs text-brand-muted font-medium">
										Đang tìm gợi ý...
									</div>
								) : searchQuery.trim() && suggestions.length > 0 ? (
									suggestions.map((item: any) => (
										<div
											key={item.id}
											onClick={() => {
												setShowSearchSuggestions(false);
												navigate(`/products/${item.id}`);
											}}
											className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
										>
											<img
												src={item.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80"}
												alt={item.name}
												className="w-9 h-9 object-cover rounded border border-brand-border"
											/>
											<div className="flex-1 min-w-0">
												<h4 className="text-xs font-bold text-brand-dark truncate">
													{item.name}
												</h4>
												<span className="text-[10px] text-brand-primary-deep font-black">
													{item.price?.toLocaleString("vi-VN")}đ
												</span>
											</div>
										</div>
									))
								) : searchQuery.trim() && suggestions.length === 0 ? (
									<div className="p-3 text-center text-xs text-brand-muted font-medium">
										Không tìm thấy gợi ý khớp với "{searchQuery}"
									</div>
								) : (
									mockSuggestions.map((suggestion, idx) => (
										<button
											key={idx}
											onClick={() => {
												setSearchQuery(suggestion);
												handleExecuteSearch(suggestion);
											}}
											className="w-full text-left px-2.5 py-1.5 text-xs text-brand-dark hover:bg-brand-light-soft hover:text-brand-primary rounded-lg transition-colors border-none bg-transparent cursor-pointer font-medium"
										>
											🔍 {suggestion}
										</button>
									))
								)}
							</div>

							{searchQuery.trim() && (
								<div className="border-t border-brand-border/60 mt-2 pt-2 text-center">
									<button
										onClick={() => handleExecuteSearch()}
										className="w-full py-1.5 text-xs text-brand-dark font-extrabold hover:bg-brand-primary hover:text-brand-dark rounded-lg transition-colors border-none bg-brand-light-soft cursor-pointer"
									>
										Xem tất cả kết quả cho "{searchQuery}" ➔
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* KHỐI BÊN PHẢI: Kênh bán + Wishlist + Giỏ hàng + Thông báo + Auth Slot */}
			<div className="flex items-center gap-3 shrink-0 ml-auto h-8">
				{!isInitializing && user && (
					<>
						{!isSystemAdmin && (
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

								{/* YÊU THÍCH (h-8 w-8) */}
								<div
									className="relative flex items-center"
									onMouseEnter={() => setShowWishlistDropdown(true)}
									onMouseLeave={() => setShowWishlistDropdown(false)}
								>
									<button
										onClick={() => navigate("/wishlist")}
										className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer"
										title="Sản phẩm yêu thích"
									>
										<Heart className="w-4.5 h-4.5 text-rose-500 hover:scale-110 transition-transform" />
										{wishlistItems.length > 0 && (
											<span className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
												{wishlistItems.length}
											</span>
										)}
									</button>

									{showWishlistDropdown && (
										<div className="absolute right-0 top-full pt-1.5 w-72 z-50">
											<div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
												<span className="block text-xs font-bold text-brand-dark border-b border-brand-border pb-2 mb-2">
													Sản phẩm yêu thích
												</span>

												<div className="space-y-3 max-h-48 overflow-y-auto">
													{wishlistItems.length === 0 ? (
														<div className="text-center py-4 text-[11px] text-brand-muted font-medium">
															Chưa có sản phẩm yêu thích
														</div>
													) : (
														wishlistItems.slice(0, 5).map((item: any) => (
															<div
																key={item.id}
																onClick={() => {
																	setShowWishlistDropdown(false);
																	navigate(`/product/${item.id}`);
																}}
																className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
															>
																<img
																	src={item.thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
																	alt={item.name}
																	className="w-10 h-10 object-cover rounded border border-brand-border"
																/>
																<div className="flex-1 min-w-0">
																	<h4 className="text-[11px] font-bold text-brand-dark truncate">
																		{item.name}
																	</h4>
																	<div className="flex items-center gap-1.5">
																		<span className="text-[10px] text-brand-primary-deep font-black">
																			{(item.discountPrice > 0 ? item.discountPrice : item.price)?.toLocaleString("vi-VN")}đ
																		</span>
																		{item.discountPrice > 0 && item.discountPrice < item.price && (
																			<span className="text-[9px] text-brand-muted line-through font-mono">
																				{item.price?.toLocaleString("vi-VN")}đ
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
															setShowWishlistDropdown(false);
															navigate("/wishlist");
														}}
														className="px-4 py-1.5 bg-brand-dark text-white rounded text-[10px] font-bold hover:bg-brand-primary hover:text-brand-dark transition-colors cursor-pointer border-none"
													>
														Xem tất cả
													</button>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* GIỎ HÀNG (h-8 w-8) */}
								<div
									className="relative flex items-center"
									onMouseEnter={() => setShowCartDropdown(true)}
									onMouseLeave={() => setShowCartDropdown(false)}
								>
									<button
										onClick={() => navigate("/cart")}
										className="relative w-8 h-8 text-brand-dark hover:bg-brand-primary/10 rounded transition-colors flex items-center justify-center cursor-pointer"
										title="Giỏ hàng"
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
														previewCartItems.map((item: any) => (
															<div
																key={item.productVariantId}
																onClick={() => {
																	setShowCartDropdown(false);
																	navigate(`/products/${item.productId}`);
																}}
																className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
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
																		<span className="text-[10px] text-brand-primary-deep font-black">
																			{(item.discountPrice && item.discountPrice < item.unitPrice ? item.discountPrice : item.unitPrice)?.toLocaleString("vi-VN")}đ
																		</span>
																		{item.discountPrice && item.discountPrice < item.unitPrice && (
																			<span className="text-[9px] text-brand-muted line-through font-mono">
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
										{unreadCount > 0 && (
											<span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
												{unreadCount}
											</span>
										)}
									</button>

									{showNotificationDropdown && (
										<div className="absolute right-0 top-full pt-1.5 w-80 z-50">
											<div className="bg-white border border-brand-border rounded shadow-xl p-3 text-left">
												<div className="flex items-center justify-between border-b border-brand-border pb-2 mb-2">
													<span className="text-xs font-bold text-brand-dark">
														Thông báo mới nhận
													</span>
													{unreadCount > 0 && (
														<button
															onClick={() => markAllAsRead()}
															className="text-[10px] text-brand-primary hover:underline font-semibold border-none bg-transparent cursor-pointer"
														>
															Đánh dấu đã đọc tất cả
														</button>
													)}
												</div>
												<div className="space-y-2 max-h-60 overflow-y-auto">
													{notifications.length === 0 ? (
														<div className="text-center py-4 text-[11px] text-brand-muted font-medium">
															Không có thông báo nào
														</div>
													) : (
														notifications.map((notif) => (
															<div
																key={notif.id}
																onClick={() => {
																	if (!notif.isRead) markAsRead(notif.id);
																}}
																className={`p-2 rounded text-xs transition-colors cursor-pointer ${notif.isRead ? "bg-transparent hover:bg-slate-50" : "bg-brand-light-soft border-l-2 border-brand-primary font-semibold"}`}
															>
																<div className="flex justify-between items-start mb-0.5">
																	<h4 className="font-bold text-brand-dark text-[11px]">
																		{notif.title}
																	</h4>
																	<span className="text-[9px] text-brand-muted shrink-0">
																		{new Date(notif.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
																	</span>
																</div>
																<p className="text-brand-muted text-[11px] leading-snug">
																	{notif.body}
																</p>
															</div>
														))
													)}
												</div>
											</div>
										</div>
									)}
								</div>
							</>
						)}
						{isSystemAdmin && (
							<Link
								to="/admin"
								className="flex items-center gap-1 h-8 px-2.5 bg-brand-dark text-white rounded text-[10px] font-black uppercase hover:bg-brand-primary hover:text-brand-dark transition-all shadow-sm"
							>
								Trang quản trị (Admin)
							</Link>
						)}
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

										<Link
											to="/wishlist"
											className="flex items-center gap-2.5 w-full px-2 py-2 rounded text-sm text-brand-dark hover:bg-brand-light-soft hover:text-brand-primary transition-colors"
										>
											<Heart className="w-4 h-4 text-rose-500" />
											Sản phẩm yêu thích
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
