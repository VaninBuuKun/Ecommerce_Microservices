import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CornerDownLeft } from "lucide-react";
import { toast } from "react-toastify";

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalCount?: number;
	pageSize?: number;
	onPageChange: (page: number) => void;
	showQuickJumper?: boolean;
	showTotal?: boolean;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	totalCount,
	pageSize,
	onPageChange,
	showQuickJumper = true,
	showTotal = false,
	className = "",
}: PaginationProps) {
	const [jumpPage, setJumpPage] = useState<string>("");

	useEffect(() => {
		setJumpPage("");
	}, [currentPage]);

	const effectiveTotalPages = Math.max(1, totalPages || 1);

	const handleJumpSubmit = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!jumpPage.trim()) return;

		const parsed = parseInt(jumpPage.trim(), 10);
		if (isNaN(parsed) || parsed < 1 || parsed > effectiveTotalPages) {
			toast.warning(
				`Trang không hợp lệ. Vui lòng nhập số trang từ 1 đến ${effectiveTotalPages}.`,
				{
					position: "top-left",
					autoClose: 3000,
				}
			);
			setJumpPage("");
			return;
		}

		onPageChange(parsed);
		setJumpPage("");
	};

	const getPageNumbers = () => {
		const pages: (number | string)[] = [];

		if (effectiveTotalPages <= 7) {
			for (let i = 1; i <= effectiveTotalPages; i++) {
				pages.push(i);
			}
		} else {
			pages.push(1);

			let start = Math.max(2, currentPage - 1);
			let end = Math.min(effectiveTotalPages - 1, currentPage + 1);

			if (currentPage <= 3) {
				start = 2;
				end = 4;
			} else if (currentPage >= effectiveTotalPages - 2) {
				start = effectiveTotalPages - 3;
				end = effectiveTotalPages - 1;
			}

			if (start > 2) {
				pages.push("...");
			}

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (end < effectiveTotalPages - 1) {
				pages.push("...");
			}

			pages.push(effectiveTotalPages);
		}

		return pages;
	};

	const pages = getPageNumbers();

	// Calculate range summary if totalCount and pageSize provided
	const renderTotalSummary = () => {
		if (!showTotal && totalCount === undefined) return null;
		if (totalCount !== undefined && pageSize) {
			const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
			const endItem = Math.min(totalCount, currentPage * pageSize);
			return (
				<span className="text-[11px] text-brand-muted font-bold tracking-tight select-none">
					Hiển thị <strong className="text-brand-dark font-black">{totalCount > 0 ? `${startItem}-${endItem}` : "0"}</strong> trong tổng số <strong className="text-brand-dark font-black">{totalCount}</strong> mục
				</span>
			);
		}
		if (totalCount !== undefined) {
			return (
				<span className="text-[11px] text-brand-muted font-bold tracking-tight select-none">
					Tổng cộng: <strong className="text-brand-dark font-black">{totalCount}</strong> mục
				</span>
			);
		}
		return null;
	};

	return (
		<div className={`flex flex-wrap items-center justify-between gap-2 text-xs font-sans select-none py-0.5 ${className}`}>
			{/* Left: Total records summary */}
			<div className="flex items-center gap-2">
				{renderTotalSummary()}
			</div>

			{/* Center / Right: Numbered buttons and Quick Jumper */}
			<div className="flex items-center gap-2.5">
				{/* Numbered Page List */}
				<div className="flex items-center gap-1">
					{/* Nút Previous */}
					<button
						type="button"
						onClick={() => onPageChange(Math.max(1, currentPage - 1))}
						disabled={currentPage <= 1}
						className="h-7 px-2 inline-flex items-center gap-0.5 text-slate-700 font-bold text-[11px] hover:text-black hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border-none bg-transparent"
					>
						<ChevronLeft className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" />
						<span>Previous</span>
					</button>

					{/* Dãy số trang */}
					<div className="flex items-center gap-1">
						{pages.map((p, idx) =>
							typeof p === "number" ? (
								<button
									key={idx}
									type="button"
									onClick={() => onPageChange(p)}
									className={`h-7 min-w-[28px] px-2 flex items-center justify-center rounded text-[11px] transition-all cursor-pointer ${
										p === currentPage
											? "bg-white border border-slate-300 text-slate-950 font-black shadow-2xs"
											: "bg-transparent text-slate-600 font-semibold hover:bg-slate-100 border border-transparent"
									}`}
								>
									{p}
								</button>
							) : (
								<span key={idx} className="h-7 px-0.5 flex items-center justify-center text-slate-400 font-bold text-[11px] tracking-wider">
									...
								</span>
							),
						)}
					</div>

					{/* Nút Next */}
					<button
						type="button"
						onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
						disabled={currentPage >= effectiveTotalPages}
						className="h-7 px-2 inline-flex items-center gap-0.5 text-slate-700 font-bold text-[11px] hover:text-black hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer border-none bg-transparent"
					>
						<span>Next</span>
						<ChevronRight className="w-3.5 h-3.5 text-slate-700 stroke-[2.2]" />
					</button>
				</div>

				{/* Quick Jumper */}
				{showQuickJumper && effectiveTotalPages > 1 && (
					<form onSubmit={handleJumpSubmit} className="flex items-center gap-1 pl-2 border-l border-brand-border/60">
						<span className="text-[10px] text-brand-muted font-bold whitespace-nowrap">Đến trang:</span>
						<div className="relative flex items-center">
							<input
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								value={jumpPage}
								placeholder={String(currentPage)}
								onChange={(e) => {
									const val = e.target.value.replace(/[^0-9]/g, "");
									setJumpPage(val);
								}}
								onBlur={() => {
									if (jumpPage) handleJumpSubmit();
								}}
								className="w-11 h-6 px-1 text-center text-[11px] font-bold text-brand-dark bg-white border border-brand-border rounded focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
							{jumpPage && (
								<button
									type="submit"
									title="Nhảy đến trang"
									className="absolute right-0.5 p-0.5 text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
								>
									<CornerDownLeft className="w-2.5 h-2.5" />
								</button>
							)}
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
