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
const MOCK_SELLER_PRODUCTS: ProductItem[] = [
	{
		id: "prod-1",
		name: "Bàn phím cơ không dây Bluetooth RGB Hot-swap Gateron Pro",
		image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80",
		price: 950000,
		rating: 4.8,
		reviewCount: 142,
		category: "Phụ kiện máy tính",
	},
	{
		id: "prod-2",
		name: "Chuột Gaming công thái học không dây 26000 DPI siêu nhẹ 49g",
		image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop&q=80",
		price: 690000,
		rating: 4.9,
		reviewCount: 98,
		category: "Chuột & Bàn di chuột",
	},
	{
		id: "prod-3",
		name: "Tấm lót chuột bàn di chuột cỡ lớn 90x40cm chống trượt viền may",
		image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=200&auto=format&fit=crop&q=80",
		price: 120000,
		rating: 4.7,
		reviewCount: 280,
		category: "Phụ kiện Gaming",
	},
	{
		id: "prod-4",
		name: "Giá đỡ màn hình máy tính công thái học tải trọng 9kg xoay 360",
		image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=200&auto=format&fit=crop&q=80",
		price: 480000,
		rating: 4.6,
		reviewCount: 65,
		category: "Nội thất & Setup",
	},
	{
		id: "prod-5",
		name: "Tai nghe Gaming Chụp tai 7.1 Surround Mic lọc ồn RGB",
		image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80",
		price: 850000,
		rating: 4.9,
		reviewCount: 112,
		category: "Âm thanh & Tai nghe",
	},
];

// Danh sách đánh giá mẫu theo sản phẩm kèm orderId
const MOCK_REVIEWS_MAP: Record<string, ReviewItem[]> = {
	"prod-1": [
		{
			id: "rev-101",
			orderId: "ORD-2026-98124",
			userName: "nguyenvana_hanoi",
			userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "10:25 08/09/2026",
			variantName: "Màu Trắng / Gateron Yellow Switch",
			comment:
				"Bàn phím gõ rất đầm tay, switch pre-lubed êm ru không hề bị lọc xọc. Kết nối Bluetooth với cả Mac và Windows đều nhận ngay lập tức, pin dùng 2 tuần chưa thấy báo yếu.",
			images: [
				"https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80",
				"https://images.unsplash.com/photo-1595225476474-87563907a212?w=300&auto=format&fit=crop&q=80",
			],
			sellerReply: {
				content:
				"Cảm ơn bạn đã tin tưởng và ủng hộ gian hàng! Nếu cần hỗ trợ keycap hay phụ kiện gì thêm cứ nhắn tin trực tiếp cho shop nhé ạ ❤️",
				repliedAt: "11:10 08/09/2026",
			},
		},
		{
			id: "rev-102",
			orderId: "ORD-2026-97950",
			userName: "tran_hoang_bach",
			userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "14:12 06/09/2026",
			variantName: "Màu Đen / Gateron Red Switch",
			comment:
				"Giao hàng nhanh bất ngờ, đóng hộp bọc xốp 3 lớp rất cẩn thận. Led RGB nhiều chế độ sáng đẹp mắt, app chỉnh keymap dễ xài.",
		},
		{
			id: "rev-103",
			orderId: "ORD-2026-96410",
			userName: "leminh_gamer",
			userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
			rating: 4,
			createdAt: "09:40 03/09/2026",
			variantName: "Màu Xám / Gateron Brown Switch",
			comment:
				"Bàn phím ngon trong tầm giá. Điểm trừ nhẹ là dây cáp type C kèm theo hơi ngắn một xíu nếu để case máy tính dưới gầm bàn.",
			sellerReply: {
				content:
				"Dạ shop ghi nhận góp ý về độ dài dây cáp của bạn để cải tiến lô sản phẩm tiếp theo ạ. Chúc bạn có trải nghiệm làm việc và chơi game tuyệt vời!",
				repliedAt: "10:15 03/09/2026",
			},
		},
		{
			id: "rev-104",
			orderId: "ORD-2026-95118",
			userName: "pham_thuy_trang",
			userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "16:30 28/08/2026",
			variantName: "Màu Trắng / Gateron Red Switch",
			comment: "Mua tặng sinh nhật bạn trai mà ổng khen nức nở. Shop tư vấn nhiệt tình, đóng gói quà cũng rất xinh xắn.",
		},
		{
			id: "rev-105",
			orderId: "ORD-2026-94892",
			userName: "vu_quoc_anh",
			userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80",
			rating: 3,
			createdAt: "11:05 24/08/2026",
			variantName: "Màu Đen / Gateron Blue Switch",
			comment:
				"Tiếng gõ switch blue hơi ồn hơn mình tưởng tượng khi dùng trong văn phòng mở. Bù lại build cứng cáp, gõ nảy.",
		},
		{
			id: "rev-106",
			orderId: "ORD-2026-93214",
			userName: "hoang_tuan_pro",
			userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "18:45 19/08/2026",
			variantName: "Màu Trắng / Gateron Yellow Switch",
			comment: "Keycap PBT dày dặn không bị bóng mồ hôi. Hotswap 5 pin thay switch cực kỳ dễ. Đáng từng xu!",
		},
	],
	"prod-2": [
		{
			id: "rev-201",
			orderId: "ORD-2026-98842",
			userName: "son_tung_mtp_fan",
			userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "15:20 09/09/2026",
			variantName: "Màu Trắng / Bản 4K Receiver",
			comment: "Chuột nhẹ tênh chỉ 49g lướt pad sướng tay cực kỳ. Mắt đọc PAW3395 không hề bị trễ hay jitter.",
			sellerReply: {
				content: "Shop cảm ơn bạn đã đánh giá! Bản 4K polling rate đem lại độ nhạy thi đấu đỉnh cao luôn ạ!",
				repliedAt: "16:00 09/09/2026",
			},
		},
		{
			id: "rev-202",
			orderId: "ORD-2026-97621",
			userName: "duc_nguyen_fps",
			userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80",
			rating: 5,
			createdAt: "10:10 07/09/2026",
			variantName: "Màu Đen Nhám",
			comment: "Form cầm công thái học ôm tay, chơi CS2 bắn vẩy snap tâm cực chuẩn. Pin trâu dùng cả tuần chưa cần sạc.",
		},
	],
};

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
