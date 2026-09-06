import React, { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, X, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { z } from "zod";
import { toast } from "react-toastify";
import { NumberInput, UploadSmallImage } from "@/shared";
import { IdHighlightBadge } from "./IdHighlightBadge";
import { AddMissingVariantsModal, type MissingVariantItem } from "./AddMissingVariantsModal";

export function cartesianProduct<T>(arrays: T[][]): T[][] {
	return arrays.reduce<T[][]>(
		(acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
		[[]],
	);
}

export interface OptionType {
	id?: string;
	name: string;
	values: { id?: string; value: string; imageUrl?: string }[];
}

export interface GeneratedVariantType {
	id?: string;
	sku?: string;
	price: number;
	discountPrice?: number;
	stock: number;
	optionValues: { optionName: string; valueName: string }[];
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
}

interface VariantsSectionProps {
	enableVariants: boolean;
	setEnableVariants: (val: boolean) => void;
	options: OptionType[];
	setOptions: React.Dispatch<React.SetStateAction<OptionType[]>>;
	generatedVariants: GeneratedVariantType[];
	setGeneratedVariants: React.Dispatch<
		React.SetStateAction<GeneratedVariantType[]>
	>;
	handleAddOption: () => void;
	handleRemoveOption: (index: number) => void;
	handleMoveOption: (fromIndex: number, toIndex: number) => void;
	handleAddOptionValue: (optIndex: number, valueText: string) => void;
	handleRemoveOptionValue: (optIndex: number, valIndex: number) => void;
	handleMoveOptionValue: (optIndex: number, fromValIndex: number, toValIndex: number) => void;
	handleUpdateOptionName: (index: number, name: string) => void;
	handleUpdateVariantField: (
		varIndex: number,
		field: "sku" | "price" | "discountPrice" | "stock",
		val: any,
	) => void;
	handleRemoveVariant: (index: number) => void;
	simplePrice: number;
	setSimplePrice: (v: number) => void;
	simpleDiscountPrice: number;
	setSimpleDiscountPrice: (v: number) => void;
	simpleStock: number;
	setSimpleStock: (v: number) => void;
}

const simplePriceSchema = z.object({
	simplePrice: z.number().min(1000, "Giá bán phải ít nhất 1,000đ"),
	simpleDiscountPrice: z.number().min(0).optional(),
	simpleStock: z.number().int().min(0, "Tồn kho không âm"),
}).refine(
	(d) => !d.simpleDiscountPrice || d.simpleDiscountPrice < d.simplePrice,
	{ message: "Giá giảm phải nhỏ hơn giá bán", path: ["simpleDiscountPrice"] },
);

export const VariantsSection: React.FC<VariantsSectionProps> = ({
	enableVariants,
	setEnableVariants,
	options,
	setOptions,
	generatedVariants,
	setGeneratedVariants,
	handleAddOption,
	handleRemoveOption,
	handleMoveOption,
	handleAddOptionValue,
	handleRemoveOptionValue,
	handleMoveOptionValue,
	handleUpdateOptionName,
	handleUpdateVariantField,
	handleRemoveVariant,
	simplePrice,
	setSimplePrice,
	simpleDiscountPrice,
	setSimpleDiscountPrice,
	simpleStock,
	setSimpleStock,
}) => {
	const [simpleErrors, setSimpleErrors] = useState<Record<string, string>>({});
	const [bulkField, setBulkField] = useState<"price" | "discountPrice" | "stock">("price");
	const [bulkValue, setBulkValue] = useState<number>(0);

	// Missing variants modal state
	const [isAddMissingOpen, setIsAddMissingOpen] = useState(false);

	// All theoretical Cartesian combinations from valid options
	const allCombinations = useMemo(() => {
		const validOptions = options.filter(
			(opt) => opt.values.length > 0 && opt.name.trim(),
		);
		if (validOptions.length === 0) return [];
		const optionArrays = validOptions.map((opt) =>
			opt.values.map((v) => ({
				optionName: opt.name,
				valueName: v.value,
				imageUrl: v.imageUrl,
			})),
		);
		return cartesianProduct(optionArrays);
	}, [options]);

	// Missing combinations that are NOT yet in generatedVariants
	const missingVariants = useMemo(() => {
		if (allCombinations.length === 0) return [];
		return allCombinations
			.filter((combo) => {
				return !generatedVariants.some(
					(v) =>
						v.optionValues.length === combo.length &&
						combo.every((c) =>
							v.optionValues.some(
								(ov) =>
									ov.optionName.trim().toLowerCase() ===
										c.optionName.trim().toLowerCase() &&
									ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
							),
						),
				);
			})
			.map((combo) => ({ optionValues: combo }));
	}, [allCombinations, generatedVariants]);

	const handleAddMissingVariants = (selectedItems: MissingVariantItem[]) => {
		const newVariantsToAdd: GeneratedVariantType[] = selectedItems.map((item) => ({
			sku: "",
			price: simplePrice || 0,
			discountPrice: simpleDiscountPrice > 0 ? simpleDiscountPrice : undefined,
			stock: simpleStock || 0,
			optionValues: item.optionValues.map((ov) => ({
				optionName: ov.optionName,
				valueName: ov.valueName,
			})),
		}));

		const combined = [...generatedVariants, ...newVariantsToAdd];

		const sorted = allCombinations
			.map((combo) =>
				combined.find(
					(v) =>
						v.optionValues.length === combo.length &&
						combo.every((c) =>
							v.optionValues.some(
								(ov) =>
									ov.optionName.trim().toLowerCase() ===
										c.optionName.trim().toLowerCase() &&
									ov.valueName.trim().toLowerCase() ===
										c.valueName.trim().toLowerCase(),
							),
						),
				),
			)
			.filter((v): v is GeneratedVariantType => v !== undefined);

		setGeneratedVariants(sorted);
		toast.success(`Đã thêm ${selectedItems.length} biến thể thành công.`);
	};

	// Drag and drop state for option values
	const [draggedVal, setDraggedVal] = useState<{ optIdx: number; valIdx: number } | null>(null);
	const [dragOverVal, setDragOverVal] = useState<{ optIdx: number; valIdx: number } | null>(null);

	const handleApplyBulk = () => {
		setGeneratedVariants((prev) =>
			prev.map((v) => {
				const next = { ...v };
				if (bulkField === "price") {
					next.price = bulkValue;
				} else if (bulkField === "discountPrice") {
					next.discountPrice = bulkValue > 0 ? bulkValue : undefined;
				} else if (bulkField === "stock") {
					next.stock = bulkValue;
				}
				return next;
			}),
		);
	};

	const isTwoOptions =
		options.length === 2 &&
		options[0].values.length > 0 &&
		options[1].values.length > 0;

	return (
		<div className="bg-white border border-brand-border rounded-md p-5 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left font-sans">
			{/* Toggle Switch */}
			<div className="flex items-center gap-2.5 pb-2 border-b border-brand-border">
				<input
					type="checkbox"
					id="enable-variants"
					checked={enableVariants}
					onChange={(e) => {
						setEnableVariants(e.target.checked);
					}}
					className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
				/>
				<label
					htmlFor="enable-variants"
					className="text-xs font-bold text-brand-dark select-none cursor-pointer"
				>
					Kích hoạt nhiều phân loại (Biến thể sản phẩm)
				</label>
			</div>

			{enableVariants ? (
				<div className="space-y-6 text-xs">
					{/* Options Configuration */}
					<div className="space-y-4">
						{options.map((opt, optIdx) => (
							<div
								key={optIdx}
								className="p-4 bg-brand-light-soft border border-brand-border rounded-md relative space-y-3"
							>
								<div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
									{options.length > 1 && (
										<button
											type="button"
											onClick={() => handleMoveOption(optIdx, optIdx === 0 ? 1 : 0)}
											className="p-1 px-2 text-gray-600 hover:text-brand-dark hover:bg-white rounded-md transition-colors cursor-pointer border border-brand-border bg-white/80 shadow-2xs flex items-center gap-1 text-[11px] font-semibold"
											title={optIdx === 0 ? "Chuyển xuống Nhóm 2" : "Chuyển lên Nhóm 1"}
										>
											{optIdx === 0 ? (
												<>
													<ArrowDown className="w-3.5 h-3.5" />
													<span>Xuống</span>
												</>
											) : (
												<>
													<ArrowUp className="w-3.5 h-3.5" />
													<span>Lên</span>
												</>
											)}
										</button>
									)}
									<button
										type="button"
										onClick={() => handleRemoveOption(optIdx)}
										className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer border border-brand-border bg-white shadow-2xs"
										title="Xóa nhóm phân loại"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>

								<div className="flex items-center gap-2 max-w-md">
									<span className="font-bold text-brand-dark shrink-0">
										Nhóm {optIdx + 1}:
									</span>
									<input
										type="text"
										value={opt.name}
										onChange={(e) =>
											handleUpdateOptionName(
												optIdx,
												e.target.value,
											)
										}
										placeholder="Ví dụ: Màu sắc, Kích thước..."
										className="h-8 px-2 border border-brand-border rounded-md bg-white font-semibold focus:outline-none flex-1 text-xs"
									/>
									{opt.id && (
										<IdHighlightBadge
											id={opt.id}
											label="ID nhóm"
											entityType="nhóm phân loại"
											className="text-[11px]"
										/>
									)}
								</div>

								<div className="space-y-2">
									{/* List of Option Values with Drag & Drop */}
									<div className="flex flex-wrap gap-2.5">
										{opt.values.map((v, valIdx) => {
											const isDragging =
												draggedVal?.optIdx === optIdx &&
												draggedVal?.valIdx === valIdx;
											const isOver =
												dragOverVal?.optIdx === optIdx &&
												dragOverVal?.valIdx === valIdx;

											return (
												<div
													key={valIdx}
													draggable
													onDragStart={(e) => {
														setDraggedVal({ optIdx, valIdx });
														e.dataTransfer.setData("text/plain", `${optIdx}:${valIdx}`);
														e.dataTransfer.effectAllowed = "move";
													}}
													onDragOver={(e) => {
														e.preventDefault();
														e.dataTransfer.dropEffect = "move";
														if (
															dragOverVal?.optIdx !== optIdx ||
															dragOverVal?.valIdx !== valIdx
														) {
															setDragOverVal({ optIdx, valIdx });
														}
													}}
													onDragLeave={() => {
														if (
															dragOverVal?.optIdx === optIdx &&
															dragOverVal?.valIdx === valIdx
														) {
															setDragOverVal(null);
														}
													}}
													onDrop={(e) => {
														e.preventDefault();
														setDragOverVal(null);
														if (
															draggedVal &&
															draggedVal.optIdx === optIdx &&
															draggedVal.valIdx !== valIdx
														) {
															handleMoveOptionValue(
																optIdx,
																draggedVal.valIdx,
																valIdx,
															);
														}
														setDraggedVal(null);
													}}
													onDragEnd={() => {
														setDraggedVal(null);
														setDragOverVal(null);
													}}
													className={`flex items-center gap-1.5 bg-white border p-1.5 rounded-md text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all select-none ${
														isOver
															? "border-brand-primary bg-brand-primary/10 shadow-xs"
															: isDragging
															? "opacity-40 border-dashed border-gray-400"
															: "border-brand-border"
													}`}
												>
													{/* Drag Handle Grip Icon */}
													<div
														className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-brand-dark p-0.5"
														title="Kéo thả để sắp xếp vị trí"
													>
														<GripVertical className="w-3.5 h-3.5" />
													</div>

													{optIdx === 0 && (
														<UploadSmallImage
															value={v.imageUrl || ""}
															onChange={(url) => {
																const updatedOptions = [...options];
																updatedOptions[optIdx].values[valIdx].imageUrl = url;
																setOptions(updatedOptions);
															}}
															className="w-7 h-7 rounded-md border border-brand-border"
														/>
													)}

													{/* Value name with ID highlight if exists */}
													{v.id ? (
														<IdHighlightBadge
															id={v.id}
															label={v.value}
															entityType="giá trị phân loại"
														/>
													) : (
														<span>{v.value}</span>
													)}

													<button
														type="button"
														onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
														className="text-gray-400 hover:text-red-500 transition-colors p-0.5 border-none bg-transparent cursor-pointer ml-0.5"
														title="Xóa giá trị phân loại"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
											);
										})}
									</div>

									{/* Add New Value Input with Matching Color Button */}
									<div className="flex items-center gap-2 max-w-xs pt-1">
										<input
											type="text"
											placeholder="Thêm giá trị (Ví dụ: Đỏ, Xanh...)"
											className="h-7 px-2 border border-brand-border rounded-md bg-white text-xs focus:outline-none flex-1"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													const val = e.currentTarget.value.trim();
													if (val) {
														handleAddOptionValue(optIdx, val);
														e.currentTarget.value = "";
													}
												}
											}}
										/>
										<button
											type="button"
											onClick={(e) => {
												const input = e.currentTarget.previousElementSibling as HTMLInputElement;
												if (input && input.value.trim()) {
													handleAddOptionValue(optIdx, input.value.trim());
													input.value = "";
												}
											}}
											className="h-7 px-3 bg-brand-primary text-brand-dark text-[11px] font-bold rounded-md hover:bg-brand-primary-deep transition-colors border-none cursor-pointer shrink-0 shadow-xs"
										>
											Thêm
										</button>
									</div>
								</div>
							</div>
						))}

						{options.length < 2 && (
							<button
								type="button"
								onClick={handleAddOption}
								className="h-8 px-4 border border-dashed border-brand-border hover:border-brand-primary hover:text-brand-primary-deep rounded-md flex items-center gap-1.5 text-xs text-brand-muted cursor-pointer transition-colors bg-transparent font-medium"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm nhóm phân loại mới
							</button>
						)}
					</div>

					{/* Bulk Update Controls & Add Missing Variants */}
					<div className="flex flex-wrap items-center justify-between gap-3">
						{generatedVariants.length > 0 && (
							<div className="p-3 bg-brand-light-soft/50 border border-brand-border rounded-md flex flex-wrap items-center gap-3 flex-1 min-w-[320px]">
								<span className="font-bold text-brand-dark text-xs">Nhập nhanh thông số:</span>
								<select
									value={bulkField}
									onChange={(e) => setBulkField(e.target.value as any)}
									className="h-8 px-2 border border-brand-border rounded-md bg-white font-semibold focus:outline-none text-xs"
								>
									<option value="price">Giá bán (đ)</option>
									<option value="discountPrice">Giá giảm (đ)</option>
									<option value="stock">Kho hàng</option>
								</select>

								<NumberInput
									value={bulkValue}
									onChange={setBulkValue}
									className="h-8 px-2 border border-brand-border rounded-md text-xs w-28 focus:outline-none"
									placeholder="Nhập giá trị..."
								/>

								<button
									type="button"
									onClick={handleApplyBulk}
									className="h-8 px-3.5 bg-brand-primary text-brand-dark font-bold text-xs rounded-md hover:bg-brand-primary-deep cursor-pointer transition-colors border-none shadow-xs"
								>
									Áp dụng
								</button>
							</div>
						)}

						{options.some((o) => o.values.length > 0) && (
							<button
								type="button"
								onClick={() => setIsAddMissingOpen(true)}
								disabled={missingVariants.length === 0}
								className={`h-9 px-3.5 border rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
									missingVariants.length > 0
										? "border-brand-primary bg-white text-brand-primary-deep hover:bg-brand-primary/10 cursor-pointer"
										: "border-brand-border bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
								}`}
								title={
									missingVariants.length === 0
										? "Đã có đủ tất cả các biến thể"
										: `Thêm các biến thể còn thiếu (${missingVariants.length} còn thiếu)`
								}
							>
								<Plus className="w-3.5 h-3.5" />
								<span>
									Thêm biến thể {missingVariants.length > 0 ? `(${missingVariants.length} còn thiếu)` : ""}
								</span>
							</button>
						)}
					</div>

					{generatedVariants.length === 0 && options.some((o) => o.values.length > 0) && (
						<div className="p-6 text-center bg-gray-50 border border-brand-border rounded-md space-y-3">
							<p className="text-xs text-brand-muted">
								Hiện chưa có biến thể nào trong danh sách. Bấm nút dưới đây để tạo hoặc thêm biến thể từ các nhóm phân loại.
							</p>
							<button
								type="button"
								onClick={() => setIsAddMissingOpen(true)}
								className="px-4 py-2 bg-brand-primary text-brand-dark font-bold text-xs rounded-md hover:bg-brand-primary-deep transition-colors border-none cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm biến thể ({missingVariants.length} khả dụng)
							</button>
						</div>
					)}

					{/* Grouped Variants Table (Shopee / TikTok Shop Seller Center Pattern) */}
					{generatedVariants.length > 0 && (
						<div className="border border-brand-border rounded-md overflow-x-auto bg-white shadow-xs">
							<table className="w-full text-xs text-left min-w-[650px] border-collapse">
								<thead className="bg-brand-light-soft border-b border-brand-border font-bold text-brand-dark">
									<tr>
										{isTwoOptions ? (
											<>
												<th className="p-3 w-44 text-center border-r border-brand-border">
													{options[0]?.name || "Nhóm 1"}
												</th>
												<th className="p-3 w-40 border-r border-brand-border">
													{options[1]?.name || "Nhóm 2"}
												</th>
											</>
										) : (
											<th className="p-3 w-56 border-r border-brand-border">
												{options[0]?.name || "Tên biến thể"}
											</th>
										)}
										<th className="p-3 w-36">Giá bán (đ)</th>
										<th className="p-3 w-36">Giá giảm (đ)</th>
										<th className="p-3 w-28">Kho hàng</th>
										<th className="p-3 w-16 text-center">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border/70">
									{generatedVariants.map((v, idx) => {
										const tier1Value = v.optionValues[0]?.valueName || "";
										const tier2Value = v.optionValues[1]?.valueName || "";
										const tier1Opt = options[0];
										const tier2Opt = options[1];
										const matchedTier1Val = tier1Opt?.values.find(
											(val) => val.value === tier1Value,
										);
										const matchedTier2Val = tier2Opt?.values.find(
											(val) => val.value === tier2Value,
										);

										// Grouping calculations for 2 options
										const isFirstOfTier1 =
											!isTwoOptions ||
											idx === 0 ||
											generatedVariants[idx - 1]?.optionValues[0]?.valueName !== tier1Value;

										let tier1RowSpan = 1;
										if (isTwoOptions && isFirstOfTier1) {
											for (let j = idx + 1; j < generatedVariants.length; j++) {
												if (generatedVariants[j]?.optionValues[0]?.valueName === tier1Value) {
													tier1RowSpan++;
												} else {
													break;
												}
											}
										}

										const variantFullName =
											v.optionValues.map((ov) => ov.valueName).join(" - ") ||
											`Biến thể ${idx + 1}`;

										return (
											<tr
												key={idx}
												className={`hover:bg-gray-50/40 transition-colors ${
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
																className="p-3 align-middle text-center border-r border-brand-border bg-gray-50/20"
															>
																<div className="flex flex-col items-center justify-center gap-1.5 py-1">
																	{matchedTier1Val?.imageUrl && (
																		<img
																			src={matchedTier1Val.imageUrl}
																			alt={tier1Value}
																			className="w-9 h-9 object-cover rounded-md border border-brand-border bg-white shadow-2xs"
																		/>
																	)}
																	<span className="font-bold text-brand-dark text-xs">
																		{tier1Value}
																	</span>
																	{matchedTier1Val?.id && (
																		<IdHighlightBadge
																			id={matchedTier1Val.id}
																			label=""
																			entityType="giá trị phân loại"
																			className="text-[10px]"
																		/>
																	)}
																</div>
															</td>
														)}

														{/* Option 2 Cell */}
														<td className="p-3 font-semibold text-brand-dark border-r border-brand-border/60">
															<div className="flex items-center justify-between gap-1.5">
																<span>{tier2Value}</span>
																{v.id && (
																	<IdHighlightBadge
																		id={v.id}
																		label=""
																		entityType="biến thể"
																		className="text-[10px] opacity-70 hover:opacity-100"
																	/>
																)}
															</div>
														</td>
													</>
												) : (
													/* Single Option Cell */
													<td className="p-3 font-semibold text-brand-dark border-r border-brand-border/60">
														<div className="flex items-center gap-2">
															{matchedTier1Val?.imageUrl && (
																<img
																	src={matchedTier1Val.imageUrl}
																	alt={tier1Value}
																	className="w-7 h-7 object-cover rounded-md border border-brand-border bg-white shrink-0"
																/>
															)}
															<IdHighlightBadge
																id={v.id}
																label={variantFullName}
																entityType="biến thể"
															/>
														</div>
													</td>
												)}

												{/* Price Input */}
												<td className="p-3">
													<NumberInput
														value={v.price}
														onChange={(val) =>
															handleUpdateVariantField(idx, "price", val)
														}
														className="h-8 px-2 border border-brand-border rounded-md text-xs w-32 focus:outline-none"
														placeholder="Nhập giá..."
													/>
												</td>

												{/* Discount Price Input */}
												<td className="p-3">
													<NumberInput
														value={v.discountPrice || 0}
														onChange={(val) =>
															handleUpdateVariantField(idx, "discountPrice", val)
														}
														className="h-8 px-2 border border-brand-border rounded-md text-xs w-32 focus:outline-none"
														placeholder="Giá giảm..."
													/>
												</td>

												{/* Stock Input */}
												<td className="p-3">
													<NumberInput
														value={v.stock}
														onChange={(val) =>
															handleUpdateVariantField(idx, "stock", val)
														}
														className="h-8 px-2 border border-brand-border rounded-md text-xs w-24 focus:outline-none"
														placeholder="Tồn..."
													/>
												</td>

												{/* Action: Delete Variant */}
												<td className="p-3 text-center">
													<button
														type="button"
														onClick={() => handleRemoveVariant(idx)}
														className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border-none bg-transparent cursor-pointer inline-flex items-center justify-center"
														title="Xóa biến thể này"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			) : (
				/* Single Variant Pricing & Stock */
				<div className="space-y-4 text-xs">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Giá bán (đ) <span className="text-red-500">*</span>
							</label>
							<NumberInput
								value={simplePrice}
								onChange={(v) => {
									setSimplePrice(v);
									const r = simplePriceSchema.safeParse({ simplePrice: v, simpleDiscountPrice, simpleStock });
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map((e) => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simplePrice && (
								<p className="flex items-center gap-1 text-red-500 mt-1">
									<AlertCircle className="w-3 h-3" />
									{simpleErrors.simplePrice}
								</p>
							)}
						</div>

						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Giá giảm (đ) <span className="text-brand-muted text-[10px] font-normal">(tuỳ chọn)</span>
							</label>
							<NumberInput
								value={simpleDiscountPrice}
								onChange={(v) => {
									setSimpleDiscountPrice(v);
									const r = simplePriceSchema.safeParse({ simplePrice, simpleDiscountPrice: v, simpleStock });
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map((e) => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simpleDiscountPrice && (
								<p className="flex items-center gap-1 text-red-500 mt-1">
									<AlertCircle className="w-3 h-3" />
									{simpleErrors.simpleDiscountPrice}
								</p>
							)}
						</div>

						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Kho hàng khả dụng <span className="text-red-500">*</span>
							</label>
							<NumberInput
								value={simpleStock}
								onChange={(v) => {
									setSimpleStock(v);
									const r = simplePriceSchema.safeParse({ simplePrice, simpleDiscountPrice, simpleStock: v });
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map((e) => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simpleStock && (
								<p className="flex items-center gap-1 text-red-500 mt-1">
									<AlertCircle className="w-3 h-3" />
									{simpleErrors.simpleStock}
								</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Add Missing Variants Modal */}
			<AddMissingVariantsModal
				isOpen={isAddMissingOpen}
				onClose={() => setIsAddMissingOpen(false)}
				options={options}
				missingVariants={missingVariants}
				currentVariantCount={generatedVariants.length}
				maxVariants={60}
				onAddVariants={handleAddMissingVariants}
			/>
		</div>
	);
};
