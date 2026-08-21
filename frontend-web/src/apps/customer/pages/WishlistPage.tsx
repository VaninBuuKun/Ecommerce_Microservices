import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWishlist } from "@/domains/catalog/hooks/useWishlist";
import { WishlistButton } from "@/domains/catalog/components/WishlistButton";
import { Heart, ShoppingBag, Star, Store } from "lucide-react";

export const WishlistPage: React.FC = () => {
	const navigate = useNavigate();
	const { wishlistItems, isLoading } = useWishlist();

	return (
		<div className="min-h-screen bg-brand-light flex flex-col font-sans">
			<main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
				{/* Page Header */}
				<div className="flex items-center justify-between mb-8 border-b border-brand-border pb-4 text-left">
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-brand-dark flex items-center gap-3">
							<Heart className="fill-rose-500 text-rose-500" size={28} />
							Sản Phẩm Yêu Thích
						</h1>
						<p className="text-xs md:text-sm text-brand-muted mt-1">
							Danh sách các sản phẩm bạn đã lưu để xem lại hoặc mua sau
						</p>
					</div>
					<span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
						{wishlistItems.length} sản phẩm
					</span>
				</div>

				{/* Loading State */}
				{isLoading ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="bg-white rounded-lg p-3 border border-brand-border animate-pulse space-y-3">
								<div className="bg-slate-200 aspect-square rounded-md w-full" />
								<div className="bg-slate-200 h-4 w-3/4 rounded" />
								<div className="bg-slate-200 h-3 w-1/2 rounded" />
								<div className="bg-slate-200 h-5 w-1/3 rounded" />
							</div>
						))}
					</div>
				) : wishlistItems.length === 0 ? (
					/* Empty State */
					<div className="bg-white rounded-2xl p-12 text-center border border-brand-border max-w-lg mx-auto my-12 shadow-sm">
						<div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5">
							<Heart size={32} className="fill-rose-100" />
						</div>
						<h2 className="text-lg font-bold text-brand-dark mb-2">Chưa có sản phẩm yêu thích</h2>
						<p className="text-brand-muted text-xs mb-6">
							Hãy bấm vào biểu tượng trái tim trên các sản phẩm bạn thích để lưu lại vào đây.
						</p>
						<Link
							to="/"
							className="inline-flex items-center justify-center gap-2 bg-brand-primary text-brand-dark font-bold px-6 py-2.5 rounded-sm hover:bg-brand-primary-deep transition-all text-xs"
						>
							<ShoppingBag size={16} />
							Khám phá ngay
						</Link>
					</div>
				) : (
					/* Wishlist Product Grid — Y chang card thiết kế LandingPage.tsx */
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
						{wishlistItems.map((p: any) => (
							<motion.div
								whileHover={{ y: -4 }}
								key={p.id}
								onClick={() => navigate(`/products/${p.id}`)}
								className="group flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 relative cursor-pointer"
							>
								{/* Thumbnail & Badges */}
								<div className="aspect-square w-full overflow-hidden relative bg-brand-light border-b border-brand-border">
									<img
										src={p.thumbnailUrl || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300"}
										alt={p.name}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
									/>
									<span className="absolute top-2 left-2 bg-brand-primary text-brand-dark text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider z-10">
										{p.categoryName || p.tag || "Love"}
									</span>

									{/* Heart Button Toggle */}
									<div
										className="absolute top-2 right-2 z-20"
										onClick={(e) => e.stopPropagation()}
									>
										<WishlistButton productId={p.id} />
									</div>
								</div>

								{/* Product Details */}
								<div className="p-3.5 flex-1 flex flex-col text-left justify-between space-y-2.5">
									<div className="space-y-0.5">
										<div className="flex items-center gap-1 text-[8px] text-brand-muted font-bold uppercase tracking-wider truncate">
											<Store className="w-2.5 h-2.5 shrink-0 text-brand-primary" />
											<span className="truncate">{p.shopName || `Shop #${p.shopId}`}</span>
										</div>
										<h3 className="font-bold text-brand-dark text-xs group-hover:text-brand-primary transition-colors line-clamp-1">
											{p.name}
										</h3>
									</div>

									{/* Rating */}
									<div className="flex items-center gap-1">
										<Star className="w-3 h-3 fill-brand-primary stroke-brand-primary" />
										<span className="text-[11px] font-bold text-brand-dark">
											{p.averageRating || 5.0}
										</span>
										<span className="text-[9px] text-brand-muted">
											({p.reviewCount || 0})
										</span>
									</div>

									{/* Prices */}
									<div className="flex items-center justify-between pt-2 border-t border-brand-border">
										<div className="flex flex-col">
											<span className="font-bold text-brand-dark text-xs">
												{(p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString("vi-VN")}đ
											</span>
											{p.discountPrice > 0 && p.price > p.discountPrice && (
												<span className="text-[9px] text-brand-muted line-through">
													{p.price?.toLocaleString("vi-VN")}đ
												</span>
											)}
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</main>

			<footer className="mt-auto py-8 border-t border-brand-border bg-brand-light text-center text-xs text-brand-muted font-sans">
				<p>© 2026 BUU Store Marketplace Platform. All rights reserved.</p>
			</footer>
		</div>
	);
};

export default WishlistPage;
