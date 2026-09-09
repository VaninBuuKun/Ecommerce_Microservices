import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "react-toastify";

interface IdHighlightBadgeProps {
	id?: string;
	label: string;
	entityType?: "biến thể" | "nhóm phân loại" | "giá trị phân loại" | "sản phẩm";
	className?: string;
}

export const IdHighlightBadge: React.FC<IdHighlightBadgeProps> = ({
	id,
	label,
	entityType = "mục",
	className = "",
}) => {
	const [copied, setCopied] = useState(false);

	if (!id) {
		return <span className={className}>{label}</span>;
	}

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(id);
		setCopied(true);
		toast.success(`Đã sao chép ID ${entityType}: ${id}`, { autoClose: 2000 });
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<span className="inline-flex items-center gap-1.5 group relative font-sans">
			{/* Label with Green Highlight, Underline, and Tooltip */}
			<span
				title={`ID: ${id}`}
				className={`text-emerald-700 font-semibold underline decoration-emerald-500/70 decoration-dotted cursor-help hover:text-emerald-800 transition-colors ${className}`}
			>
				{label}
			</span>

			{/* Copy Icon Button */}
			<button
				type="button"
				onClick={handleCopy}
				title={`Sao chép ID: ${id}`}
				className="p-1 rounded text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border-none bg-transparent cursor-pointer inline-flex items-center justify-center shrink-0"
			>
				{copied ? (
					<Check className="w-3.5 h-3.5 text-emerald-600" />
				) : (
					<Copy className="w-3.5 h-3.5" />
				)}
			</button>
		</span>
	);
};
