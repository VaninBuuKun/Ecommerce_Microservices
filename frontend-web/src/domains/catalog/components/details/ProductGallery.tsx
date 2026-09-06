import { useMemo, useEffect, useState } from "react";
import { Play, ZoomIn } from "lucide-react";
import type { Product } from "../../types/catalog.types";

interface ProductGalleryProps {
	product: Product;
	activeMedia: { type: "image" | "video"; url: string } | null;
	setActiveMedia: (media: { type: "image" | "video"; url: string }) => void;
	onOpenImageViewer?: (index: number) => void;
}

export function ProductGallery({
	product,
	activeMedia,
	setActiveMedia,
	onOpenImageViewer,
}: ProductGalleryProps) {
	// Tập hợp toàn bộ media thành 1 danh sách đồng nhất (tránh duplicate giữa thumbnailUrl và imageUrls)
	const mediaItems = useMemo(() => {
		const items: { type: "image" | "video"; url: string; label: string }[] = [];
		const seenUrls = new Set<string>();

		if (product.thumbnailUrl) {
			items.push({
				type: "image",
				url: product.thumbnailUrl,
				label: "Ảnh đại diện",
			});
			seenUrls.add(product.thumbnailUrl);
		}

		if (product.imageUrls && Array.isArray(product.imageUrls)) {
			product.imageUrls.forEach((url, idx) => {
				if (url && !seenUrls.has(url)) {
					items.push({
						type: "image",
						url,
						label: `Ảnh ${idx + 1}`,
					});
					seenUrls.add(url);
				}
			});
		}

		if (product.videoUrl) {
			items.push({
				type: "video",
				url: product.videoUrl,
				label: "Video",
			});
		}

		return items;
	}, [product.thumbnailUrl, product.imageUrls, product.videoUrl]);

	const [activeIndex, setActiveIndex] = useState(0);

	// Đồng bộ activeIndex khi activeMedia từ bên ngoài (ví dụ khi chọn màu variant) thay đổi
	useEffect(() => {
		if (activeMedia) {
			const foundIdx = mediaItems.findIndex(
				(m) => m.type === activeMedia.type && m.url === activeMedia.url
			);
			if (foundIdx !== -1) {
				setActiveIndex(foundIdx);
			}
		}
	}, [activeMedia, mediaItems]);

	const handleSelectMedia = (item: { type: "image" | "video"; url: string }, index: number) => {
		setActiveIndex(index);
		setActiveMedia(item);
	};

	const currentItem = mediaItems[activeIndex] || activeMedia || { type: "image", url: product.thumbnailUrl || "" };

	const handlePreviewClick = () => {
		if (currentItem.type === "image" && onOpenImageViewer) {
			onOpenImageViewer(activeIndex);
		}
	};

	return (
		<div className="space-y-3">
			<div
				onClick={handlePreviewClick}
				className={`aspect-[4/3] max-h-[360px] w-full border border-brand-border bg-brand-light-soft/20 rounded-md overflow-hidden relative flex items-center justify-center mx-auto group ${
					currentItem.type === "image" ? "cursor-pointer" : ""
				}`}
				title={currentItem.type === "image" ? "Nhấn để phóng to ảnh" : ""}
			>
				{currentItem.type === "video" ? (
					<video
						src={currentItem.url}
						controls
						className="w-full h-full object-contain"
						autoPlay
					/>
				) : (
					<>
						<img
							src={currentItem.url || "https://via.placeholder.com/400"}
							alt={product.name}
							className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-102"
						/>
						<div className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm pointer-events-none">
							<ZoomIn className="w-3.5 h-3.5" />
							<span>Phóng to</span>
						</div>
					</>
				)}
			</div>

			<div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
				{mediaItems.map((item, idx) => {
					const isCurrentActive = activeIndex === idx;

					if (item.type === "video") {
						return (
							<button
								key={`video-${idx}`}
								type="button"
								onClick={() => handleSelectMedia(item, idx)}
								className={`w-14 h-14 shrink-0 rounded-md border-2 overflow-hidden transition-all bg-brand-dark-surface/5 flex flex-col items-center justify-center cursor-pointer ${
									isCurrentActive
										? "border-brand-primary ring-2 ring-brand-primary/30"
										: "border-brand-border hover:border-gray-400"
								}`}
							>
								<Play className="w-4 h-4 text-brand-primary fill-brand-primary shrink-0" />
								<span className="text-[8px] font-bold uppercase mt-0.5 text-brand-muted">
									Video
								</span>
							</button>
						);
					}

					return (
						<button
							key={`img-${idx}`}
							type="button"
							onMouseEnter={() => handleSelectMedia(item, idx)}
							onClick={() => {
								handleSelectMedia(item, idx);
								if (onOpenImageViewer) {
									onOpenImageViewer(idx);
								}
							}}
							className={`w-14 h-14 shrink-0 rounded-md border-2 overflow-hidden transition-all bg-white cursor-pointer ${
								isCurrentActive
									? "border-brand-primary ring-2 ring-brand-primary/30"
									: "border-brand-border hover:border-gray-400"
							}`}
							title="Di chuột để xem trước, nhấn để phóng to"
						>
							<img
								src={item.url}
								alt={item.label}
								className="w-full h-full object-cover"
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
