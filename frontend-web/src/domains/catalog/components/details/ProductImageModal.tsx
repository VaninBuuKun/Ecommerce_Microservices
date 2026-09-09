import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export interface ProductModalImageItem {
	url: string;
	label: string;
	isThumbnail?: boolean;
}

interface ProductImageModalProps {
	isOpen: boolean;
	onClose: () => void;
	productTitle?: string;
	images: ProductModalImageItem[];
	initialIndex?: number;
	onSelectImage?: (item: ProductModalImageItem, index: number) => void;
}

/**
 * Trình xem ảnh sản phẩm chi tiết theo phong cách sàn TMĐT cao cấp (Custom Product Image Modal).
 * - Modal độc lập hiển thị qua Portal (z-[10000]), bo góc chuẩn rounded-md, kích thước vừa phải không che toàn màn hình.
 * - Bên trái: Khung chiếu ảnh sắc nét, kích thước tinh chỉnh vừa vặn, kèm nút Zoom và 2 nút điều hướng Trái / Phải:
 *   + Nếu chỉ có 1 ảnh: Ẩn cả 2 nút điều hướng.
 *   + Ở ảnh đầu tiên: Ẩn nút Trái.
 *   + Ở ảnh cuối cùng: Ẩn nút Phải.
 *   + Không lặp vòng vô tận (finite).
 * - Bên phải: Được mở rộng vừa vặn, CHỈ hiển thị danh sách ảnh theo dạng lưới 3 CỘT (3 cols grid),
 *   với Ảnh đại diện (Thumbnail) đặt ở đầu có nhãn "Ảnh bìa". Toàn bộ dùng rounded-md.
 * - Hỗ trợ phím tắt: Mũi tên Trái / Phải để chuyển ảnh, Esc để đóng.
 */
