import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	ArrowRight,
	Gift,
	Award,
	ShoppingBag,
	Home,
	Percent,
	Zap,
	Laptop,
	Tag,
} from "lucide-react";
import { bannerApi, type BannerDto } from "@/domains/admin";

// Quick Feature Shortcut Badges
const QUICK_SHORTCUTS = [
	{ id: 1, label: "Giựt Cố Hồn Ngay", icon: Gift, color: "bg-purple-100 text-purple-600" },
	{ id: 2, label: "Khách Hàng Thân Thiết", icon: Award, color: "bg-blue-100 text-blue-600" },
	{ id: 3, label: "Buu Trading", icon: ShoppingBag, color: "bg-emerald-100 text-emerald-600" },
	{ id: 4, label: "Đại Siêu Thị Online", icon: Home, color: "bg-amber-100 text-amber-600" },
	{ id: 5, label: "Hot Coupon Mỗi Ngày", icon: Percent, color: "bg-rose-100 text-rose-600" },
	{ id: 6, label: "Tựu Trường Deal Hời", icon: Zap, color: "bg-indigo-100 text-indigo-600" },
	{ id: 7, label: "Thiết Bị Văn Phòng", icon: Laptop, color: "bg-cyan-100 text-cyan-600" },
	{ id: 8, label: "Xả Kho Nửa Giá", icon: Tag, color: "bg-orange-100 text-orange-600" },
];

export function HeroBannerSection() {
	const navigate = useNavigate();
	const [activeBanner, setActiveBanner] = useState(0);
	const [banners, setBanners] = useState<BannerDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Load dynamic banners từ Backend API (Không dùng mock data)
	useEffect(() => {
		let isMounted = true;
		setIsLoading(true);
		bannerApi.getActiveBanners()
			.then((data) => {
				if (isMounted) {
					setBanners(data || []);
				}
			})
			.catch(() => {
				if (isMounted) {
					setBanners([]);
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsLoading(false);
				}
			});
		return () => {
			isMounted = false;
		};
	}, []);

	// Auto rotate Banners every 5s nếu có nhiều hơn 1 banner
	useEffect(() => {
		if (banners.length <= 1) return;
		const timer = setInterval(() => {
			setActiveBanner((prev) => (prev + 1) % banners.length);
		}, 5000);
		return () => clearInterval(timer);
	}, [banners.length]);

	const currentBanner = banners[activeBanner];

	const handleNavigate = (url?: string) => {
		const target = url || "/products";
		if (target.startsWith("http://") || target.startsWith("https://")) {
			window.open(target, "_blank");
		} else {
			navigate(target);
		}
	};

	return (
		<div className="space-y-3">
			{/* Banner Card Container */}
			<div className="bg-white border border-brand-border/70 rounded-xl p-3 shadow-2xs space-y-2">
				{isLoading ? (
					/* SKELETON LOADING KHI CHƯA TẢI XONG BANNER */
					<div className="w-full h-[250px] md:h-[270px] rounded-lg overflow-hidden relative bg-slate-200 animate-pulse flex flex-col justify-between p-6">
						<div className="space-y-3 max-w-md">
							{/* Badge Skeleton */}
							<div className="w-28 h-5 bg-slate-300 rounded-full" />
							{/* Title Skeleton */}
							<div className="space-y-2">
								<div className="w-full h-6 bg-slate-300 rounded" />
								<div className="w-3/4 h-6 bg-slate-300 rounded" />
							</div>
							{/* Subtitle Skeleton */}
							<div className="w-1/2 h-4 bg-slate-300 rounded" />
						</div>

						{/* Button Skeleton */}
						<div className="w-28 h-8 bg-slate-300 rounded-lg" />
					</div>
				) : banners.length > 0 && currentBanner ? (
					/* HIỂN THỊ BANNER THẬT TỪ DATABASE */
					<>
						<div className="w-full h-[250px] md:h-[270px] relative rounded-lg overflow-hidden shadow-2xs border border-brand-border/60 group">
							<AnimatePresence mode="wait">
								<motion.div
									key={currentBanner.id || activeBanner}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.4 }}
									className={`w-full h-full relative p-5 flex flex-col justify-between ${currentBanner.themeGradient || "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"}`}
								>
									<div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
										<img
											src={currentBanner.imageUrl}
											alt={currentBanner.title}
											className="w-full h-full object-cover"
										/>
									</div>

									<div className="relative z-10 space-y-1 max-w-lg text-left text-white">
										{currentBanner.badge && (
											<span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/30">
												{currentBanner.badge}
											</span>
										)}
										<h2 className="text-lg md:text-xl font-black leading-tight tracking-tight drop-shadow-md">
											{currentBanner.title}
										</h2>
										{currentBanner.subtitle && (
											<p className="text-[11px] text-white/90 font-medium leading-relaxed">
												{currentBanner.subtitle}
											</p>
										)}
									</div>

									<div className="relative z-10 flex items-center justify-between">
										<button
											onClick={() => handleNavigate(currentBanner.targetUrl)}
											className="px-3.5 py-1.5 bg-white text-brand-dark hover:bg-brand-primary hover:text-white font-black text-xs rounded-lg shadow-md transition-all duration-200 cursor-pointer border-none flex items-center gap-1.5"
										>
											{currentBanner.buttonText || "Mua ngay"}
											<ArrowRight className="w-3.5 h-3.5" />
										</button>
									</div>
								</motion.div>
							</AnimatePresence>

							{banners.length > 1 && (
								<>
									<button
										onClick={() =>
											setActiveBanner(
												(prev) => (prev - 1 + banners.length) % banners.length,
											)
										}
										className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-brand-dark flex items-center justify-center shadow-md transition-all border-none cursor-pointer opacity-0 group-hover:opacity-100"
									>
										<ChevronLeft className="w-4 h-4" />
									</button>
									<button
										onClick={() =>
											setActiveBanner((prev) => (prev + 1) % banners.length)
										}
										className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-brand-dark flex items-center justify-center shadow-md transition-all border-none cursor-pointer opacity-0 group-hover:opacity-100"
									>
										<ChevronRight className="w-4 h-4" />
									</button>
								</>
							)}
						</div>

						{/* Dedicated Banner Indicator Bar */}
						{banners.length > 1 && (
							<div className="flex items-center justify-center gap-2 pt-1">
								{banners.map((b, idx) => (
									<button
										key={b.id || idx}
										onClick={() => setActiveBanner(idx)}
										className={`h-1.5 rounded-full transition-all duration-300 border-none cursor-pointer ${
											idx === activeBanner
												? "w-8 bg-blue-600 shadow-xs"
												: "w-2.5 bg-gray-300 hover:bg-gray-400"
										}`}
										title={`Banner ${idx + 1}`}
									/>
								))}
							</div>
						)}
					</>
				) : null}
			</div>

			{/* Quick Shortcuts Bar */}
			<div className="bg-white border border-brand-border/70 rounded-xl p-3 shadow-2xs">
				<div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
					{QUICK_SHORTCUTS.map((item) => {
						const IconComp = item.icon;
						return (
							<button
								key={item.id}
								onClick={() => navigate("/products")}
								className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-brand-light-soft transition-all border-none bg-transparent cursor-pointer group"
							>
								<div className={`p-2 rounded-lg ${item.color} group-hover:scale-110 transition-transform shadow-2xs`}>
									<IconComp className="w-4 h-4" />
								</div>
								<span className="text-[10px] font-bold text-brand-dark line-clamp-1 leading-tight">
									{item.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
