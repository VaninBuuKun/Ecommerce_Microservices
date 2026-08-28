import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	className = "",
}: PaginationProps) {
	if (totalPages <= 1) return null;

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			pages.push(1);

			let start = Math.max(2, currentPage - 1);
			let end = Math.min(totalPages - 1, currentPage + 1);

			if (currentPage <= 3) {
				end = Math.min(totalPages - 1, 4);
			} else if (currentPage >= totalPages - 2) {
				start = Math.max(2, totalPages - 3);
			}

			if (start > 2) {
				pages.push("...");
			}

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (end < totalPages - 1) {
				pages.push("...");
			}

			pages.push(totalPages);
		}

		return pages;
	};

	const pages = getPageNumbers();

	return (
		<div className={`flex items-center justify-center gap-3 text-sm font-sans select-none ${className}`}>
			{/* Nút Previous */}
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className="h-9 px-2 inline-flex items-center gap-1.5 text-slate-900 font-medium text-sm hover:text-black hover:bg-slate-100/60 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border-none bg-transparent"
			>
				<ChevronLeft className="w-4 h-4 text-slate-900 stroke-[2]" />
				<span>Previous</span>
			</button>

			{/* Dãy số trang */}
			<div className="flex items-center gap-1.5">
				{pages.map((p, idx) =>
					typeof p === "number" ? (
						<button
							key={idx}
							type="button"
							onClick={() => onPageChange(p)}
							className={`h-9 min-w-[36px] px-3 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
								p === currentPage
									? "bg-white border border-slate-200/90 text-slate-900 font-semibold shadow-2xs"
									: "bg-transparent text-slate-900 font-medium hover:bg-slate-100/60 border border-transparent"
							}`}
						>
							{p}
						</button>
					) : (
						<span key={idx} className="h-9 px-1.5 flex items-center justify-center text-slate-900 font-bold text-sm tracking-wider">
							...
						</span>
					),
				)}
			</div>

			{/* Nút Next */}
			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className="h-9 px-2 inline-flex items-center gap-1.5 text-slate-900 font-medium text-sm hover:text-black hover:bg-slate-100/60 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border-none bg-transparent"
			>
				<span>Next</span>
				<ChevronRight className="w-4 h-4 text-slate-900 stroke-[2]" />
			</button>
		</div>
	);
}