export function ProductImageModal({
	isOpen,
	onClose,
	images,
	initialIndex = 0,
	onSelectImage,
}: ProductImageModalProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [isZoomed, setIsZoomed] = useState(false);

	// Đồng bộ khi initialIndex thay đổi
	useEffect(() => {
		if (isOpen) {
			const safeIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
			setCurrentIndex(safeIndex);
			setIsZoomed(false);
		}
	}, [isOpen, initialIndex, images.length]);

	// Xử lý chuyển ảnh
	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => {
			const nextIdx = Math.max(0, prev - 1);
			if (onSelectImage && images[nextIdx]) {
				onSelectImage(images[nextIdx], nextIdx);
			}
			return nextIdx;
		});
		setIsZoomed(false);
	}, [images, onSelectImage]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => {
			const nextIdx = Math.min(images.length - 1, prev + 1);
			if (onSelectImage && images[nextIdx]) {
				onSelectImage(images[nextIdx], nextIdx);
			}
			return nextIdx;
		});
		setIsZoomed(false);
	}, [images, onSelectImage]);

	const handleSelect = (idx: number) => {
		setCurrentIndex(idx);
		setIsZoomed(false);
		if (onSelectImage && images[idx]) {
			onSelectImage(images[idx], idx);
		}
	};

	// Phím tắt điều khiển
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "ArrowLeft") {
				if (currentIndex > 0) {
					handlePrev();
				}
			} else if (e.key === "ArrowRight") {
				if (currentIndex < images.length - 1) {
					handleNext();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, currentIndex, images.length, handlePrev, handleNext, onClose]);

	// Khóa cuộn trang nền khi mở modal
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen || images.length === 0) return null;

	const currentImage = images[currentIndex] || images[0];
	const hasMultiple = images.length > 1;
	const showPrev = hasMultiple && currentIndex > 0;
	const showNext = hasMultiple && currentIndex < images.length - 1;

	return createPortal(
		<div
			className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			{/* Hộp thoại xem ảnh kích thước vừa vặn, bo góc rounded-md theo chuẩn */}
			<div className="relative w-full max-w-5xl h-[78vh] max-h-[580px] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col md:flex-row border border-brand-border animate-in zoom-in-95 duration-200">
				{/* Nút đóng modal góc trên phải */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-colors cursor-pointer border-none shadow-xs"
					title="Đóng (Esc)"
				>
					<X className="w-4 h-4" />
				</button>

				{/* CỘT TRÁI: Khung chiếu ảnh sắc nét, kích thước vừa vặn (giảm kích thước lại xíu) */}
				<div className="relative flex-1 h-[55%] md:h-full bg-slate-50 flex items-center justify-center p-6 md:p-8 overflow-hidden">
					<div
						className={`w-full h-full flex items-center justify-center transition-transform duration-200 ${
							isZoomed ? "scale-130 cursor-zoom-out" : "cursor-zoom-in"
						}`}
						onClick={() => setIsZoomed((prev) => !prev)}
						title={isZoomed ? "Nhấn để thu nhỏ" : "Nhấn để phóng to"}
					>
						<img
							src={currentImage.url}
							alt={currentImage.label}
							className="max-w-[88%] max-h-[88%] object-contain drop-shadow-sm select-none rounded-md"
							draggable={false}
						/>
					</div>

					{/* Nút chuyển ảnh Trái: Chỉ hiện khi có nhiều hơn 1 ảnh VÀ không phải ảnh đầu tiên */}
					{showPrev && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handlePrev();
							}}
							className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-white/95 hover:bg-white text-brand-dark shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer border border-brand-border/70 group active:scale-95"
							title="Ảnh trước (Mũi tên trái)"
						>
							<ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
						</button>
					)}

					{/* Nút chuyển ảnh Phải: Chỉ hiện khi có nhiều hơn 1 ảnh VÀ không phải ảnh cuối cùng */}
					{showNext && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleNext();
							}}
							className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-white/95 hover:bg-white text-brand-dark shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer border border-brand-border/70 group active:scale-95"
							title="Ảnh kế tiếp (Mũi tên phải)"
						>
							<ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
						</button>
					)}

					{/* Badge chỉ số ảnh và nút Zoom */}
					<div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
						<span className="bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xs">
							{currentIndex + 1} / {images.length}
						</span>

						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setIsZoomed((prev) => !prev);
							}}
							className="pointer-events-auto p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-700 shadow-xs border border-brand-border/50 transition-colors cursor-pointer"
							title={isZoomed ? "Thu nhỏ" : "Phóng to"}
						>
							{isZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
						</button>
					</div>
				</div>

				{/* CỘT PHẢI: Khung mở rộng hiển thị LƯỚI 3 CỘT chỉ gồm danh sách ảnh */}
				<div className="w-full md:w-[380px] md:min-w-[360px] md:max-w-[400px] h-[45%] md:h-full border-t md:border-t-0 md:border-l border-brand-border flex flex-col bg-white shrink-0 overflow-hidden">
					{/* Danh sách ảnh lưới 3 cột - Không có header chữ thừa */}
					<div className="flex-1 overflow-y-auto p-3 pr-2.5">
						<div className="grid grid-cols-3 gap-2">
							{images.map((img, idx) => {
								const isActive = idx === currentIndex;
								return (
									<button
										key={`${img.url}-${idx}`}
										type="button"
										onClick={() => handleSelect(idx)}
										className={`aspect-square rounded-md overflow-hidden border transition-all cursor-pointer relative group bg-slate-50 ${
											isActive
												? "border-brand-primary ring-2 ring-brand-primary/40 shadow-xs scale-102"
												: "border-brand-border/80 hover:border-slate-400"
										}`}
										title={img.label || (img.isThumbnail ? "Ảnh bìa" : `Ảnh ${idx + 1}`)}
									>
										<img
											src={img.url}
											alt={img.label}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
										/>
										{img.isThumbnail && (
											<span className="absolute bottom-0 inset-x-0 bg-brand-primary text-brand-dark text-[9px] font-black text-center py-0.5 uppercase tracking-wider rounded-b-sm shadow-2xs">
												Ảnh bìa
											</span>
										)}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
}

export default ProductImageModal;
