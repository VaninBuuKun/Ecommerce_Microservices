import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Upload, Loader2, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAddProductReviewMutation } from "../../hooks/useCatalog";
import { api } from "@/core";
import axios from "axios";

export interface ProductReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	productId: string | number;
	productName: string;
	variantName?: string;
	thumbnailUrl?: string;
	onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
	1: "Rất tệ",
	2: "Chưa hài lòng",
	3: "Bình thường",
	4: "Hài lòng",
	5: "Tuyệt vời",
};

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({
	isOpen,
	onClose,
	productId,
	productName,
	variantName,
	thumbnailUrl,
	onSuccess,
}) => {
	const [rating, setRating] = useState(5);
	const [hoverRating, setHoverRating] = useState<number | null>(null);
	const [comment, setComment] = useState("");
	const [mediaList, setMediaList] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const addReviewMutation = useAddProductReviewMutation();

	// Reset state when opening
	useEffect(() => {
		if (isOpen) {
			setRating(5);
			setHoverRating(null);
			setComment("");
			setMediaList([]);
		}
	}, [isOpen]);

	if (typeof document === "undefined") return null;

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setIsUploading(true);
		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
					toast.error(`File "${file.name}" không hợp lệ. Chỉ chấp nhận hình ảnh hoặc video!`);
					continue;
				}

				const res = await api.get("medias/upload-url", {
					params: {
						fileName: file.name,
						contentType: file.type,
					},
				});

				const { uploadUrl, publicUrl } = res.data;

				await axios.put(uploadUrl, file, {
					headers: {
						"Content-Type": file.type,
					},
				});

				setMediaList((prev) => [...prev, publicUrl]);
			}
			toast.success("Tải tệp tin lên thành công!");
		} catch (err: any) {
			console.error("Upload error:", err);
			toast.error("Không thể tải tệp tin lên. Vui lòng thử lại!");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleRemoveMedia = (index: number) => {
		setMediaList((prev) => prev.filter((_, idx) => idx !== index));
	};

	const isVideo = (url: string) => {
		return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video") || url.includes("stream");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!comment.trim()) {
			toast.error("Vui lòng nhập nhận xét của bạn về sản phẩm!");
			return;
		}

		addReviewMutation.mutate(
			{
				productId: String(productId),
				rating,
				comment: comment.trim(),
				mediaList,
			},
			{
				onSuccess: () => {
					toast.success("Đánh giá sản phẩm thành công! Cảm ơn bạn đã đóng góp ý kiến.");
					onClose();
					if (onSuccess) onSuccess();
				},
				onError: (err: any) => {
					const msg = err?.response?.data?.message || err?.response?.data || "Đăng đánh giá thất bại.";
					toast.error(msg);
				},
			}
		);
	};

	const currentDisplayRating = hoverRating ?? rating;

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
					/>

					{/* Modal Card */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: "spring", stiffness: 350, damping: 25 }}
						className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden text-left z-10 font-sans max-h-[90vh] flex flex-col"
					>
						{/* Close button */}
						<button
							type="button"
							onClick={onClose}
							className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
							aria-label="Đóng"
						>
							<X className="w-4 h-4" />
						</button>

						{/* Header */}
						<div className="flex items-center gap-2 pb-4 border-b border-slate-100">
							<div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
								<Star className="w-5 h-5 fill-amber-400" />
							</div>
							<div>
								<h3 className="text-base font-black text-slate-900">
									Đánh giá sản phẩm
								</h3>
								<p className="text-xs text-slate-500 font-medium">
									Chia sẻ cảm nhận sau khi nhận và trải nghiệm sản phẩm
								</p>
							</div>
						</div>

						<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
							{/* Product Snapshot Info */}
							<div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
								<img
									src={thumbnailUrl || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"}
									alt={productName}
									className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
								/>
								<div className="space-y-0.5 min-w-0">
									<h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
										{productName}
									</h4>
									{variantName && (
										<p className="text-[11px] text-slate-500 font-medium">
											Phân loại: <span className="font-bold text-slate-700">{variantName}</span>
										</p>
									)}
								</div>
							</div>

							{/* Star Rating Section */}
							<div className="text-center py-2 space-y-2">
								<p className="text-xs font-bold text-slate-600">
									Chất lượng sản phẩm
								</p>
								<div className="flex justify-center items-center gap-2">
									{[1, 2, 3, 4, 5].map((s) => (
										<button
											type="button"
											key={s}
											onMouseEnter={() => setHoverRating(s)}
											onMouseLeave={() => setHoverRating(null)}
											onClick={() => setRating(s)}
											className="focus:outline-none transition-transform hover:scale-120 cursor-pointer p-1 bg-transparent border-none"
										>
											<Star
												className={`w-8 h-8 transition-all ${
													s <= currentDisplayRating
														? "text-amber-400 fill-amber-400 drop-shadow-sm"
														: "text-slate-200 fill-slate-200"
												}`}
											/>
										</button>
									))}
								</div>
								<span className="inline-block text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
									{RATING_LABELS[currentDisplayRating] || "Tuyệt vời"}
								</span>
							</div>

							{/* Comment Input */}
							<div className="space-y-1.5">
								<label className="text-xs font-bold text-slate-700 block">
									Nhận xét chi tiết:
								</label>
								<textarea
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									placeholder="Hãy chia sẻ cảm nhận về độ vừa vặn, chất liệu vải, đóng gói và dịch vụ giao hàng nhé..."
									rows={4}
									className="w-full border border-slate-200 rounded-2xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary placeholder:text-slate-400 font-medium leading-relaxed bg-slate-50/50"
								/>
							</div>

							{/* Media Upload */}
							<div className="space-y-2">
								<label className="text-xs font-bold text-slate-700 block">
									Thêm hình ảnh / Video thực tế:
								</label>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileUpload}
									multiple
									accept="image/*,video/*"
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
									className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer border border-slate-200 disabled:opacity-50"
								>
									{isUploading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
											Đang tải lên...
										</>
									) : (
										<>
											<Upload className="w-4 h-4 text-slate-500" />
											Tải ảnh / Video từ thiết bị
										</>
									)}
								</button>

								{/* Media Preview Grid */}
								{mediaList.length > 0 && (
									<div className="flex flex-wrap gap-2.5 pt-1">
										{mediaList.map((url, idx) => (
											<div
												key={idx}
												className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs"
											>
												{isVideo(url) ? (
													<div className="w-full h-full relative bg-black">
														<video
															src={url}
															preload="metadata"
															className="w-full h-full object-cover opacity-60"
														/>
														<div className="absolute inset-0 flex items-center justify-center">
															<Play className="w-4 h-4 fill-white text-white drop-shadow-sm" />
														</div>
													</div>
												) : (
													<img
														src={url}
														alt="Review attachment"
														className="w-full h-full object-cover"
													/>
												)}
												<button
													type="button"
													onClick={() => handleRemoveMedia(idx)}
													className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm cursor-pointer border-none"
												>
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Actions */}
							<div className="pt-3 flex gap-2.5">
								<button
									type="button"
									onClick={onClose}
									className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border-none"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={addReviewMutation.isPending}
									className="flex-1 h-11 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-xl font-black text-xs transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
								>
									{addReviewMutation.isPending ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Đang gửi...
										</>
									) : (
										<>
											<CheckCircle2 className="w-4 h-4" />
											Hoàn tất đánh giá
										</>
									)}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body
	);
};

export default ProductReviewModal;
