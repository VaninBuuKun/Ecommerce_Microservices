import { useState, useMemo } from "react";
import {
	Star,
	Search,
	RotateCcw,
	MessageSquare,
	CheckCircle2,
	Send,
	Package,
	ChevronLeft,
	ChevronRight,
	ShoppingBag,
	Receipt,
	Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

interface ProductItem {
	id: string;
	name: string;
	image: string;
	price: number;
	rating: number;
	reviewCount: number;
	category: string;
}

interface ReviewItem {
	id: string;
	orderId: string; // Mã đơn hàng tương ứng (user requested)
	userName: string;
	userAvatar: string;
	rating: number;
	createdAt: string;
	variantName?: string;
	comment: string;
	images?: string[];
	sellerReply?: {
		content: string;
		repliedAt: string;
	};
}

// Danh sách sản phẩm của shop
const MOCK_SELLER_PRODUCTS: ProductItem[] = [];
const MOCK_REVIEWS_MAP: Record<string, ReviewItem[]> = {};

export function SellerReviewsView() {
	// 1. Sản phẩm đang chọn (Luồng: chọn sản phẩm trước rồi mới show)
	const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

	// Tìm kiếm sản phẩm
	const [productSearchKeyword, setProductSearchKeyword] = useState("");

	// Bộ lọc đánh giá: Số sao & Trạng thái phản hồi & Tìm kiếm
	const [starFilter, setStarFilter] = useState<number | "all">("all");
	const [replyFilter, setReplyFilter] = useState<"all" | "unreplied" | "replied">("all");
	const [reviewSearchKeyword, setReviewSearchKeyword] = useState("");

	// Phân trang
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 4;

	// Trạng thái nhập phản hồi cho từng đánh giá
	const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
	const [replyContent, setReplyContent] = useState("");

	// Quản lý state reviews để cho phép cập nhật phản hồi realtime
	const [reviewsState, setReviewsState] = useState<Record<string, ReviewItem[]>>(MOCK_REVIEWS_MAP);

	// Danh sách sản phẩm lọc theo ô tìm kiếm
	const filteredProducts = useMemo(() => {
		if (!productSearchKeyword.trim()) return MOCK_SELLER_PRODUCTS;
		const kw = productSearchKeyword.toLowerCase();
		return MOCK_SELLER_PRODUCTS.filter(
			(p) => p.name.toLowerCase().includes(kw) || p.category.toLowerCase().includes(kw),
		);
	}, [productSearchKeyword]);

	// Danh sách đánh giá của sản phẩm đang chọn
	const currentReviews = useMemo(() => {
		if (!selectedProduct) return [];
		return reviewsState[selectedProduct.id] || [];
	}, [selectedProduct, reviewsState]);

	// Lọc danh sách đánh giá
	const filteredReviews = useMemo(() => {
		return currentReviews.filter((rev) => {
			// Lọc theo số sao
			if (starFilter !== "all" && rev.rating !== starFilter) return false;

			// Lọc theo trạng thái phản hồi
			if (replyFilter === "unreplied" && rev.sellerReply) return false;
			if (replyFilter === "replied" && !rev.sellerReply) return false;

			// Lọc theo từ khóa tìm kiếm nội dung / mã đơn hàng
			if (reviewSearchKeyword.trim()) {
				const kw = reviewSearchKeyword.toLowerCase();
				const matchComment = rev.comment.toLowerCase().includes(kw);
				const matchOrder = rev.orderId.toLowerCase().includes(kw);
				const matchUser = rev.userName.toLowerCase().includes(kw);
				if (!matchComment && !matchOrder && !matchUser) return false;
			}

			return true;
		});
	}, [currentReviews, starFilter, replyFilter, reviewSearchKeyword]);

	// Phân trang
	const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
	const paginatedReviews = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredReviews.slice(start, start + pageSize);
	}, [filteredReviews, currentPage, pageSize]);

	// Gửi phản hồi đánh giá
	const handleSendReply = (reviewId: string) => {
		if (!replyContent.trim()) {
			toast.warning("Vui lòng nhập nội dung phản hồi!");
			return;
		}

		if (!selectedProduct) return;

		setReviewsState((prev) => {
			const prodReviews = prev[selectedProduct.id] || [];
			const updated = prodReviews.map((r) => {
				if (r.id === reviewId) {
					return {
						...r,
						sellerReply: {
							content: replyContent.trim(),
							repliedAt: "Vừa xong",
						},
					};
				}
				return r;
			});
			return { ...prev, [selectedProduct.id]: updated };
		});

		toast.success("Đã gửi phản hồi đánh giá thành công!");
		setActiveReplyId(null);
		setReplyContent("");
	};

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-300">
			{/* Header chuẩn phong cách các trang Seller */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-xl font-bold text-brand-dark mb-1">
						Quản Lý Đánh Giá Sản Phẩm
					</h1>
					<p className="text-xs text-brand-muted">
						{selectedProduct
							? `Đang xem đánh giá sản phẩm: ${selectedProduct.name}`
							: "Vui lòng chọn một sản phẩm bên dưới để xem toàn bộ đánh giá chi tiết và phản hồi khách hàng"}
					</p>
				</div>

				{selectedProduct && (
					<button
						type="button"
						onClick={() => {
							setSelectedProduct(null);
							setCurrentPage(1);
							setStarFilter("all");
							setReplyFilter("all");
							setReviewSearchKeyword("");
						}}
						className="px-3 py-1.5 rounded-md border border-brand-border bg-white text-xs font-bold text-brand-dark hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
					>
						<RotateCcw className="w-3.5 h-3.5 text-brand-muted" />
						Chọn sản phẩm khác
					</button>
				)}
			</div>

			{/* BƯỚC 1: CHỌN SẢN PHẨM TRƯỚC (NẾU CHƯA CHỌN) */}
			{!selectedProduct ? (
				<div className="space-y-4">
					{/* Thanh tìm kiếm sản phẩm */}
					<div className="flex items-center gap-3 bg-white border border-brand-border rounded-md p-3 shadow-xs">
						<Search className="w-4 h-4 text-brand-muted shrink-0" />
						<input
							type="text"
							value={productSearchKeyword}
							onChange={(e) => setProductSearchKeyword(e.target.value)}
							placeholder="Tìm kiếm sản phẩm theo tên, danh mục để xem đánh giá..."
							className="w-full text-xs font-medium text-brand-dark focus:outline-none bg-transparent"
						/>
						{productSearchKeyword && (
							<button
								type="button"
								onClick={() => setProductSearchKeyword("")}
								className="text-xs text-slate-400 hover:text-slate-600 font-bold"
							>
								Xóa
							</button>
						)}
					</div>

					{/* Danh sách thẻ sản phẩm để chọn (divs dùng rounded-md) */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredProducts.map((prod) => (
							<div
								key={prod.id}
								onClick={() => {
									setSelectedProduct(prod);
									setCurrentPage(1);
								}}
								className="bg-white border border-brand-border hover:border-brand-primary rounded-md p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
							>
								<div className="flex gap-3">
									<img
										src={prod.image}
										alt={prod.name}
										className="w-16 h-16 rounded-md object-cover border border-brand-border shrink-0 group-hover:scale-105 transition-transform"
									/>
									<div className="min-w-0 flex-1 space-y-1">
										<span className="text-[10px] font-bold text-brand-primary-deep uppercase block truncate">
											{prod.category}
										</span>
										<h3 className="text-xs font-bold text-brand-dark line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
											{prod.name}
										</h3>
										<span className="text-xs font-black text-rose-500 block">
											{prod.price.toLocaleString("vi-VN")}đ
										</span>
									</div>
								</div>

								<div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
									<div className="flex items-center gap-1 text-xs">
										<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
										<span className="font-extrabold text-brand-dark">{prod.rating}</span>
										<span className="text-[10px] text-brand-muted">
											({prod.reviewCount} đánh giá)
										</span>
									</div>
									<span className="text-[11px] font-bold text-brand-primary group-hover:underline">
										Xem đánh giá →
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				/* BƯỚC 2: KHI ĐÃ CHỌN SẢN PHẨM -> HIỂN THỊ CHI TIẾT ĐÁNH GIÁ */
				<div className="space-y-6">
					{/* Thẻ tóm tắt thông tin sản phẩm & Điểm trung bình (rounded-md) */}
					<div className="bg-white border border-brand-border rounded-md p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
						<div className="flex items-center gap-4 min-w-0">
							<img
								src={selectedProduct.image}
								alt={selectedProduct.name}
								className="w-20 h-20 rounded-md object-cover border border-brand-border shrink-0 shadow-2xs"
							/>
							<div className="space-y-1">
								<span className="text-[10px] font-bold text-brand-primary-deep uppercase block">
									{selectedProduct.category}
								</span>
								<h2 className="text-sm font-bold text-brand-dark leading-snug">
									{selectedProduct.name}
								</h2>
								<div className="flex items-center gap-3 pt-0.5">
									<span className="text-sm font-black text-rose-500">
										{selectedProduct.price.toLocaleString("vi-VN")}đ
									</span>
									<span className="text-xs text-brand-muted">
										Tổng số: <strong className="text-brand-dark">{currentReviews.length}</strong> đánh giá
									</span>
								</div>
							</div>
						</div>

						{/* Điểm đánh giá trung bình */}
						<div className="p-3 bg-brand-light-soft rounded-md border border-brand-border flex items-center gap-4 shrink-0">
							<div className="text-center">
								<div className="text-2xl font-black text-amber-500">{selectedProduct.rating}</div>
								<div className="flex items-center gap-0.5 justify-center mt-0.5">
									{[1, 2, 3, 4, 5].map((s) => (
										<Star
											key={s}
											className={`w-3.5 h-3.5 ${
												s <= Math.round(selectedProduct.rating)
													? "fill-amber-400 text-amber-400"
													: "text-slate-200"
											}`}
										/>
									))}
								</div>
								<span className="text-[9px] text-brand-muted font-semibold block mt-0.5">Trên 5 sao</span>
							</div>

							<div className="h-10 w-px bg-brand-border hidden sm:block" />

							{/* Thanh tỷ lệ nhanh */}
							<div className="text-[10px] text-slate-500 space-y-1 font-medium min-w-[120px]">
								<div className="flex justify-between">
									<span>5 sao:</span>
									<span className="font-bold text-brand-dark">82%</span>
								</div>
								<div className="flex justify-between">
									<span>4 sao:</span>
									<span className="font-bold text-brand-dark">12%</span>
								</div>
								<div className="flex justify-between">
									<span>3 sao trở xuống:</span>
									<span className="font-bold text-brand-dark">6%</span>
								</div>
							</div>
						</div>
					</div>

					{/* BỘ LỌC ĐÁNH GIÁ (rounded-md, không sắp xếp hay filter ảnh/video theo yêu cầu) */}
					<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-3">
							{/* Lọc theo số sao */}
							<div className="flex flex-wrap items-center gap-1.5">
								<button
									type="button"
									onClick={() => {
										setStarFilter("all");
										setCurrentPage(1);
									}}
									className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
										starFilter === "all"
											? "bg-brand-dark text-white border-brand-dark shadow-xs"
											: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
									}`}
								>
									Tất cả ({currentReviews.length})
								</button>
								{[5, 4, 3, 2, 1].map((s) => {
									const count = currentReviews.filter((r) => r.rating === s).length;
									return (
										<button
											key={s}
											type="button"
											onClick={() => {
												setStarFilter(s);
												setCurrentPage(1);
											}}
											className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
												starFilter === s
													? "bg-brand-dark text-white border-brand-dark shadow-xs"
													: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
											}`}
										>
											<span>{s}</span>
											<Star className="w-3 h-3 fill-amber-400 text-amber-400" />
											<span className="text-[10px] opacity-80">({count})</span>
										</button>
									);
								})}
							</div>

							{/* Lọc theo trạng thái phản hồi của Shop */}
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => {
										setReplyFilter("all");
										setCurrentPage(1);
									}}
									className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
										replyFilter === "all"
											? "bg-slate-800 text-white border-slate-800"
											: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
									}`}
								>
									Tất cả trạng thái
								</button>
								<button
									type="button"
									onClick={() => {
										setReplyFilter("unreplied");
										setCurrentPage(1);
									}}
									className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
										replyFilter === "unreplied"
											? "bg-amber-600 text-white border-amber-600"
											: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
									}`}
								>
									Chưa phản hồi
								</button>
								<button
									type="button"
									onClick={() => {
										setReplyFilter("replied");
										setCurrentPage(1);
									}}
									className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer border ${
										replyFilter === "replied"
											? "bg-emerald-600 text-white border-emerald-600"
											: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
									}`}
								>
									Đã phản hồi
								</button>
							</div>
						</div>

						{/* Tìm kiếm nội dung hoặc mã đơn */}
						<div className="flex items-center gap-2 pt-2 border-t border-slate-100">
							<Search className="w-3.5 h-3.5 text-brand-muted" />
							<input
								type="text"
								value={reviewSearchKeyword}
								onChange={(e) => {
									setReviewSearchKeyword(e.target.value);
									setCurrentPage(1);
								}}
								placeholder="Tìm kiếm nội dung bình luận, mã đơn hàng (#ORD...)..."
								className="w-full text-xs font-medium text-brand-dark focus:outline-none bg-transparent"
							/>
						</div>
					</div>

					{/* DANH SÁCH ĐÁNH GIÁ (Toàn bộ card dùng rounded-md) */}
					<div className="space-y-3">
						{paginatedReviews.length === 0 ? (
							<div className="bg-white border border-brand-border rounded-md p-10 text-center text-xs text-brand-muted font-medium">
								Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
							</div>
						) : (
							paginatedReviews.map((rev) => (
								<div
									key={rev.id}
									className="bg-white border border-brand-border rounded-md p-4 shadow-xs space-y-3 transition-colors hover:border-slate-300"
								>
									{/* Thông tin Người mua + Mã đơn hàng + Thời gian */}
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
										<div className="flex items-center gap-3">
											<img
												src={rev.userAvatar}
												alt={rev.userName}
												className="w-8 h-8 rounded-full object-cover border border-brand-border"
											/>
											<div>
												<span className="text-xs font-bold text-brand-dark block">
													{rev.userName}
												</span>
												<div className="flex items-center gap-2">
													{/* Số sao */}
													<div className="flex items-center gap-0.5">
														{[1, 2, 3, 4, 5].map((s) => (
															<Star
																key={s}
																className={`w-3 h-3 ${
																	s <= rev.rating
																		? "fill-amber-400 text-amber-400"
																		: "text-slate-200"
																}`}
															/>
														))}
													</div>
													<span className="text-[10px] text-brand-muted">{rev.createdAt}</span>
												</div>
											</div>
										</div>

										{/* MÃ ĐƠN HÀNG (orderId - USER REQUESTED) */}
										<div className="flex items-center gap-2 self-start sm:self-auto">
											<span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 border border-slate-200">
												<Receipt className="w-3 h-3 text-slate-500" />
												Đơn hàng: {rev.orderId}
											</span>
										</div>
									</div>

									{/* Phân loại hàng mua */}
									{rev.variantName && (
										<div className="text-[11px] text-brand-muted font-medium flex items-center gap-1.5">
											<span className="font-bold text-slate-600">Phân loại:</span>
											<span>{rev.variantName}</span>
										</div>
									)}

									{/* Nội dung đánh giá */}
									<p className="text-xs text-brand-dark leading-relaxed font-normal">
										{rev.comment}
									</p>

									{/* Hình ảnh đính kèm nếu có */}
									{rev.images && rev.images.length > 0 && (
										<div className="flex items-center gap-2 pt-1">
											{rev.images.map((img, idx) => (
												<img
													key={idx}
													src={img}
													alt={`Review image ${idx + 1}`}
													className="w-14 h-14 rounded-md object-cover border border-brand-border hover:opacity-90 cursor-pointer shadow-2xs"
												/>
											))}
										</div>
									)}

									{/* KHU VỰC PHẢN HỒI CỦA NGƯỜI BÁN */}
									{rev.sellerReply ? (
										<div className="bg-brand-light-soft border-l-2 border-brand-primary rounded-md p-3 space-y-1">
											<div className="flex items-center justify-between text-[11px]">
												<span className="font-black text-brand-primary-deep flex items-center gap-1">
													<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
													Phản hồi từ Người bán
												</span>
												<span className="text-[10px] text-brand-muted">{rev.sellerReply.repliedAt}</span>
											</div>
											<p className="text-xs text-slate-700 leading-relaxed font-medium">
												{rev.sellerReply.content}
											</p>
										</div>
									) : (
										<div className="pt-1">
											{activeReplyId === rev.id ? (
												<div className="space-y-2 bg-slate-50 p-3 rounded-md border border-brand-border">
													<textarea
														value={replyContent}
														onChange={(e) => setReplyContent(e.target.value)}
														placeholder="Nhập câu trả lời phản hồi cho khách hàng..."
														rows={3}
														className="w-full text-xs p-2 bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary text-brand-dark"
													/>
													<div className="flex items-center justify-end gap-2">
														<button
															type="button"
															onClick={() => {
																setActiveReplyId(null);
																setReplyContent("");
															}}
															className="px-3 py-1 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
														>
															Hủy
														</button>
														<button
															type="button"
															onClick={() => handleSendReply(rev.id)}
															className="px-3 py-1 rounded-md text-xs font-bold bg-brand-primary hover:bg-brand-primary-deep text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
														>
															<Send className="w-3 h-3" />
															Gửi phản hồi
														</button>
													</div>
												</div>
											) : (
												<button
													type="button"
													onClick={() => {
														setActiveReplyId(rev.id);
														setReplyContent("");
													}}
													className="text-xs font-bold text-brand-primary-deep hover:underline flex items-center gap-1 cursor-pointer"
												>
													<MessageSquare className="w-3.5 h-3.5" />
													Phản hồi đánh giá này
												</button>
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>

					{/* PHÂN TRANG (Pagination) */}
					{totalPages > 1 && (
						<div className="flex items-center justify-center gap-2 pt-3">
							<button
								type="button"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								className="p-1.5 rounded-md border border-brand-border bg-white text-xs font-bold text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<button
									key={page}
									type="button"
									onClick={() => setCurrentPage(page)}
									className={`w-7 h-7 rounded-md text-xs font-bold transition-colors cursor-pointer ${
										currentPage === page
											? "bg-brand-dark text-white shadow-xs"
											: "bg-white border border-brand-border text-slate-700 hover:bg-slate-50"
									}`}
								>
									{page}
								</button>
							))}
							<button
								type="button"
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
								className="p-1.5 rounded-md border border-brand-border bg-white text-xs font-bold text-brand-dark hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default SellerReviewsView;
