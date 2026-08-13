import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

// ==========================================
// 1. PRODUCT DESCRIPTION COMPONENT
// ==========================================
interface ProductDescriptionProps {
	description?: string | null;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Xử lý chống null / rỗng
	const hasContent = description && description.trim().length > 0;

	return (
		<div className="bg-white rounded-2xl border border-brand-border shadow-sm p-4 md:p-5 mb-6 text-left">
			<h2 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-3 border-b border-brand-border pb-2">
				Mô tả sản phẩm
			</h2>

			{!hasContent ? (
				<p className="text-xs text-brand-muted italic py-2">
					Chưa có thông tin mô tả chi tiết cho sản phẩm này.
				</p>
			) : (
				<div className="relative">
					{/* Container nội dung với tính năng xem thêm */}
					<div
						className={`text-xs text-brand-dark leading-relaxed space-y-2 overflow-hidden transition-all duration-300 ${
							!isExpanded ? "max-h-48" : "max-h-none"
						}`}
					>
						{/* Render định dạng xuống dòng nếu là plain text */}
						{description.split("\n").map((line, idx) => (
							<p key={idx}>{line}</p>
						))}
					</div>

					{/* Gradient Overlay khi chưa thu gọn */}
					{!isExpanded && description.length > 300 && (
						<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
					)}

					{/* Nút Xem thêm / Thu gọn */}
					{description.length > 300 && (
						<div className="text-center pt-3 mt-2 border-t border-brand-border/40">
							<button
								type="button"
								onClick={() => setIsExpanded(!isExpanded)}
								className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary-deep hover:text-brand-dark transition-colors cursor-pointer"
							>
								{isExpanded ? (
									<>
										Thu gọn{" "}
										<ChevronUp className="w-4 h-4" />
									</>
								) : (
									<>
										Xem thêm nội dung{" "}
										<ChevronDown className="w-4 h-4" />
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
