import { Play } from "lucide-react";
import type { ProductDto } from "../../types/catalog.types";

interface ProductGalleryProps {
	product: ProductDto;
	activeMedia: { type: "image" | "video"; url: string } | null;
	setActiveMedia: (media: { type: "image" | "video"; url: string }) => void;
}

export function ProductGallery({
	product,
	activeMedia,
	setActiveMedia,
}: ProductGalleryProps) {
	return (
		<div className="space-y-3">
			<div className="aspect-[4/3] max-h-[360px] w-full border border-brand-border bg-brand-light-soft/20 rounded-xl overflow-hidden relative flex items-center justify-center mx-auto">
				{activeMedia?.type === "video" ? (
					<video
						src={activeMedia.url}
						controls
						className="w-full h-full object-contain"
						autoPlay
					/>
				) : (
					<img
						src={
							activeMedia?.url ||
							"https://via.placeholder.com/400"
						}
						alt={product.name}
						className="w-full h-full object-contain"
					/>
				)}
			</div>

			<div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
				{(product.thumbnailUrl) && (
					<button
						type="button"
						onClick={() =>
							setActiveMedia({
								type: "image",
								url: product.thumbnailUrl || "",
							})
						}
						className={`w-14 h-14 shrink-0 rounded-lg border-2 overflow-hidden transition-all bg-white cursor-pointer ${activeMedia?.url ===
								(product.thumbnailUrl)
								? "border-brand-primary"
								: "border-brand-border hover:border-gray-400"
							}`}
					>
						<img
							src={product.thumbnailUrl}
							alt="Main Cover"
							className="w-full h-full object-cover"
						/>
					</button>
				)}

				{product.imageUrls?.map((url: string, idx: number) => (
					<button
						key={idx}
						type="button"
						onClick={() => setActiveMedia({ type: "image", url })}
						className={`w-14 h-14 shrink-0 rounded-lg border-2 overflow-hidden transition-all bg-white cursor-pointer ${activeMedia?.url === url
								? "border-brand-primary"
								: "border-brand-border hover:border-gray-400"
							}`}
					>
						<img
							src={url}
							alt={`Gallery image ${idx + 1}`}
							className="w-full h-full object-cover"
						/>
					</button>
				))}

				{product.videoUrl && (
					<button
						type="button"
						onClick={() =>
							setActiveMedia({
								type: "video",
								url: product.videoUrl!,
							})
						}
						className={`w-14 h-14 shrink-0 rounded-lg border-2 overflow-hidden transition-all bg-brand-dark-surface/5 flex flex-col items-center justify-center cursor-pointer ${activeMedia?.url === product.videoUrl
								? "border-brand-primary"
								: "border-brand-border hover:border-gray-400"
							}`}
					>
						<Play className="w-4 h-4 text-brand-primary fill-brand-primary shrink-0" />
						<span className="text-[8px] font-bold uppercase mt-0.5 text-brand-muted">
							Video
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
