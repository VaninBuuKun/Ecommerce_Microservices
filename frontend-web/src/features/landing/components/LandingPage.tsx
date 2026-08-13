import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import CategoryList from "./CategoryList";
import { toast } from "react-toastify";
import { useProductsQuery } from "../../catalog/hooks/useProductsQuery";

export default function LandingPage() {
	const navigate = useNavigate();
	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};
	// Load actual active products from public catalog API
	const { data: publicProductsData } = useProductsQuery({
		limit: 10,
	});
	const suggestedList = publicProductsData?.items || [];

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

					{/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
						{trendingList.map((p) => (
							<motion.div
								whileHover={{ y: -4 }}
								key={p.id}
								onClick={() => navigate(`/products/${p.id}`)}
								className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative cursor-pointer"
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
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate("/cart");
											}}
											className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow border-none cursor-pointer"
										>
											<ShoppingBag className="w-3.5 h-3.5" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/products/${p.id}`);
											}}
											className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow border-none cursor-pointer"
										>
											<Eye className="w-3.5 h-3.5" />
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												toast.success(
													"Đã lưu vào danh sách yêu thích!",
												);
											}}
											className="p-2 bg-white text-brand-dark rounded hover:bg-brand-primary transition-colors shadow cursor-pointer border-none"
										>
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
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate("/cart");
											}}
											className="inline-flex items-center bg-brand-dark hover:bg-brand-primary text-white p-1.5 rounded transition-colors duration-200 border-none cursor-pointer"
										>
											<ShoppingBag className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							</motion.div>
						))}
					</div> */}
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
					{suggestedList.map((p) => (
						<motion.div
							whileHover={{ y: -4 }}
							key={p.id}
							onClick={() => navigate(`/products/${p.id}`)}
							className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative cursor-pointer"
						>
							<div className="aspect-square w-full overflow-hidden relative bg-brand-light border-b border-brand-border">
								<img
									src={p.thumbnailUrl}
									alt={p.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<span className="absolute top-2 left-2 bg-brand-primary text-brand-dark text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider">
									{p.tag ?? "Best seller"}
								</span>
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
										{p.averageRating}
									</span>
									<span className="text-[9px] text-brand-muted">
										({p.reviewCount})
									</span>
								</div>
								<div className="flex items-center justify-between pt-2 border-t border-brand-border">
									<div className="flex flex-col">
										<span className="font-bold text-brand-dark text-xs">
											{p.discountPrice}
										</span>
										<span className="text-[9px] text-brand-muted line-through">
											{p.price}
										</span>
									</div>
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
		</div>
	);
}
