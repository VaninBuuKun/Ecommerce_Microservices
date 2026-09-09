import React, { useRef, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Download from "yet-another-react-lightbox/plugins/download";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export interface ChatImageViewerSlide {
	src: string;
	type?: "image" | "video";
	alt?: string;
	title?: string;
}

interface ChatImageViewerProps {
	open: boolean;
	close: () => void;
	index?: number;
	slides: ChatImageViewerSlide[];
}

const PLUGINS = [Zoom, Thumbnails, Download];

/**
 * Slide video chuyên dụng trong Lightbox:
 * - KHÔNG autoplay (người dùng phải tự bấm play mới xem được).
 * - Khi slide không active (offset !== 0 khi chuyển qua ảnh/video khác): Tự động PAUSE và RESET về đầu (currentTime = 0).
 * - Chống lặp tiếng (duplicate audio) triệt để do adjacent slides được pre-render.
 */
function LightboxVideoSlide({ src, offset }: { src: string; offset: number }) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (offset !== 0 && videoRef.current) {
			videoRef.current.pause();
			videoRef.current.currentTime = 0;
		}
	}, [offset]);

	return (
		<div
			className="w-full h-full flex items-center justify-center p-4 sm:p-8 select-none"
			onClick={(e) => {
				// Chặn click lên video không kích hoạt đóng backdrop
				e.stopPropagation();
			}}
		>
			<video
				ref={videoRef}
				src={src}
				controls
				playsInline
				preload="metadata"
				className="max-h-[82vh] max-w-[88vw] object-contain rounded-xl shadow-2xl bg-black border border-white/10"
			/>
		</div>
	);
}

/**
 * Trình xem đa phương tiện toàn màn hình phong cách Facebook dành cho Chat.
 * - Hỗ trợ xem chung cả Hình ảnh (Zoom, Pan, Download) và Video (Play, Pause, Controls).
 * - Nút điều hướng Trái / Phải tròn gọn gàng ở giữa, bấm padding 2 bên không bị nhảy slide.
 * - Bấm vào nền (backdrop / padding ngoài ảnh, video) tự động đóng review giống Facebook.
 * - Nút Close (X) hoạt động tin cậy 100%.
 * - Thumbnail strip cao hơn, rộng hơn, căn giữa không đè lên padding nút điều hướng 2 bên.
 */
