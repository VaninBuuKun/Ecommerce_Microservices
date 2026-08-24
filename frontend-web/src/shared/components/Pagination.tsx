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
		const maxVisible = 5;

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
		<div className={`flex items-center justify-center gap-1.5 text-xs font-sans select-none ${className}`}>
			<button
				type="button"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white text-brand-dark font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
			>
				<ChevronLeft className="w-4 h-4" />
				<span>Previous</span>
			</button>

			<div className="flex items-center gap-1 mx-1">
				{pages.map((p, idx) =>
					typeof p === "number" ? (
						<button
							key={idx}
							type="button"
							onClick={() => onPageChange(p)}
							className={`h-8 min-w-[32px] px-2.5 flex items-center justify-center rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
								p === currentPage
									? "bg-white border border-brand-border text-brand-dark shadow-xs"
									: "bg-transparent text-brand-muted hover:bg-slate-100 hover:text-brand-dark border border-transparent"
							}`}
						>
							{p}
						</button>
					) : (
						<span key={idx} className="h-8 px-1.5 flex items-center justify-center text-brand-muted font-bold text-xs">
							...
						</span>
					),
				)}
			</div>

			<button
				type="button"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				className="h-8 px-3 inline-flex items-center gap-1 rounded-lg border border-brand-border bg-white text-brand-dark font-bold text-xs hover:bg-slate-50 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
			>
				<span>Next</span>
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}
