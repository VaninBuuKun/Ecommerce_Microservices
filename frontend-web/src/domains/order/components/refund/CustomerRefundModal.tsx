import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	X,
	Loader2,
	AlertCircle,
	Image as ImageIcon,
	Video as VideoIcon,
	Play,
	Trash2,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { useCreateRefundMutation } from "../../hooks/useOrders";
import { storageService } from "@/shared/services/storageService";

export interface CustomerRefundModalProps {
	isOpen: boolean;
	onClose: () => void;
	subOrderId: string | number;
	grandTotal: number;
	shopName?: string;
	onSuccess?: () => void;
	onRequireWallet?: () => void;
}

const QUICK_REASON_TAGS = [
	"Hàng lỗi / bể vỡ do vận chuyển",
	"Giao sai mẫu / sai kích thước",
	"Hàng giả / hàng nhái kém chất lượng",
	"Thiếu phụ kiện / quà tặng kèm",
	"Sản phẩm không hoạt động",
	"Khác",
];

const MAX_IMAGES = 6;
const MAX_VIDEOS = 3;

export const CustomerRefundModal: React.FC<CustomerRefundModalProps> = ({
	isOpen,
	onClose,
	subOrderId,
	grandTotal,
	shopName,
	onSuccess,
	onRequireWallet,
}) => {
	const [reason, setReason] = useState("");
	const [selectedTag, setSelectedTag] = useState<string>(QUICK_REASON_TAGS[0]);
	const [images, setImages] = useState<string[]>([]);
	const [videos, setVideos] = useState<string[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [errorMessage, setErrorMessage] = useState("");
	const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const refundMutation = useCreateRefundMutation();

	useEffect(() => {
		if (isOpen) {
			setReason("");
			setSelectedTag(QUICK_REASON_TAGS[0]);
			setImages([]);
			setVideos([]);
			setErrorMessage("");
			setIsUploading(false);
			setUploadProgress(0);
			setPreviewVideoUrl(null);
		}
	}, [isOpen]);

	if (typeof document === "undefined" || !isOpen) return null;

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		if (images.length + files.length > MAX_IMAGES) {
			toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`);
			if (imageInputRef.current) imageInputRef.current.value = "";
			return;
		}

		setIsUploading(true);
		setErrorMessage("");
		try {
			const uploadedUrls: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (!file.type.startsWith("image/")) {
					toast.error(`Tệp "${file.name}" không phải là hình ảnh.`);
					continue;
				}
				if (file.size > 10 * 1024 * 1024) {
					toast.error(`Ảnh "${file.name}" vượt quá dung lượng cho phép (10MB).`);
					continue;
				}

				setUploadProgress(Math.round(((i + 0.3) / files.length) * 100));
				const publicUrl = await storageService.uploadFile(file, (percent) => {
					setUploadProgress(Math.round(((i + percent / 100) / files.length) * 100));
				});
				if (publicUrl) {
					uploadedUrls.push(publicUrl);
				}
			}
			setImages((prev) => [...prev, ...uploadedUrls]);
			toast.success("Đã tải ảnh lên thành công!");
		} catch (err: any) {
			console.error("Upload image error:", err);
			toast.error(err?.message || "Không thể tải ảnh lên. Vui lòng thử lại!");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			if (imageInputRef.current) imageInputRef.current.value = "";
		}
	};

	const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		if (videos.length + files.length > MAX_VIDEOS) {
			toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_VIDEOS} video.`);
			if (videoInputRef.current) videoInputRef.current.value = "";
			return;
		}

		setIsUploading(true);
		setErrorMessage("");
		try {
			const uploadedUrls: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				if (!file.type.startsWith("video/")) {
					toast.error(`Tệp "${file.name}" không phải là video hợp lệ.`);
					continue;
				}
				if (file.size > 50 * 1024 * 1024) {
					toast.error(`Video "${file.name}" vượt quá dung lượng cho phép (50MB).`);
					continue;
				}

				setUploadProgress(Math.round(((i + 0.3) / files.length) * 100));
				const publicUrl = await storageService.uploadFile(file, (percent) => {
					setUploadProgress(Math.round(((i + percent / 100) / files.length) * 100));
				});
				if (publicUrl) {
					uploadedUrls.push(publicUrl);
				}
			}
			setVideos((prev) => [...prev, ...uploadedUrls]);
			toast.success("Đã tải video lên thành công!");
		} catch (err: any) {
			console.error("Upload video error:", err);
			toast.error(err?.message || "Không thể tải video lên. Vui lòng thử lại!");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
			if (videoInputRef.current) videoInputRef.current.value = "";
		}
	};

	const handleRemoveImage = (index: number) => {
		setImages((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleRemoveVideo = (index: number) => {
		setVideos((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleSubmit = async () => {
		const finalReason = selectedTag === "Khác"
			? reason.trim()
			: reason.trim()
				? `[${selectedTag}] ${reason.trim()}`
				: selectedTag;

		if (!finalReason) {
			setErrorMessage("Vui lòng chọn hoặc nhập lý do hoàn tiền / trả hàng chi tiết.");
			return;
		}

		const combinedMedias = [...images, ...videos];

		try {
			await refundMutation.mutateAsync({
				subOrderId: String(subOrderId),
				reason: finalReason,
				medias: combinedMedias,
			});

			toast.success("Đã gửi yêu cầu trả hàng / hoàn tiền thành công!");
			onSuccess?.();
			onClose();
		} catch (err: any) {
			const errorMsg =
				err?.response?.data?.message ||
				err?.response?.data ||
				err?.message ||
				"Đã xảy ra lỗi khi tạo yêu cầu hoàn trả.";

			if (
				errorMsg.toLowerCase().includes("ví") ||
				errorMsg.toLowerCase().includes("wallet")
			) {
				onClose();
				onRequireWallet?.();
			} else {
				setErrorMessage(errorMsg);
			}
		}
	};

	return createPortal(
		<AnimatePresence>
			<div className="fixed inset-0 z-10000 flex items-center justify-center p-3 sm:p-4 bg-brand-dark/50 backdrop-blur-xs font-sans">
				<motion.div
					initial={{ opacity: 0, scale: 0.96, y: 10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.96, y: 10 }}
					transition={{ duration: 0.2 }}
					className="bg-white rounded-xl max-w-xl w-full border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
				>
					{/* Modal Header */}
					<div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-brand-light-soft/40 shrink-0">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
								<ShieldAlert className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-black text-brand-dark text-sm uppercase tracking-wide">
									Yêu cầu hoàn trả & Hoàn tiền
								</h3>
								<p className="text-[11px] text-brand-muted font-bold">
									Đơn hàng #{String(subOrderId).split("-")[0].toUpperCase()}
									{shopName && <span> • {shopName}</span>}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
							title="Đóng"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Modal Body (Scrollable) */}
					<div className="p-5 space-y-4 overflow-y-auto flex-1">
						{/* Policy Alert Banner */}
						<div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-3 text-amber-900 text-xs flex items-start gap-2.5">
							<Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
							<div className="space-y-0.5 text-[11px] leading-relaxed">
								<p className="font-extrabold text-amber-950">
									Hỗ trợ trả hàng & hoàn tiền miễn phí trong vòng 7 ngày
								</p>
								<p className="text-amber-800 font-medium">
									Toàn bộ số tiền đơn hàng <strong className="font-black text-amber-950">{grandTotal.toLocaleString("vi-VN")}đ</strong> sẽ được hoàn trực tiếp về Ví điện tử liên kết sau khi người bán duyệt yêu cầu.
								</p>
							</div>
						</div>

						{/* Section 1: Quick Reasons */}
						<div className="space-y-2">
							<label className="block text-[11px] font-black text-brand-dark uppercase tracking-wider">
								1. Chọn lý do hoàn trả <span className="text-rose-500">*</span>
							</label>
							<div className="flex flex-wrap gap-1.5">
								{QUICK_REASON_TAGS.map((tag) => (
									<button
										key={tag}
										type="button"
										onClick={() => setSelectedTag(tag)}
										className={`px-2.5 py-1.5 rounded-md text-[11px] font-extrabold transition-all cursor-pointer border ${
											selectedTag === tag
												? "bg-brand-primary text-white border-brand-primary shadow-xs"
												: "bg-white text-brand-dark border-brand-border hover:bg-brand-light-soft"
										}`}
									>
										{tag}
									</button>
								))}
							</div>
						</div>

						{/* Section 2: Detailed Reason */}
						<div className="space-y-1.5">
							<label className="block text-[11px] font-black text-brand-dark uppercase tracking-wider">
								2. Mô tả chi tiết vấn đề
							</label>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Cung cấp thêm chi tiết về tình trạng sản phẩm để shop hỗ trợ xử lý nhanh nhất..."
								rows={3}
								className="w-full border border-brand-border rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary font-medium text-brand-dark"
							/>
						</div>

						{/* Section 3: Evidence Upload (Images & Videos) */}
						<div className="space-y-2.5">
							<div className="flex items-center justify-between">
								<label className="text-[11px] font-black text-brand-dark uppercase tracking-wider">
									3. Hình ảnh & Video bằng chứng
								</label>
								<div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted">
									<span>Ảnh: {images.length}/{MAX_IMAGES}</span>
									<span>•</span>
									<span>Video: {videos.length}/{MAX_VIDEOS}</span>
								</div>
							</div>

							{/* Upload Action Buttons */}
							<div className="grid grid-cols-2 gap-2.5">
								<button
									type="button"
									onClick={() => imageInputRef.current?.click()}
									disabled={isUploading || images.length >= MAX_IMAGES}
									className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-dashed border-brand-border rounded-lg text-xs font-extrabold text-brand-dark hover:bg-brand-light-soft hover:border-brand-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
								>
									<ImageIcon className="w-4 h-4 text-emerald-600" />
									<span>Thêm ảnh ({images.length}/{MAX_IMAGES})</span>
								</button>
								<input
									ref={imageInputRef}
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									className="hidden"
								/>

								<button
									type="button"
									onClick={() => videoInputRef.current?.click()}
									disabled={isUploading || videos.length >= MAX_VIDEOS}
									className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-dashed border-brand-border rounded-lg text-xs font-extrabold text-brand-dark hover:bg-brand-light-soft hover:border-brand-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
								>
									<VideoIcon className="w-4 h-4 text-indigo-600" />
									<span>Thêm video ({videos.length}/{MAX_VIDEOS})</span>
								</button>
								<input
									ref={videoInputRef}
									type="file"
									accept="video/*"
									multiple
									onChange={handleVideoUpload}
									className="hidden"
								/>
							</div>

							{/* Uploading Status Progress */}
							{isUploading && (
								<div className="bg-brand-light-soft/60 border border-brand-border rounded-lg p-2.5 space-y-1.5">
									<div className="flex items-center justify-between text-[11px] font-bold text-brand-dark">
										<div className="flex items-center gap-1.5">
											<Loader2 className="w-3.5 h-3.5 animate-spin text-brand-primary" />
											<span>Đang tải tệp bằng chứng lên hệ thống...</span>
										</div>
										<span className="font-mono font-black text-brand-primary">{uploadProgress}%</span>
									</div>
									<div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
										<div
											className="bg-brand-primary h-full transition-all duration-200"
											style={{ width: `${uploadProgress}%` }}
										/>
									</div>
								</div>
							)}

							{/* Preview Gallery */}
							{(images.length > 0 || videos.length > 0) && (
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
									{/* Images Preview */}
									{images.map((url, idx) => (
										<div
											key={`img-${idx}`}
											className="relative group rounded-lg overflow-hidden border border-brand-border aspect-square bg-slate-100"
										>
											<img
												src={url}
												alt={`Bằng chứng ${idx + 1}`}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<button
													type="button"
													onClick={() => handleRemoveImage(idx)}
													className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-transform scale-90 hover:scale-100 cursor-pointer border-none shadow-md"
													title="Xóa ảnh"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
											<span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-black px-1 py-0.5 rounded">
												ẢNH
											</span>
										</div>
									))}

									{/* Videos Preview */}
									{videos.map((url, idx) => (
										<div
											key={`vid-${idx}`}
											className="relative group rounded-lg overflow-hidden border border-brand-border aspect-square bg-slate-900 flex items-center justify-center cursor-pointer"
											onClick={() => setPreviewVideoUrl(url)}
										>
											<video
												src={url}
												className="w-full h-full object-cover opacity-70"
											/>
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white text-brand-dark flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
													<Play className="w-4 h-4 fill-current ml-0.5" />
												</div>
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveVideo(idx);
												}}
												className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-full hover:bg-rose-700 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none shadow-sm"
												title="Xóa video"
											>
												<Trash2 className="w-3 h-3" />
											</button>
											<span className="absolute bottom-1 left-1 bg-indigo-600/90 text-white text-[8px] font-black px-1 py-0.5 rounded">
												VIDEO
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Error Message Alert */}
						{errorMessage && (
							<div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-bold">
								<AlertCircle className="w-4 h-4 shrink-0" />
								<span>{errorMessage}</span>
							</div>
						)}
					</div>

					{/* Modal Footer */}
					<div className="px-5 py-3.5 border-t border-brand-border bg-brand-light-soft/30 flex items-center justify-between shrink-0">
						<div>
							<span className="text-[10px] text-brand-muted font-bold block uppercase">
								Tổng tiền hoàn trả
							</span>
							<span className="text-sm font-black text-amber-600">
								{grandTotal.toLocaleString("vi-VN")}đ
							</span>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								disabled={refundMutation.isPending || isUploading}
								className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={refundMutation.isPending || isUploading}
								className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-black text-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
							>
								{refundMutation.isPending ? (
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										<span>Đang gửi...</span>
									</>
								) : (
									<span>Gửi yêu cầu hoàn trả</span>
								)}
							</button>
						</div>
					</div>
				</motion.div>

				{/* Video Preview Popup */}
				{previewVideoUrl && (
					<div
						className="fixed inset-0 z-10001 bg-black/80 flex items-center justify-center p-4"
						onClick={() => setPreviewVideoUrl(null)}
					>
						<div
							className="relative max-w-2xl w-full bg-black rounded-xl overflow-hidden shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<video
								src={previewVideoUrl}
								controls
								autoPlay
								className="w-full max-h-[70vh] object-contain"
							/>
							<button
								type="button"
								onClick={() => setPreviewVideoUrl(null)}
								className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full cursor-pointer border-none"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</AnimatePresence>,
		document.body
	);
};

export default CustomerRefundModal;