export function ChatImageViewer({ open, close, index = 0, slides }: ChatImageViewerProps) {
	if (!open || !slides || slides.length === 0) return null;

	const hasMultiple = slides.length > 1;

	const isVideoSlide = (slide?: ChatImageViewerSlide) => {
		if (!slide?.src) return false;
		if (slide.type === "video") return true;
		const clean = slide.src.split("?")[0].toLowerCase();
		return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov") || clean.endsWith(".ogg");
	};

	return (
		<>
			{/* CSS tùy chỉnh giao diện Facebook-style */}
			<style>{`
				.yarl__portal {
					z-index: 100005 !important;
					background-color: rgba(0, 0, 0, 0.96) !important;
				}
				:root {
					--yarl__portal_zindex: 100005 !important;
				}
				.yarl__root {
					--yarl__color_backdrop: rgba(0, 0, 0, 0.96) !important;
					--yarl__portal_zindex: 100005 !important;
					background-color: rgba(0, 0, 0, 0.96) !important;
				}
				.yarl__container {
					background-color: rgba(0, 0, 0, 0.96) !important;
				}
				.yarl__thumbnails {
					background-color: rgba(0, 0, 0, 0.96) !important;
				}
				/* Nút điều hướng Trái / Phải dạng tròn floating, KHÔNG chiếm full height */
				.yarl__navigation_prev,
				.yarl__navigation_next {
					width: 48px !important;
					height: 48px !important;
					border-radius: 50% !important;
					background: rgba(30, 41, 59, 0.82) !important;
					backdrop-filter: blur(10px) !important;
					color: #ffffff !important;
					display: flex !important;
					align-items: center !important;
					justify-content: center !important;
					box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5) !important;
					top: 50% !important;
					transform: translateY(-50%) !important;
					transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
					cursor: pointer !important;
					z-index: 100020 !important;
					padding: 0 !important;
					border: 1px solid rgba(255, 255, 255, 0.18) !important;
				}
				.yarl__navigation_prev {
					left: 20px !important;
				}
				.yarl__navigation_next {
					right: 20px !important;
				}
				.yarl__navigation_prev:hover:not(:disabled),
				.yarl__navigation_next:hover:not(:disabled) {
					background: rgba(15, 23, 42, 0.95) !important;
					transform: translateY(-50%) scale(1.08) !important;
					box-shadow: 0 6px 22px rgba(0, 0, 0, 0.65) !important;
				}
				.yarl__navigation_prev:disabled,
				.yarl__navigation_prev[disabled],
				.yarl__navigation_next:disabled,
				.yarl__navigation_next[disabled] {
					opacity: 0 !important;
					pointer-events: none !important;
					cursor: default !important;
				}
				/* Toolbar & các nút chức năng */
				.yarl__toolbar {
					z-index: 100030 !important;
					padding: 14px 18px !important;
					gap: 8px !important;
				}
				.yarl__button {
					z-index: 100030 !important;
					cursor: pointer !important;
					pointer-events: auto !important;
				}
				/* Dải thumbnails cao ráo, phủ kín 100% bề ngang, không hở lộ nền chat bên dưới */
				.yarl__thumbnails_container {
					width: 100% !important;
					max-width: 100% !important;
					margin: 0 !important;
					background-color: rgba(0, 0, 0, 0.96) !important;
					padding: 12px 90px !important;
					z-index: 100015 !important;
					box-sizing: border-box !important;
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
					width: 78,
					height: 56,
					border: 2,
					borderRadius: 8,
					padding: 2,
					gap: 10,
					hidden: !hasMultiple,
					showToggle: false,
				}}
				carousel={{
					finite: true,
				}}
				controller={{
					closeOnBackdropClick: true,
				}}
				render={{
					buttonPrev: !hasMultiple ? () => null : undefined,
					buttonNext: !hasMultiple ? () => null : undefined,
					buttonClose: () => (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								close();
							}}
							className="w-10 h-10 rounded-full bg-slate-800/85 hover:bg-slate-700/95 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20 ml-2 select-none"
							title="Đóng (Esc)"
							aria-label="Đóng"
						>
							<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					),
					slide: ({ slide, offset }) => {
						const s = slide as ChatImageViewerSlide;
						if (isVideoSlide(s)) {
							return <LightboxVideoSlide src={s.src} offset={offset} />;
						}
						// Mặc định trả về undefined để Lightbox dùng trình render ảnh gốc (hỗ trợ Zoom/Pan)
						return undefined;
					},
					thumbnail: !hasMultiple
						? () => null
						: ({ slide }) => {
								const s = slide as ChatImageViewerSlide;
								if (isVideoSlide(s)) {
									return (
										<div className="w-full h-full relative flex items-center justify-center bg-slate-900 rounded-md overflow-hidden select-none group border border-white/10">
											<video
												src={`${s.src}#t=0.5`}
												preload="metadata"
												className="w-full h-full object-cover opacity-80 pointer-events-none"
											/>
											<div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
												<div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center shadow-xs">
													<span className="text-white text-[9px] ml-0.5">▶</span>
												</div>
											</div>
										</div>
									);
								}
								return undefined;
						  },
				}}
				portal={{
					root: typeof document !== "undefined" ? document.body : undefined,
				}}
				styles={{
					root: {
						zIndex: 100005,
						backgroundColor: "rgba(0, 0, 0, 0.96)",
					},
					container: {
						backgroundColor: "rgba(0, 0, 0, 0.96)",
					},
					thumbnailsContainer: {
						backgroundColor: "rgba(0, 0, 0, 0.96)",
						width: "100%",
					},
				}}
			/>
		</>
	);
}

export default ChatImageViewer;
