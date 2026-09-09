import { useRef, useCallback, useEffect } from "react";
import type { PanInfo } from "framer-motion";

interface SliderGestureOptions {
	slide: number;
	totalSlides: number;
	setSlide: React.Dispatch<React.SetStateAction<number>>;
}

export function useSliderGesture({ slide, totalSlides, setSlide }: SliderGestureOptions) {
	const isDraggingRef = useRef(false);
	const wheelDeltaXRef = useRef(0);
	const wheelCooldownRef = useRef(false);
	const wheelTimeoutRef = useRef<any>(null);
	const touchStartXRef = useRef<number | null>(null);
	const touchStartYRef = useRef<number | null>(null);

	const nextSlide = useCallback(() => {
		setSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
	}, [setSlide, totalSlides]);

	const prevSlide = useCallback(() => {
		setSlide((prev) => (prev > 0 ? prev - 1 : prev));
	}, [setSlide]);

	// 1. Xử lý vuốt 2 ngón tay trên Trackpad / Touchpad (Wheel Event với horizontal deltaX)
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			const rawDeltaX = Math.abs(e.deltaX) > 0 ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
			// Chỉ kích hoạt khi thao tác cuộn ngang chiếm ưu thế hơn cuộn dọc trang
			if (Math.abs(rawDeltaX) > Math.abs(e.deltaY) * 1.1) {
				if (wheelCooldownRef.current) return;

				wheelDeltaXRef.current += rawDeltaX;
				clearTimeout(wheelTimeoutRef.current);
				wheelTimeoutRef.current = setTimeout(() => {
					wheelDeltaXRef.current = 0;
				}, 150);

				const THRESHOLD = 30;
				if (wheelDeltaXRef.current > THRESHOLD) {
					wheelDeltaXRef.current = 0;
					wheelCooldownRef.current = true;
					setTimeout(() => {
						wheelCooldownRef.current = false;
					}, 350);
					nextSlide();
				} else if (wheelDeltaXRef.current < -THRESHOLD) {
					wheelDeltaXRef.current = 0;
					wheelCooldownRef.current = true;
					setTimeout(() => {
						wheelCooldownRef.current = false;
					}, 350);
					prevSlide();
				}
			}
		},
		[nextSlide, prevSlide]
	);

	// 2. Xử lý chạm vuốt trên màn hình cảm ứng (Touch Events)
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		if (e.touches.length > 0) {
			touchStartXRef.current = e.touches[0].clientX;
			touchStartYRef.current = e.touches[0].clientY;
		}
	}, []);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (touchStartXRef.current === null || touchStartYRef.current === null) return;
			if (e.changedTouches.length > 0) {
				const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
				const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

				if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
					if (diffX < 0) {
						nextSlide();
					} else {
						prevSlide();
					}
				}
			}
			touchStartXRef.current = null;
			touchStartYRef.current = null;
		},
		[nextSlide, prevSlide]
	);

	// 3. Xử lý kéo thả chuột / Pointer Drag (Framer Motion)
	const handleDragStart = useCallback(() => {
		isDraggingRef.current = true;
	}, []);

	const handleDragEnd = useCallback(
		(_e: any, { offset, velocity }: PanInfo) => {
			setTimeout(() => {
				isDraggingRef.current = false;
			}, 80);

			const swipeThreshold = 50;
			const swipePower = Math.abs(offset.x) * velocity.x;

			if (offset.x < -swipeThreshold || swipePower < -10000) {
				nextSlide();
			} else if (offset.x > swipeThreshold || swipePower > 10000) {
				prevSlide();
			}
		},
		[nextSlide, prevSlide]
	);

	useEffect(() => {
		return () => {
			clearTimeout(wheelTimeoutRef.current);
		};
	}, []);

	return {
		isDraggingRef,
		containerProps: {
			onWheel: handleWheel,
			onTouchStart: handleTouchStart,
			onTouchEnd: handleTouchEnd,
		},
		dragMotionProps: {
			drag: "x" as const,
			dragConstraints: { left: 0, right: 0 },
			dragElastic: 0.2,
			onDragStart: handleDragStart,
			onDragEnd: handleDragEnd,
		},
	};
}
