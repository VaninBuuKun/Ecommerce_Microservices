import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
	ShoppingBag,
	Search,
	LogOut,
	Package,
	Settings,
	Store,
	Bell,
	Heart,
	Clock,
	X,
	Trash2,
	ArrowRight,
} from "lucide-react";
import { authService, useAuthStore } from "@/domains/auth";
import { useCartQuery } from "@/domains/cart";
import { api } from "@/core";

import { checkIsAdmin } from "../shared/utils/authHelper";
import {
	useWishlist,
	useSearchHistoryQuery,
	useSaveSearchKeywordMutation,
	useSyncSearchHistoryMutation,
	useClearSearchHistoryMutation,
	useRemoveSearchHistoryItemMutation,
	productApi,
	type SearchSuggestionsResponse,
} from "@/domains/catalog";
import { useNotifications } from "@/domains/notification";

export default function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const isChatRoute = location.pathname.startsWith('/chat');
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
	const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
	const [suggestionData, setSuggestionData] = useState<SearchSuggestionsResponse | null>(null);

	const searchRef = useRef<HTMLDivElement>(null);

	// Queries & Mutations cho Tìm Kiếm
	const { data: serverHistory = [] } = useSearchHistoryQuery(!!user);
	const saveKeywordMutation = useSaveSearchKeywordMutation();
	const syncHistoryMutation = useSyncSearchHistoryMutation();
	const clearHistoryMutation = useClearSearchHistoryMutation();
	const removeHistoryMutation = useRemoveSearchHistoryItemMutation();

	// Quản lý LocalStorage History cho khách vãng lai (Guest)
	const [guestHistory, setGuestHistory] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem("guest_search_history");
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	});

	const searchHistory = user ? serverHistory : guestHistory;

	// Tự động đồng bộ lịch sử tìm kiếm khi User đăng nhập
	useEffect(() => {
		if (user && guestHistory.length > 0) {
			syncHistoryMutation.mutate(guestHistory, {
				onSuccess: () => {
					localStorage.removeItem("guest_search_history");
					setGuestHistory([]);
				},
			});
		}
	}, [user]);

	// Fetch Autocomplete & Smart Intent Suggestions (Debounce 250ms)
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSuggestionData(null);
			return;
		}

		const timer = setTimeout(async () => {
			try {
				setIsSearchingSuggestions(true);
				const data = await productApi.getSearchSuggestions(searchQuery.trim(), 5);
				setSuggestionData(data);
			} catch (e) {
				console.error("Lỗi gợi ý tìm kiếm:", e);
			} finally {
				setIsSearchingSuggestions(false);
			}
		}, 250);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleExecuteSearch = (targetUrlOrTerm?: string) => {
		setShowSearchSuggestions(false);

		// Nếu là URL chuyển tiếp trực tiếp từ gợi ý ý định
		if (targetUrlOrTerm && targetUrlOrTerm.startsWith("/explore")) {
			navigate(targetUrlOrTerm);
			return;
		}

		const term = (targetUrlOrTerm !== undefined ? targetUrlOrTerm : searchQuery).trim();
		if (term) {
			if (user) {
				saveKeywordMutation.mutate(term);
			} else {
				try {
					const updated = [term, ...guestHistory.filter((k) => k.toLowerCase() !== term.toLowerCase())].slice(0, 5);
					localStorage.setItem("guest_search_history", JSON.stringify(updated));
					setGuestHistory(updated);
				} catch (e) {
					console.error("Lỗi lưu lịch sử khách:", e);
				}
			}
			navigate(`/explore?search=${encodeURIComponent(term)}`);
		} else {
			navigate("/explore");
		}
	};

	const handleClearHistory = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (user) {
			clearHistoryMutation.mutate();
		} else {
			localStorage.removeItem("guest_search_history");
			setGuestHistory([]);
		}
	};

	const handleRemoveHistoryItem = (e: React.MouseEvent, item: string) => {
		e.stopPropagation();
		if (user) {
			removeHistoryMutation.mutate(item);
		} else {
			const updated = guestHistory.filter((k) => k !== item);
			localStorage.setItem("guest_search_history", JSON.stringify(updated));
			setGuestHistory(updated);
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

	const POPULAR_SEARCH_KEYWORDS = [
		"Áo Hoodie Streetwear Emerald",
		"Quần Cargo Đen Technical",
		"Túi Đeo Chéo Canvas Minimalist",
		"Kính Râm Polarized Cao Cấp",
	];

	const isSystemAdmin = checkIsAdmin();

	// Flatten all items from shop groups to preview in dropdown (Lọc chỉ các item hợp lệ)
	const previewCartItems = cart?.shopGroups?.flatMap((group: any) => group.items || [])
		.filter((item: any) => item && item.productName && item.shopId > 0) || [];
	const totalCartItemsCount = previewCartItems.length;


	return (
		<header className="sticky top-0 z-50 w-full h-14 bg-white backdrop-blur-md border-b border-brand-border px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] font-sans">
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

				{/* Thanh Search thông minh (Ẩn khi đang ở trang /chat) */}
				{!isChatRoute && (
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

					{/* Dropdown Gợi ý tìm kiếm thông minh (Không bo góc, lịch sử dạng dọc) */}
					{showSearchSuggestions && (
						<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-none shadow-[0_12px_45px_rgba(0,0,0,0.12)] p-3 text-left z-50 animate-in fade-in duration-150 max-h-[80vh] overflow-y-auto custom-scrollbar">
							{/* Case 1: Search Query TRỐNG -> Hiển thị Lịch sử tìm kiếm DỌC (tối đa 5) */}
							{!searchQuery.trim() ? (
								<div className="space-y-2">
									{searchHistory.length > 0 ? (
										<div className="space-y-1">
											<div className="flex items-center justify-between pb-1.5 border-b border-slate-100 px-1">
												<span className="text-[11px] font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
													<Clock className="w-3.5 h-3.5 text-brand-primary" />
													Lịch sử tìm kiếm
												</span>
												<button
													type="button"
													onClick={handleClearHistory}
													className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-0.5 border-none bg-transparent cursor-pointer"
												>
													<Trash2 className="w-3 h-3" />
													Xóa tất cả
												</button>
											</div>

											{/* Danh sách DỌC (Vertical List) */}
											<div className="divide-y divide-slate-100">
												{searchHistory.map((kw, idx) => (
													<div
														key={idx}
														onClick={() => {
															setSearchQuery(kw);
															handleExecuteSearch(kw);
														}}
														className="group flex items-center justify-between py-2 px-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-brand-primary-deep transition-colors cursor-pointer"
													>
														<div className="flex items-center gap-2.5 min-w-0 flex-1">
															<Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-primary shrink-0" />
															<span className="truncate">{kw}</span>
														</div>
														<button
															type="button"
															onClick={(e) => handleRemoveHistoryItem(e, kw)}
															className="text-slate-300 hover:text-red-500 p-1 transition-colors border-none bg-transparent cursor-pointer flex items-center shrink-0"
															title="Xóa"
														>
															<X className="w-3 h-3" />
														</button>
													</div>
												))}
											</div>
										</div>
									) : (
										<div className="py-4 text-center text-xs text-brand-muted font-medium">
											Nhập từ khóa để tìm kiếm sản phẩm hoặc danh mục...
										</div>
									)}
								</div>
							) : (
								/* Case 2: Search Query ĐANG NHẬP CHỮ -> Không bo góc */
								<div className="space-y-3.5">
									{isSearchingSuggestions ? (
										<div className="py-6 text-center text-xs text-brand-muted font-medium">
											Đang tìm kiếm danh mục và sản phẩm...
										</div>
									) : (
										<>
											{/* A. DANH MỤC TÌM KIẾM (Hiện ở ĐẦU nếu có, tối đa 5 SubCategories kèm ảnh + tên) */}
											{suggestionData?.suggestedCategories && suggestionData.suggestedCategories.length > 0 && (
												<div className="space-y-2">
													<span className="block text-[11px] font-black text-brand-dark uppercase tracking-wider px-1">
														Danh mục tìm kiếm
													</span>
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
														{suggestionData.suggestedCategories.map((cat) => (
															<div
																key={cat.id}
																onClick={() => {
																	setShowSearchSuggestions(false);
																	navigate(
																		cat.parentId
																			? `/explore?parentCategoryId=${cat.parentId}&subCategoryId=${cat.id}`
																			: `/explore?categoryId=${cat.id}`
																	);
																}}
																className="flex items-center gap-2.5 p-2 bg-slate-50/80 hover:bg-slate-100 rounded-none cursor-pointer transition-all group border border-slate-100"
															>
																<img
																	src={cat.imageUrl || "https://cdn-icons-png.flaticon.com/512/3081/3081986.png"}
																	alt={cat.name}
																	className="w-8 h-8 object-cover rounded-none bg-white shrink-0 group-hover:scale-105 transition-transform"
																	onError={(e) => {
																		(e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
																	}}
																/>
																<div className="min-w-0 flex-1">
																	<span className="block text-xs font-bold text-slate-800 group-hover:text-brand-primary-deep truncate transition-colors">
																		{cat.name}
																	</span>
																	{cat.parentName && (
																		<span className="block text-[10px] text-brand-muted truncate">
																			{cat.parentName}
																		</span>
																	)}
																</div>
															</div>
														))}
													</div>
												</div>
											)}

											{/* B. SẢN PHẨM GỢI Ý (Hiện ở CUỐI nếu có, 5 sản phẩm) */}
											{suggestionData?.topProducts && suggestionData.topProducts.length > 0 && (
												<div className={`space-y-1.5 ${suggestionData?.suggestedCategories && suggestionData.suggestedCategories.length > 0 ? "pt-2.5 border-t border-slate-100" : ""}`}>
													<span className="block text-[11px] font-black text-brand-dark uppercase tracking-wider px-1">
														Sản phẩm gợi ý
													</span>
													{suggestionData.topProducts.map((p: any) => (
														<div
															key={p.id}
															onClick={() => {
																setShowSearchSuggestions(false);
																navigate(`/products/${p.id}`);
															}}
															className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-none cursor-pointer transition-colors group"
														>
															<img
																src={p.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80"}
																alt={p.name}
																className="w-10 h-10 object-cover rounded-none bg-slate-100 shrink-0 group-hover:scale-105 transition-transform"
															/>
															<div className="flex-1 min-w-0">
																<h4 className="text-xs font-bold text-brand-dark truncate group-hover:text-brand-primary-deep transition-colors">
																	{p.name}
																</h4>
																<div className="flex items-center gap-2 mt-0.5">
																	<span className="text-xs text-red-600 font-black">
																		{(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString("vi-VN")}đ
																	</span>
																	{p.sold > 0 && (
																		<span className="text-[10px] text-brand-muted">
																			Đã bán {p.sold}
																		</span>
																	)}
																</div>
															</div>
														</div>
													))}
												</div>
											)}

											{/* C. Khi cả danh mục và sản phẩm đều không có */}
											{(!suggestionData?.suggestedCategories || suggestionData.suggestedCategories.length === 0) &&
											 (!suggestionData?.topProducts || suggestionData.topProducts.length === 0) && (
												<div className="py-6 text-center text-xs text-brand-muted font-medium">
													Không tìm thấy danh mục hoặc sản phẩm phù hợp với "{searchQuery}"
												</div>
											)}

											{/* Footer Action */}
											<div className="border-t border-slate-100 pt-2.5 text-center">
												<button
													type="button"
													onClick={() => handleExecuteSearch()}
													className="w-full py-2.5 text-xs text-brand-dark font-black hover:bg-brand-primary-deep rounded-none transition-all border-none bg-brand-primary cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
												>
													<span>Xem tất cả kết quả cho "{searchQuery}"</span>
													<ArrowRight className="w-3.5 h-3.5" />
												</button>
											</div>
										</>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			)}
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
																			<span className="text-[9px] text-brand-muted line-through">
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
																			<span className="text-[9px] text-brand-muted line-through">
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
