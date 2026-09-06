import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Layers, AlertCircle } from "lucide-react";
import type { OptionType } from "./ProductVariantSection";

export interface MissingVariantItem {
	optionValues: { optionName: string; valueName: string; imageUrl?: string }[];
}

interface AddMissingVariantsModalProps {
	isOpen: boolean;
	onClose: () => void;
	options: OptionType[];
	missingVariants: MissingVariantItem[];
	currentVariantCount: number;
	maxVariants?: number;
	onAddVariants: (selected: MissingVariantItem[]) => void;
}

export const AddMissingVariantsModal: React.FC<AddMissingVariantsModalProps> = ({
	isOpen,
	onClose,
	options,
	missingVariants,
	currentVariantCount,
	maxVariants = 60,
	onAddVariants,
}) => {
	const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

	// Auto select all missing by default when modal opens
	useEffect(() => {
		if (isOpen) {
			const initial = new Set<number>();
			// Select up to the remaining capacity
			const remainingCapacity = Math.max(0, maxVariants - currentVariantCount);
			missingVariants.slice(0, remainingCapacity).forEach((_, idx) => initial.add(idx));
			setSelectedIndexes(initial);
		} else {
			setSelectedIndexes(new Set());
		}
	}, [isOpen, missingVariants, currentVariantCount, maxVariants]);

	if (!isOpen) return null;

	const isTwoOptions = options.length >= 2;
	const isAllSelected =
		missingVariants.length > 0 && selectedIndexes.size === missingVariants.length;
	const isExceedingLimit = currentVariantCount + selectedIndexes.size > maxVariants;

	const handleToggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedIndexes(new Set());
		} else {
			const all = new Set<number>();
			missingVariants.forEach((_, idx) => all.add(idx));
			setSelectedIndexes(all);
		}
	};

	const handleToggleItem = (index: number) => {
		const next = new Set(selectedIndexes);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		setSelectedIndexes(next);
	};

	const handleSubmit = () => {
		if (selectedIndexes.size === 0 || isExceedingLimit) return;
		const selectedItems = Array.from(selectedIndexes).map((idx) => missingVariants[idx]);
		onAddVariants(selectedItems);
		onClose();
	};

	const modalContent = (
		<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-left animate-in fade-in duration-200">
			<div className="bg-white border border-brand-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-brand-border/60 flex items-center justify-between shrink-0 bg-white">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary-deep flex items-center justify-center">
							<Layers className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-brand-dark">
								Thêm biến thể còn thiếu
							</h3>
							<p className="text-[11px] text-brand-muted font-medium">
								Chọn các tổ hợp phân loại còn thiếu để thêm vào danh sách quản lý giá và kho.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md border-none bg-transparent cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Modal Body / Table */}
				<div className="p-6 overflow-y-auto flex-1 space-y-4">
					{missingVariants.length === 0 ? (
						<div className="p-8 text-center text-xs text-brand-muted bg-gray-50 border border-brand-border/60 rounded-md">
							Tất cả các tổ hợp phân loại đã có trong danh sách biến thể của sản phẩm.
						</div>
					) : (
						<>
							{isExceedingLimit && (
								<div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 flex items-center gap-2">
									<AlertCircle className="w-4 h-4 shrink-0" />
									<span>
										Tổng số biến thể sau khi thêm ({currentVariantCount + selectedIndexes.size}) vượt quá giới hạn tối đa ({maxVariants}). Vui lòng bỏ chọn bớt.
									</span>
								</div>
							)}

							<div className="border border-brand-border rounded-md overflow-hidden bg-white shadow-xs">
								<table className="w-full text-xs text-left border-collapse">
									<thead className="bg-brand-light-soft border-b border-brand-border font-bold text-brand-dark">
										<tr>
											{isTwoOptions ? (
												<>
													<th className="p-3 w-40 text-center border-r border-brand-border">
														{options[0]?.name || "Nhóm 1"}
													</th>
													<th className="p-3 border-r border-brand-border">
														{options[1]?.name || "Nhóm 2"}
													</th>
												</>
											) : (
												<th className="p-3 border-r border-brand-border">
													{options[0]?.name || "Tên phân loại"}
												</th>
											)}
											<th className="p-3 w-20 text-center select-none">
												<div className="flex items-center justify-center gap-1.5">
													<input
														type="checkbox"
														checked={isAllSelected}
														onChange={handleToggleSelectAll}
														className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
														title="Chọn tất cả"
													/>
													<span className="text-xs font-bold text-brand-dark">Chọn</span>
												</div>
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-brand-border/70">
										{missingVariants.map((item, idx) => {
											const isSelected = selectedIndexes.has(idx);
											const opt1Val = item.optionValues[0]?.valueName || "";
											const opt1Img =
												item.optionValues[0]?.imageUrl ||
												options[0]?.values.find((v) => v.value === opt1Val)?.imageUrl;
											const opt2Val = isTwoOptions
												? item.optionValues[1]?.valueName || ""
												: "";

											// Grouping calculations for 2 options
											const isFirstOfTier1 =
												!isTwoOptions ||
												idx === 0 ||
												missingVariants[idx - 1]?.optionValues[0]?.valueName !== opt1Val;

											let tier1RowSpan = 1;
											if (isTwoOptions && isFirstOfTier1) {
												for (let j = idx + 1; j < missingVariants.length; j++) {
													if (missingVariants[j]?.optionValues[0]?.valueName === opt1Val) {
														tier1RowSpan++;
													} else {
														break;
													}
												}
											}

											const handleToggleGroup = (e: React.MouseEvent) => {
												e.stopPropagation();
												const groupIndexes: number[] = [];
												for (let j = idx; j < idx + tier1RowSpan; j++) {
													groupIndexes.push(j);
												}
												const allInGroupSelected = groupIndexes.every((i) => selectedIndexes.has(i));
												const next = new Set(selectedIndexes);
												if (allInGroupSelected) {
													groupIndexes.forEach((i) => next.delete(i));
												} else {
													groupIndexes.forEach((i) => next.add(i));
												}
												setSelectedIndexes(next);
											};

											return (
												<tr
													key={idx}
													onClick={() => handleToggleItem(idx)}
													className={`transition-colors cursor-pointer select-none ${
														isSelected
															? "bg-brand-primary/5 hover:bg-brand-primary/10"
															: "hover:bg-brand-light-soft/60"
													} ${
														isTwoOptions && isFirstOfTier1 && idx > 0
															? "border-t-2 border-brand-border"
															: ""
													}`}
												>
													{/* Option 1 Cell (RowSpanned when 2 options exist) */}
													{isTwoOptions ? (
														<>
															{isFirstOfTier1 && (
																<td
																	rowSpan={tier1RowSpan}
																	onClick={handleToggleGroup}
																	title="Click để chọn hoặc bỏ chọn toàn bộ nhóm này"
																	className="p-3 align-middle text-center border-r border-brand-border bg-gray-50/30 hover:bg-brand-primary/5 transition-colors"
																>
																	<div className="flex flex-col items-center justify-center gap-1.5 py-1">
																		{opt1Img && (
																			<img
																				src={opt1Img}
																				alt={opt1Val}
																				className="w-9 h-9 object-cover rounded-md border border-brand-border bg-white shrink-0"
																			/>
																		)}
																		<span className="font-semibold text-brand-dark">{opt1Val}</span>
																	</div>
																</td>
															)}

															{/* Option 2 Cell */}
															<td className="p-3 font-semibold text-brand-dark border-r border-brand-border/60">
																<span>{opt2Val}</span>
															</td>
														</>
													) : (
														/* Single Option Cell */
														<td className="p-3 font-semibold text-brand-dark border-r border-brand-border/60">
															<div className="flex items-center gap-2">
																{opt1Img && (
																	<img
																		src={opt1Img}
																		alt={opt1Val}
																		className="w-7 h-7 object-cover rounded-md border border-brand-border bg-white shrink-0"
																	/>
																)}
																<span>{opt1Val}</span>
															</div>
														</td>
													)}

													{/* Checkbox at the end */}
													<td
														className="p-3 text-center"
														onClick={(e) => e.stopPropagation()}
													>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => handleToggleItem(idx)}
															className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
														/>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>

				{/* Modal Footer */}
				<div className="px-6 py-3.5 border-t border-brand-border/60 bg-gray-50 flex items-center justify-between shrink-0">
					<div className="text-xs text-brand-muted">
						Đã chọn:{" "}
						<strong className="text-brand-dark">{selectedIndexes.size}</strong> /{" "}
						{missingVariants.length} biến thể còn thiếu
						<span className="mx-2 text-brand-border">|</span>
						Tổng biến thể:{" "}
						<strong
							className={
								isExceedingLimit ? "text-red-500 font-bold" : "text-brand-dark"
							}
						>
							{currentVariantCount + selectedIndexes.size}
						</strong>{" "}
						/ {maxVariants}
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-dark rounded-md transition-colors bg-white border border-brand-border cursor-pointer hover:bg-gray-100"
						>
							Hủy bỏ
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={
								selectedIndexes.size === 0 ||
								isExceedingLimit ||
								missingVariants.length === 0
							}
							className="px-4 py-2 text-xs font-bold bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-md transition-colors shadow-xs border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
						>
							<Plus className="w-3.5 h-3.5" />
							Thêm biến thể ({selectedIndexes.size})
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};
