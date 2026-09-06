import { useState } from "react";
import { Star, Play, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	useProductReviewsQuery,
	useProductReviewsSummaryQuery,
} from "@/domains/catalog";

interface ProductReviewsSectionProps {
	productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [activeTab, setActiveTab] = useState<number | "all">("all");
	const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);

	const { data: reviewsData, isLoading: isReviewsLoading } = useProductReviewsQuery(productId);
	const { data: summary, isLoading: isSummaryLoading } = useProductReviewsSummaryQuery(productId);

	const isVideo = (url: string) => {
		return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video") || url.includes("stream");
	};

	if (isSummaryLoading) {
		return (
			<div className="flex justify-center items-center py-10 gap-2 text-xs font-bold text-slate-500">
				<Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
				Đang tải đánh giá sản phẩm...
			</div>
		);
	}

	const ratingsSummary = summary || {
		averageRating: 0,
		totalReviews: 0,
		oneStarCount: 0,
		twoStarCount: 0,
		threeStarCount: 0,
		fourStarCount: 0,
		fiveStarCount: 0,
	};

	const getPercentage = (count: number) => {
		if (ratingsSummary.totalReviews === 0) return 0;
		return Math.round((count / ratingsSummary.totalReviews) * 100);
	};

	const starsBreakdown = [
		{ star: 5, count: ratingsSummary.fiveStarCount },
		{ star: 4, count: ratingsSummary.fourStarCount },
		{ star: 3, count: ratingsSummary.threeStarCount },
		{ star: 2, count: ratingsSummary.twoStarCount },
		{ star: 1, count: ratingsSummary.oneStarCount },
	];

	const allReviews = reviewsData?.items || [];
	const filteredReviews =
		activeTab === "all"
			? allReviews
			: allReviews.filter((r: any) => r.rating === activeTab);

	return (
		<div className="space-y-8 py-8 border-t border-slate-200 text-xs font-sans text-slate-800 animate-in fade-in duration-300">
			{/* Header: Khách hàng đánh giá & Tổng quan */}
			<div className="text-left space-y-4">
				<h2 className="text-lg font-black text-slate-900 tracking-tight">
					Khách hàng đánh giá
				</h2>

				<div className="bg-white border border-brand-border rounded-md p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-2xl">
					{/* Div bên trái: Tổng quan */}
					<div className="space-y-2">
						<h3 className="text-sm font-bold text-slate-800">
							Tổng quan
						</h3>
						<div className="flex items-center gap-3">
							<span className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
								{ratingsSummary.totalReviews > 0 ? ratingsSummary.averageRating.toFixed(1) : "0.0"}
							</span>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((s) => (
									<Star
										key={s}
										className={`w-5 h-5 ${
											s <= Math.round(ratingsSummary.averageRating) && ratingsSummary.totalReviews > 0
												? "text-amber-400 fill-amber-400"
												: "text-slate-200 fill-slate-200"
										}`}
									/>
								))}
							</div>
						</div>
						<p className="text-xs text-slate-500 font-medium">
							({ratingsSummary.totalReviews} đánh giá)
						</p>
					</div>

					{/* Div bên phải: Các mức sao xếp hạng */}
					<div className="space-y-2.5">
						{starsBreakdown.map(({ star, count }) => {
							const pct = getPercentage(count);
							return (
								<div key={star} className="flex items-center gap-3">
									{/* 5 mini stars */}
									<div className="flex items-center gap-0.5 w-20 shrink-0">
										{[1, 2, 3, 4, 5].map((idx) => (
											<Star
												key={idx}
												className={`w-3.5 h-3.5 ${
													idx <= star
														? "text-amber-400 fill-amber-400"
														: "text-slate-200 fill-slate-200"
												}`}
											/>
										))}
									</div>

									{/* Progress track */}
									<div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
										<div
											className="h-full bg-amber-400 rounded-full transition-all duration-500"
											style={{ width: `${pct}%` }}
										/>
									</div>

									{/* Count */}
									<span className="text-xs font-semibold text-slate-600 min-w-[20px] text-right font-mono">
										{count}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Reviews List & Filter tabs */}
			<div className="space-y-5 text-left">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
					<h3 className="font-extrabold text-slate-900 text-sm">
						Nhận xét từ người mua ({filteredReviews.length})
					</h3>

					{/* Filter tabs with gold stars */}
					<div className="flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => {
								setActiveTab("all");
								setPage(1);
							}}
							className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer border ${
								activeTab === "all"
									? "bg-slate-900 text-white border-slate-900 shadow-xs"
									: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
							}`}
						>
							Tất cả
						</button>

						{[5, 4, 3, 2, 1].map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => {
									setActiveTab(s);
									setPage(1);
								}}
								className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
									activeTab === s
										? "bg-slate-900 text-white border-slate-900 shadow-xs"
										: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
								}`}
							>
								<span>{s}</span>
								<Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" />
							</button>
						))}
					</div>
				</div>

				{isReviewsLoading ? (
					<div className="flex justify-center items-center py-12 gap-2 text-xs font-bold text-slate-500">
						<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
						Đang tải danh sách nhận xét...
					</div>
				) : filteredReviews.length === 0 ? (
					<div className="text-center py-12 bg-slate-50/50 rounded-md border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
						Chưa có nhận xét nào phù hợp với tiêu chí lọc này.
					</div>
				) : (
					<div className="divide-y divide-slate-100">
						{filteredReviews.map((rev: any) => (
							<div key={rev.id} className="py-5 space-y-2.5 first:pt-0">
								<div className="flex items-start gap-3">
									<div
										onClick={() => rev.customerId && navigate(`/users/${rev.customerId}`)}
										className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer hover:opacity-85 transition-all"
									>
										{rev.customerAvatarUrl ? (
											<img
												src={rev.customerAvatarUrl}
												alt={rev.customerName}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-sm uppercase">
												{(rev.customerName || "K").charAt(0)}
											</div>
										)}
									</div>

									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<span
												onClick={() => rev.customerId && navigate(`/users/${rev.customerId}`)}
												className="font-bold text-xs text-slate-900 cursor-pointer hover:underline"
											>
												{rev.customerName || "Khách hàng ẩn danh"}
											</span>
											<span className="text-[10px] text-slate-400 font-medium">
												{rev.createdDate ? new Date(rev.createdDate).toLocaleDateString("vi-VN") : ""}
											</span>
										</div>

										<div className="flex gap-0.5">
											{[1, 2, 3, 4, 5].map((s) => (
												<Star
													key={s}
													className={`w-3.5 h-3.5 ${
														s <= rev.rating
															? "text-amber-400 fill-amber-400"
															: "text-slate-200 fill-slate-200"
													}`}
												/>
											))}
										</div>
									</div>
								</div>

								<p className="text-slate-700 leading-relaxed font-normal text-xs pr-2">
									{rev.comment}
								</p>

								{rev.media && rev.media.length > 0 && (
									<div className="flex flex-wrap gap-2.5 pt-1">
										{rev.media.map((url: string, idx: number) => (
											<div
												key={idx}
												onClick={() => setLightboxMedia(url)}
												className="relative w-20 h-20 rounded-md overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all shadow-xs shrink-0"
											>
												{isVideo(url) ? (
													<div className="w-full h-full relative bg-black">
														<video
															src={url}
															preload="metadata"
															className="w-full h-full object-cover opacity-60"
														/>
														<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white gap-0.5 text-[8px] font-black uppercase tracking-wider">
															<Play className="w-4 h-4 fill-white text-white drop-shadow-md shrink-0" />
															<span>Video</span>
														</div>
													</div>
												) : (
													<img
														src={url}
														alt="User review asset"
														className="w-full h-full object-cover"
													/>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{reviewsData && reviewsData.totalCount > 5 && (
					<div className="flex justify-between items-center pt-5 border-t border-slate-200">
						<span className="text-xs text-slate-500 font-medium">
							Hiển thị {filteredReviews.length} / {reviewsData.totalCount} đánh giá
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={page === 1}
								onClick={() => setPage(page - 1)}
								className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
							>
								Trước
							</button>

							{Array.from({ length: Math.ceil(reviewsData.totalCount / 5) }).map((_, i) => {
								const pageNum = i + 1;
								return (
									<button
										key={pageNum}
										type="button"
										onClick={() => setPage(pageNum)}
										className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md border transition-all cursor-pointer ${
											page === pageNum
												? "bg-slate-900 text-white border-slate-900"
												: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
										}`}
									>
										{pageNum}
									</button>
								);
							})}

							<button
								type="button"
								disabled={page * 5 >= reviewsData.totalCount}
								onClick={() => setPage(page + 1)}
								className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
							>
								Sau
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Lightbox for review media */}
			{lightboxMedia && (
				<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
					<button
						type="button"
						onClick={() => setLightboxMedia(null)}
						className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 shadow-md cursor-pointer transition-all border-none"
					>
						<X className="w-6 h-6" />
					</button>
					<div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center select-none">
						{isVideo(lightboxMedia) ? (
							<video
								src={lightboxMedia}
								controls
								autoPlay
								className="max-w-full max-h-[85vh] rounded-md shadow-2xl"
							/>
						) : (
							<img
								src={lightboxMedia}
								alt="Zoomed review asset"
								className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default ProductReviewsSection;
