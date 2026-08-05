import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
	ShoppingBag,
	ArrowRight,
	ShieldCheck,
	Truck,
	Star,
	Heart,
	Eye,
	Tag,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import CategoryList from "./CategoryList";
import { toast } from "react-toastify";

export default function LandingPage() {
	const categoryRef = useRef<HTMLDivElement>(null);

	const scrollContainer = (
		ref: React.RefObject<HTMLDivElement>,
		direction: "left" | "right",
	) => {
		if (ref.current) {
			const scrollAmount = direction === "left" ? -400 : 400;
			ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
		}
	};

	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	// MOCK DATA DANH MỤC (20 Items)
	const categories = [
		{
			id: 1,
			name: "Thời Trang Nam",
			icon: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 2,
			name: "Đồ Thể Thao",
			icon: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 3,
			name: "Phụ Kiện Luxury",
			icon: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 4,
			name: "Quần Jeans",
			icon: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 5,
			name: "Áo Khoác",
			icon: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 6,
			name: "Áo Thun",
			icon: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 7,
			name: "Giày Sneaker",
			icon: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 8,
			name: "Đồng Hồ",
			icon: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 9,
			name: "Túi Xách",
			icon: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 10,
			name: "Mắt Kính",
			icon: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 11,
			name: "Nón",
			icon: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 12,
			name: "Nước Hoa",
			icon: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 13,
			name: "Trang Sức",
			icon: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 14,
			name: "Đồ Bơi",
			icon: "https://images.unsplash.com/photo-1565538420870-da08ff96a207?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 15,
			name: "Đồ Lót",
			icon: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 16,
			name: "Trang Phục Dự Tiệc",
			icon: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 17,
			name: "Thời Trang Cổ Điển",
			icon: "https://images.unsplash.com/photo-1550614000-4b9b94098485?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 18,
			name: "Streetwear",
			icon: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 19,
			name: "Office Wear",
			icon: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&q=80&w=150",
		},
		{
			id: 20,
			name: "Limited Edition",
			icon: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&q=80&w=150",
		},
	];

	// MOCK DATA TOP DEALS (Thu nhỏ kích thước, đúng 5 item hiển thị chuẩn khung)
	const topDeals = [
		{
			id: 1,
			name: "Áo Hoodie Streetwear Emerald",
			price: "450.000đ",
			originalPrice: "590.000đ",
			rating: 4.9,
			reviewCount: 188,
			tag: "Flash Sale",
			image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 2,
			name: "Quần Cargo Đen Technical",
			price: "520.000đ",
			originalPrice: "680.000đ",
			rating: 4.8,
			reviewCount: 142,
			tag: "-30%",
			image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 3,
			name: "Túi Đeo Chéo Canvas Minimalist",
			price: "290.000đ",
			originalPrice: "390.000đ",
			rating: 4.7,
			reviewCount: 65,
			tag: "Best Seller",
			image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 4,
			name: "Áo Khoác Gió Waterproof",
			price: "750.000đ",
			originalPrice: "950.000đ",
			rating: 5.0,
			reviewCount: 55,
			tag: "-20%",
			image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 5,
			name: "Kính Râm Polarized",
			price: "390.000đ",
			originalPrice: "490.000đ",
			rating: 4.9,
			reviewCount: 94,
			tag: "Bán chạy",
			image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=500",
		},
	];

	// MOCK DATA SẢN PHẨM GỢI Ý (Đúng 5 item, áp dụng đúng design card nhỏ gọn của Top Deals)
	const suggestedProducts = [
		{
			id: 101,
			name: "Áo Thun Basic Cotton",
			price: "150.000đ",
			originalPrice: "200.000đ",
			rating: 4.8,
			reviewCount: 120,
			tag: "New",
			image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 102,
			name: "Nón Bucket Xám Khói",
			price: "120.000đ",
			originalPrice: "160.000đ",
			rating: 4.7,
			reviewCount: 85,
			tag: "-25%",
			image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 103,
			name: "Ví Da Bò Handmade",
			price: "450.000đ",
			originalPrice: "550.000đ",
			rating: 4.9,
			reviewCount: 64,
			tag: "Hot",
			image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 104,
			name: "Áo Sơ Mi Flannel",
			price: "320.000đ",
			originalPrice: "420.000đ",
			rating: 4.6,
			reviewCount: 92,
			tag: "-15%",
			image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 105,
			name: "Đồng Hồ Minimalist",
			price: "1.200.000đ",
			originalPrice: "1.500.000đ",
			rating: 5.0,
			reviewCount: 40,
			tag: "Luxury",
			image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 106,
			name: "Đồng Hồ Minimalist",
			price: "1.200.000đ",
			originalPrice: "1.500.000đ",
			rating: 5.0,
			reviewCount: 40,
			tag: "Luxury",
			image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 107,
			name: "Đồng Hồ Minimalist",
			price: "1.200.000đ",
			originalPrice: "1.500.000đ",
			rating: 5.0,
			reviewCount: 40,
			tag: "Luxury",
			image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 108,
			name: "Đồng Hồ Minimalist",
			price: "1.200.000đ",
			originalPrice: "1.500.000đ",
			rating: 5.0,
			reviewCount: 40,
			tag: "Luxury",
			image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500",
		},
		{
			id: 109,
			name: "Đồng Hồ Minimalist",
			price: "1.200.000đ",
			originalPrice: "1.500.000đ",
			rating: 5.0,
			reviewCount: 40,
			tag: "Luxury",
			image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=500",
		},
	];

	const testimonials = [
		{
			name: "Khánh Duy",
			role: "Chủ gian hàng thời trang",
			content:
				"Buu Store mang lại trải nghiệm marketplace cực kỳ mượt mà. Hệ thống quản lý đơn hàng và lượng khách truy cập đều đặn giúp việc kinh doanh hiệu quả hơn hẳn.",
			rating: 5,
		},
		{
			name: "Thu Trang",
			role: "Người mua sắm",
			content:
				"Tìm kiếm sản phẩm rất nhanh, giao diện tối giản, hiện đại và thanh toán tiện lợi. Rất thích các sản phẩm gợi ý tại đây.",
			rating: 5,
		},
	];

	return (
		<div className="min-h-screen flex flex-col bg-brand-light overflow-x-hidden scroll-smooth">
			<style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

			{/* 1. HERO SECTION */}
			<section className="relative bg-brand-light py-20 px-6 border-b border-brand-border">
				<div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="flex-1 space-y-6 text-left"
					>
						<h1 className="text-5xl md:text-6xl font-medium text-brand-dark leading-[1.05] tracking-[-0.03em] font-sans">
							Welcome to{" "}
							<span className="text-brand-primary">
								Buu Store
							</span>
							. <br />
							<span className="text-brand-muted text-3xl md:text-4xl font-normal">
								Multi-vendor marketplace đỉnh cao.
							</span>
						</h1>

						<p className="text-base md:text-lg text-brand-muted max-w-lg leading-relaxed">
							Khám phá thế giới mua sắm đa dạng tại Buu Store. Kết
							nối người mua và người bán với hệ thống giao dịch
							thông minh, tối ưu và nhanh chóng.
						</p>

						<div className="flex flex-wrap items-center gap-3 pt-4">
							{/* Nút 1: Khám phá sản phẩm (dẫn mượt đến gợi ý dành cho bạn) */}
							<button
								onClick={() => {
									toast.success("Hello");
									scrollToSection("suggested-products");
								}}
								className="inline-flex items-center gap-2 bg-brand-primary text-brand-dark px-5 py-2.5 rounded-sm font-medium text-sm hover:bg-brand-primary-deep transition-all duration-200 shadow-sm cursor-pointer"
							>
								Khám phá sản phẩm
								<ArrowRight className="w-4 h-4" />
							</button>

							{/* Nút 2: Hot trend (màu nhạt dần, dẫn mượt đến sản phẩm hot trend) */}
							<button
								onClick={() =>
									scrollToSection("trending-products")
								}
								className="px-5 py-2.5 border border-brand-border/60 text-brand-muted bg-white/50 rounded-sm font-medium text-sm hover:border-brand-dark hover:text-brand-dark transition-all duration-200 cursor-pointer"
							>
								Sản phẩm hot trend
							</button>

							{/* Nút 3: Trở thành người bán (chung hàng, không icon) */}
							<Link
								to="/register-seller"
								className="px-5 py-2.5 border border-brand-dark text-brand-dark bg-white rounded-sm font-medium text-sm hover:bg-brand-dark hover:text-white transition-all duration-200"
							>
								Trở thành người bán
							</Link>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.15 }}
						className="flex-1 relative w-full max-w-md lg:max-w-none flex flex-col items-end"
					>
						<motion.div
							animate={{ y: [-5, 5, -5] }}
							transition={{
								repeat: Infinity,
								duration: 4,
								ease: "easeInOut",
							}}
							className="w-full max-w-[320px] rounded-lg bg-brand-dark-surface p-4 border border-brand-dark-lift shadow-xl text-left text-white z-20 relative flex items-center gap-4"
						>
							<div className="bg-brand-primary/20 p-3 rounded-full text-brand-primary flex-shrink-0">
								<Tag className="w-6 h-6" />
							</div>
							<div>
								<h3 className="font-bold text-sm text-brand-primary tracking-wide">
									BUU STORE DEAL
								</h3>
								<p className="text-xs text-gray-300 mt-0.5">
									Mã{" "}
									<span className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">
										BUU20
									</span>{" "}
									giảm 20% toàn sàn.
								</p>
							</div>
						</motion.div>

						<div className="aspect-[4/3] w-full max-w-[360px] rounded-lg overflow-hidden border border-brand-border shadow-lg mt-[-30px] mr-[40px] z-10 relative">
							<img
								src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=500"
								alt="Buu Store Marketplace"
								className="w-full h-full object-cover"
							/>
						</div>
					</motion.div>
				</div>
			</section>

			{/* 2. DANH MỤC LƯỚT NGANG */}

			<CategoryList />

			{/* 3. TOP DEALS (SẢN PHẨM ĐANG HOT TREND) */}
			<section
				id="trending-products"
				className="py-20 bg-brand-light-soft border-y border-brand-border scroll-mt-6"
			>
				<div className="max-w-6xl mx-auto px-6 w-full">
					<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 text-left">
						<div>
							<span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-2">
								// TRENDING
							</span>
							<h2 className="text-3xl font-bold text-brand-dark tracking-tight">
								Sản Phẩm Đang Hot Trend
							</h2>
						</div>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
						{topDeals.map((p) => (
							<motion.div
								whileHover={{ y: -4 }}
								key={p.id}
								className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative"
							>
								<div className="aspect-square w-full overflow-hidden relative bg-brand-light border-b border-brand-border">
									<img
										src={p.image}
										alt={p.name}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
									{p.tag && (
										<span className="absolute top-2 left-2 bg-brand-primary text-brand-dark text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider">
											{p.tag}
										</span>
									)}
									<div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 z-10">
										<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
											<ShoppingBag className="w-3.5 h-3.5" />
										</button>
										<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
											<Eye className="w-3.5 h-3.5" />
										</button>
										<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
											<Heart className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>

								<div className="p-3.5 flex-1 flex flex-col text-left justify-between space-y-2.5">
									<div className="space-y-0.5">
										<span className="text-[8px] text-brand-muted font-bold uppercase tracking-wider">
											BUU STORE
										</span>
										<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary transition-colors line-clamp-1">
											{p.name}
										</h3>
									</div>
									<div className="flex items-center gap-1">
										<Star className="w-3 h-3 fill-brand-primary stroke-brand-primary" />
										<span className="text-[11px] font-bold text-brand-dark">
											{p.rating}
										</span>
										<span className="text-[9px] text-brand-muted">
											({p.reviewCount})
										</span>
									</div>
									<div className="flex items-center justify-between pt-2 border-t border-brand-border">
										<div className="flex flex-col">
											<span className="font-bold text-brand-dark text-xs">
												{p.price}
											</span>
											{p.originalPrice && (
												<span className="text-[9px] text-brand-muted line-through">
													{p.originalPrice}
												</span>
											)}
										</div>
										<Link
											to="/cart"
											className="inline-flex items-center bg-brand-dark hover:bg-brand-primary text-white p-1.5 rounded transition-colors duration-200"
										>
											<ShoppingBag className="w-3.5 h-3.5" />
										</Link>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* 4. GỢI Ý DÀNH CHO BẠN */}
			<section
				id="suggested-products"
				className="py-20 px-6 max-w-6xl mx-auto w-full scroll-mt-6"
			>
				<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 text-left">
					<div>
						<span className="text-xs font-bold text-brand-primary uppercase tracking-widest block mb-2">
							// FOR YOU
						</span>
						<h2 className="text-3xl font-bold text-brand-dark tracking-tight">
							Gợi Ý Dành Cho Bạn
						</h2>
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
					{suggestedProducts.map((p) => (
						<motion.div
							whileHover={{ y: -4 }}
							key={p.id}
							className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative"
						>
							<div className="aspect-square w-full overflow-hidden relative bg-brand-light border-b border-brand-border">
								<img
									src={p.image}
									alt={p.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								{p.tag && (
									<span className="absolute top-2 left-2 bg-brand-primary text-brand-dark text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider">
										{p.tag}
									</span>
								)}
								<div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 z-10">
									<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
										<ShoppingBag className="w-3.5 h-3.5" />
									</button>
									<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
										<Eye className="w-3.5 h-3.5" />
									</button>
									<button className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow">
										<Heart className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							<div className="p-3.5 flex-1 flex flex-col text-left justify-between space-y-2.5">
								<div className="space-y-0.5">
									<span className="text-[8px] text-brand-muted font-bold uppercase tracking-wider">
										BUU STORE
									</span>
									<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary transition-colors line-clamp-1">
										{p.name}
									</h3>
								</div>
								<div className="flex items-center gap-1">
									<Star className="w-3 h-3 fill-brand-primary stroke-brand-primary" />
									<span className="text-[11px] font-bold text-brand-dark">
										{p.rating}
									</span>
									<span className="text-[9px] text-brand-muted">
										({p.reviewCount})
									</span>
								</div>
								<div className="flex items-center justify-between pt-2 border-t border-brand-border">
									<div className="flex flex-col">
										<span className="font-bold text-brand-dark text-xs">
											{p.price}
										</span>
										{p.originalPrice && (
											<span className="text-[9px] text-brand-muted line-through">
												{p.originalPrice}
											</span>
										)}
									</div>
									<Link
										to="/cart"
										className="inline-flex items-center bg-brand-dark hover:bg-brand-primary text-white p-1.5 rounded transition-colors duration-200"
									>
										<ShoppingBag className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</section>

			{/* 5. MARKETPLACE VALUES */}
			<section className="py-20 px-6 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
				<div className="relative">
					<div className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg border border-brand-border">
						<img
							src="https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600"
							alt="Buu Store Marketplace Platform"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="absolute -bottom-4 -right-4 w-36 bg-brand-dark-surface border border-brand-dark-lift p-4 rounded-lg text-left text-white shadow-xl">
						<span className="text-2xl font-bold text-brand-primary block mb-0.5">
							1000+
						</span>
						<span className="text-[10px] font-medium leading-tight text-gray-400 block">
							Gian hàng uy tín trên sàn
						</span>
					</div>
				</div>

				<div className="text-left space-y-5">
					<span className="text-xs font-bold text-brand-primary uppercase tracking-widest block">
						// MARKETPLACE DNA
					</span>
					<h2 className="text-3xl font-bold text-brand-dark tracking-tight leading-tight">
						Nền Tảng Mua Sắm Đa Nhà Bán Hàng
					</h2>
					<p className="text-brand-muted text-sm leading-relaxed">
						Buu Store kết nối hàng nghìn thương hiệu và cửa hàng
						chất lượng cao. Chúng tôi cung cấp công cụ quản lý toàn
						diện giúp các nhà bán hàng dễ dàng tiếp cận khách hàng
						tiềm năng và tối ưu hóa doanh thu một cách chuyên
						nghiệp.
					</p>

					<div className="space-y-4 pt-3 border-t border-brand-border">
						<div className="flex gap-3">
							<div className="p-2 bg-brand-primary/10 text-brand-primary-deep rounded h-fit">
								<Truck className="w-4 h-4" />
							</div>
							<div>
								<h4 className="font-bold text-sm text-brand-dark">
									Vận chuyển thông minh
								</h4>
								<p className="text-xs text-brand-muted">
									Hệ thống liên kết các đơn vị vận chuyển uy
									tín, giao hàng nhanh chóng trên toàn quốc.
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<div className="p-2 bg-brand-primary/10 text-brand-primary-deep rounded h-fit">
								<ShieldCheck className="w-4 h-4" />
							</div>
							<div>
								<h4 className="font-bold text-sm text-brand-dark">
									Thanh toán an toàn
								</h4>
								<p className="text-xs text-brand-muted">
									Bảo vệ quyền lợi người mua và người bán với
									cơ chế giữ tiền trung gian minh bạch.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 6. TESTIMONIALS */}
			<section className="py-20 bg-brand-light-soft border-t border-brand-border">
				<div className="max-w-4xl mx-auto px-6 text-center space-y-12">
					<div className="space-y-2">
						<span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
							// REVIEWS
						</span>
						<h2 className="text-3xl font-bold text-brand-dark tracking-tight">
							Được Tin Dùng Bởi Cộng Đồng
						</h2>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
						{testimonials.map((t, i) => (
							<div
								key={i}
								className="bg-white p-6 rounded-lg border border-brand-border shadow-sm flex flex-col justify-between space-y-5"
							>
								<p className="text-brand-dark text-sm font-medium leading-relaxed italic">
									"{t.content}"
								</p>
								<div className="flex items-center justify-between border-t border-brand-border/60 pt-3">
									<div>
										<h4 className="font-bold text-xs text-brand-dark">
											{t.name}
										</h4>
										<span className="text-[10px] text-brand-muted">
											{t.role}
										</span>
									</div>
									<div className="flex gap-0.5">
										{Array.from({ length: t.rating }).map(
											(_, idx) => (
												<Star
													key={idx}
													className="w-3 h-3 fill-brand-primary stroke-brand-primary"
												/>
											),
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
