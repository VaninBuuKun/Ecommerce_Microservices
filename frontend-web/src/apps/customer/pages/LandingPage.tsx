import {
	CategorySidebar,
	HeroBannerSection,
	BestSellersSection,
	InterestedProductsSection,
	TodayRecommendationsSection,
} from "@/domains/catalog";

export default function LandingPage() {
	return (
		<div className="w-full max-w-[1360px] mx-auto px-2 sm:px-3 py-3 font-sans">
			<style>{`
				.category-scrollbar::-webkit-scrollbar { width: 4px; }
				.category-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
				.category-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
				.hide-scrollbar::-webkit-scrollbar { display: none; }
				.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
			`}</style>

			{/* 2-COLUMN LAYOUT: LEFT SIDEBAR VS RIGHT MAIN CONTENT */}
			<div className="flex gap-3.5 items-start">
				{/* LEFT COLUMN: SIDEBAR (PROMO CARD + CATEGORY CARD) */}
				<CategorySidebar />

				{/* RIGHT COLUMN: BANNER + SHORTCUTS + ALL PRODUCT SECTIONS */}
				<div className="flex-1 min-w-0 space-y-3">
					{/* 1. HERO BLOCK: BANNER + SHORTCUTS */}
					<HeroBannerSection />

					{/* 2. SECTION: SẢN PHẨM BÁN CHẠY (BEST SELLERS) */}
					<BestSellersSection />

					{/* 3. SECTION: SẢN PHẨM BẠN QUAN TÂM (INTERESTED PRODUCTS) */}
					<InterestedProductsSection />

					{/* 4. SECTION: GỢI Ý HÔM NAY (TODAY'S RECOMMENDATIONS) */}
					<TodayRecommendationsSection />
				</div>
			</div>
		</div>
	);
}
