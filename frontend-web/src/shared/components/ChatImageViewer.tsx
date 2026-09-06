import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Download from "yet-another-react-lightbox/plugins/download";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export interface ChatImageViewerSlide {
	src: string;
	alt?: string;
}

interface ChatImageViewerProps {
	open: boolean;
	close: () => void;
	index?: number;
	slides: ChatImageViewerSlide[];
}

const PLUGINS = [Zoom, Thumbnails, Download];

/**
 * Trình xem ảnh toàn màn hình cao cấp dành cho hệ thống Chat.
 * Tích hợp Zoom (con lăn chuột / pinch), Tải ảnh (Download), Dải ảnh Thumbnails (nếu > 1 ảnh).
 * Tự động ẩn nút trái ở ảnh đầu, ẩn nút phải ở ảnh cuối, không lặp vòng (finite).
 * Z-index 100005 nằm trên tất cả modal chat.
 */
export function ChatImageViewer({ open, close, index = 0, slides }: ChatImageViewerProps) {
	if (!open || !slides || slides.length === 0) return null;

	const hasMultiple = slides.length > 1;

	return (
		<>
			{/* CSS tùy chỉnh ẩn nút Prev/Next khi disabled hoặc chỉ có 1 ảnh, và nâng z-index */}
			<style>{`
				.yarl__portal {
					z-index: 100005 !important;
				}
				:root {
					--yarl__portal_zindex: 100005 !important;
				}
				.yarl__navigation_prev:disabled,
				.yarl__navigation_prev[disabled],
				.yarl__navigation_next:disabled,
				.yarl__navigation_next[disabled] {
					display: none !important;
					opacity: 0 !important;
					pointer-events: none !important;
				}
				${
					!hasMultiple
						? `
					.yarl__navigation_prev,
					.yarl__navigation_next,
					.yarl__thumbnails_container {
						display: none !important;
					}
				`
						: ""
				}
			`}</style>
			<Lightbox
				open={open}
				close={close}
				index={index}
				slides={slides}
				plugins={PLUGINS}
				zoom={{
					maxZoomPixelRatio: 4,
					scrollToZoom: true,
				}}
				thumbnails={{
					position: "bottom",
					width: 68,
					height: 50,
					border: 2,
					borderRadius: 6,
					padding: 3,
					gap: 8,
					hidden: !hasMultiple,
					showToggle: false,
				}}
				carousel={{
					finite: true,
				}}
				render={{
					buttonPrev: !hasMultiple ? () => null : undefined,
					buttonNext: !hasMultiple ? () => null : undefined,
					thumbnail: !hasMultiple ? () => null : undefined,
				}}
				controller={{
					closeOnBackdropClick: true,
				}}
				styles={{
					root: {
						zIndex: 100005,
					},
				}}
			/>
		</>
	);
}

export default ChatImageViewer;
