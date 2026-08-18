import React, { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { NumberInput, UploadSmallImage } from "@/shared";

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
	handleAddOptionValue: (optIndex: number, valueText: string) => void;
	handleRemoveOptionValue: (optIndex: number, valIndex: number) => void;
	handleUpdateOptionName: (index: number, name: string) => void;
	handleUpdateVariantField: (
		varIndex: number,
		field: "sku" | "price" | "discountPrice" | "stock" | "weight" | "length" | "width" | "height",
		val: any,
	) => void;
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
	handleAddOptionValue,
	handleRemoveOptionValue,
	handleUpdateOptionName,
	handleUpdateVariantField,
	simplePrice,
	setSimplePrice,
	simpleDiscountPrice,
	setSimpleDiscountPrice,
	simpleStock,
	setSimpleStock,
}) => {
	const [simpleErrors, setSimpleErrors] = useState<Record<string, string>>({});
	const [bulkField, setBulkField] = useState<"price" | "discountPrice" | "stock" | "weight" | "dimensions">("price");
	const [bulkValue, setBulkValue] = useState<number>(0);
	const [bulkLength, setBulkLength] = useState<number>(0);
	const [bulkWidth, setBulkWidth] = useState<number>(0);
	const [bulkHeight, setBulkHeight] = useState<number>(0);

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
				} else if (bulkField === "weight") {
					next.weight = bulkValue;
				} else if (bulkField === "dimensions") {
					next.length = bulkLength;
					next.width = bulkWidth;
					next.height = bulkHeight;
				}
				return next;
			}),
		);
	};

	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left">
			<div className="flex items-center gap-2.5 pb-2 border-b border-brand-border">
				<input
					type="checkbox"
					id="enable-variants"
					checked={enableVariants}
					onChange={(e) => {
						const checked = e.target.checked;
						if (!checked && options.length > 0) {
							const confirm = window.confirm(
								"Hủy kích hoạt biến thể sẽ xóa toàn bộ các tùy chọn phân loại hiện có. Bạn có chắc chắn muốn tiếp tục?",
							);
							if (!confirm) return;
						}
						setEnableVariants(checked);
						if (checked && options.length === 0) {
							setOptions([{ name: "Kích thước", values: [] }]);
						}
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

			{enableVariants && (
				<div className="space-y-6 text-xs">
					<div className="space-y-4">
						{options.map((opt, optIdx) => (
							<div
								key={optIdx}
								className="p-4 bg-brand-light-soft border border-brand-border rounded-xl relative space-y-3"
							>
								<button
									type="button"
									onClick={() => handleRemoveOption(optIdx)}
									className="absolute top-3.5 right-3.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
									title="Xóa nhóm phân loại"
								>
									<Trash2 className="w-4 h-4" />
								</button>

								<div className="flex items-center gap-2 max-w-sm">
									<span className="font-bold text-brand-dark">
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
										placeholder="Ví dụ: Màu sắc, Kích cỡ..."
										className="h-8 px-2 border border-brand-border rounded-lg bg-white font-semibold focus:outline-none"
									/>
								</div>

								<div className="space-y-2">
									<div className="flex flex-wrap gap-2.5">
										{opt.values.map((v, valIdx) => (
											<div
												key={valIdx}
												className="flex items-center gap-2 bg-white border border-brand-border p-1.5 rounded-lg text-[11px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
											>
												{optIdx === 0 && (
													<UploadSmallImage
														value={v.imageUrl || ""}
														onChange={(url) => {
															const updatedOptions =
																[...options];
															updatedOptions[
																optIdx
															].values[
																valIdx
															].imageUrl = url;
															setOptions(
																updatedOptions,
															);
														}}
														className="w-7 h-7 rounded border border-brand-border"
													/>
												)}
												<span>{v.value}</span>
												<button
													type="button"
													onClick={() =>
														handleRemoveOptionValue(
															optIdx,
															valIdx,
														)
													}
													className="text-gray-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100 border-none bg-transparent"
												>
													×
												</button>
											</div>
										))}
									</div>

									<div className="flex gap-1.5 max-w-xs pt-1">
										<input
											type="text"
											placeholder="Thêm giá trị (Ví dụ: Đỏ, Xanh, XL...)"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddOptionValue(
														optIdx,
														(
															e.target as HTMLInputElement
														).value,
													);
													(
														e.target as HTMLInputElement
													).value = "";
												}
											}}
											className="h-7 px-2 border border-brand-border rounded bg-white text-xs flex-1 focus:outline-none"
										/>
										<button
											type="button"
											onClick={(e) => {
												const input = e.currentTarget
													.previousSibling as HTMLInputElement;
												handleAddOptionValue(
													optIdx,
													input.value,
												);
												input.value = "";
											}}
											className="px-2.5 bg-brand-primary text-brand-dark rounded text-xs font-bold hover:bg-brand-primary-deep cursor-pointer border-none"
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
								className="h-8 px-4 border border-dashed border-brand-border hover:border-brand-primary hover:text-brand-primary-deep rounded-lg flex items-center gap-1.5 text-xs text-brand-muted cursor-pointer transition-colors bg-transparent"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm nhóm phân loại mới
							</button>
						)}
					</div>

					{generatedVariants.length > 0 && (
						<div className="p-3 bg-brand-light-soft/50 border border-brand-border rounded-xl flex flex-wrap items-center gap-3">
							<span className="font-bold text-brand-dark text-xs">Nhập nhanh thông số:</span>
							<select
								value={bulkField}
								onChange={(e) => setBulkField(e.target.value as any)}
								className="h-8 px-2 border border-brand-border rounded-lg bg-white font-semibold focus:outline-none text-xs"
							>
								<option value="price">Giá bán (đ)</option>
								<option value="discountPrice">Giá giảm (đ)</option>
								<option value="stock">Kho hàng</option>
								<option value="weight">Cân nặng (g)</option>
								<option value="dimensions">Kích thước (D x R x C cm)</option>
							</select>

							{bulkField !== "dimensions" ? (
								<NumberInput
									value={bulkValue}
									onChange={setBulkValue}
									className="h-8 px-2 border border-brand-border rounded-lg text-xs w-28 focus:outline-none"
									placeholder="Nhập giá trị..."
								/>
							) : (
								<div className="flex items-center gap-1">
									<NumberInput
										value={bulkLength}
										onChange={setBulkLength}
										className="h-8 px-1 border border-brand-border rounded-lg text-xs w-10 text-center"
										placeholder="D"
									/>
									<span className="text-brand-muted">×</span>
									<NumberInput
										value={bulkWidth}
										onChange={setBulkWidth}
										className="h-8 px-1 border border-brand-border rounded-lg text-xs w-10 text-center"
										placeholder="R"
									/>
									<span className="text-brand-muted">×</span>
									<NumberInput
										value={bulkHeight}
										onChange={setBulkHeight}
										className="h-8 px-1 border border-brand-border rounded-lg text-xs w-10 text-center"
										placeholder="C"
									/>
								</div>
							)}

							<button
								type="button"
								onClick={handleApplyBulk}
								className="h-8 px-3 bg-brand-primary text-brand-dark font-bold text-xs rounded-lg hover:bg-brand-primary-deep cursor-pointer transition-colors border-none"
							>
								Áp dụng
							</button>
						</div>
					)}

					{generatedVariants.length > 0 && (
						<div className="border border-brand-border rounded-xl overflow-x-auto bg-white">
							<table className="w-full text-xs text-left min-w-[800px]">
								<thead className="bg-brand-light-soft border-b border-brand-border font-bold text-brand-dark">
									<tr>
										<th className="p-3 w-48">Tên biến thể</th>
										<th className="p-3 w-32">Giá bán (đ)</th>
										<th className="p-3 w-32">Giá giảm (đ)</th>
										<th className="p-3 w-24">Kho hàng</th>
										<th className="p-3 w-24">Cân nặng (g)</th>
										<th className="p-3 w-52">Kích thước (D x R x C cm)</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border">
									{generatedVariants.map((v, idx) => (
										<tr
											key={idx}
											className="hover:bg-gray-50/30"
										>
											<td className="p-3 font-semibold text-brand-dark flex items-center gap-2">
												{(() => {
													const tier1Value =
														v.optionValues[0]
															?.valueName;
													const tier1Opt = options[0];
													const matchedVal =
														tier1Opt?.values.find(
															(val) =>
																val.value ===
																tier1Value,
														);
													if (matchedVal?.imageUrl) {
														return (
															<img
																src={
																	matchedVal.imageUrl
																}
																alt={tier1Value}
																className="w-6 h-6 object-cover rounded border border-brand-border bg-white"
															/>
														);
													}
													return null;
												})()}
												<span>
													{v.optionValues
														.map(
															(ov) =>
																ov.valueName,
														)
														.join(" - ")}
												</span>
											</td>
											<td className="p-3">
												<NumberInput
													value={v.price}
													onChange={(val) =>
														handleUpdateVariantField(
															idx,
															"price",
															val,
														)
													}
													className="h-8 px-2 border border-brand-border rounded-lg text-xs w-28 focus:outline-none"
													placeholder="Nhập giá..."
												/>
											</td>
											<td className="p-3">
												<NumberInput
													value={v.discountPrice || 0}
													onChange={(val) =>
														handleUpdateVariantField(
															idx,
															"discountPrice",
															val,
														)
													}
													className="h-8 px-2 border border-brand-border rounded-lg text-xs w-28 focus:outline-none"
													placeholder="Giá giảm..."
												/>
											</td>
											<td className="p-3">
												<NumberInput
													value={v.stock}
													onChange={(val) =>
														handleUpdateVariantField(
															idx,
															"stock",
															val,
														)
													}
													className="h-8 px-2 border border-brand-border rounded-lg text-xs w-20 focus:outline-none"
													placeholder="Tồn..."
												/>
											</td>
											<td className="p-3">
												<NumberInput
													value={v.weight || 0}
													onChange={(val) =>
														handleUpdateVariantField(
															idx,
															"weight",
															val,
														)
													}
													className="h-8 px-2 border border-brand-border rounded-lg text-xs w-18 focus:outline-none"
													placeholder="g..."
												/>
											</td>
											<td className="p-3">
												<div className="flex items-center gap-1.5">
													<NumberInput
														value={v.length || 0}
														onChange={(val) =>
															handleUpdateVariantField(
																idx,
																"length",
																val,
															)
														}
														className="h-8 px-1 border border-brand-border rounded-lg text-xs w-11 text-center focus:outline-none"
														placeholder="D"
													/>
													<span className="text-[10px] text-brand-muted">×</span>
													<NumberInput
														value={v.width || 0}
														onChange={(val) =>
															handleUpdateVariantField(
																idx,
																"width",
																val,
															)
														}
														className="h-8 px-1 border border-brand-border rounded-lg text-xs w-11 text-center focus:outline-none"
														placeholder="R"
													/>
													<span className="text-[10px] text-brand-muted">×</span>
													<NumberInput
														value={v.height || 0}
														onChange={(val) =>
															handleUpdateVariantField(
																idx,
																"height",
																val,
															)
														}
														className="h-8 px-1 border border-brand-border rounded-lg text-xs w-11 text-center focus:outline-none"
														placeholder="C"
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{!enableVariants && (
				<div className="space-y-5 text-xs max-w-lg">
					<h4 className="font-bold text-brand-dark pb-1.5 border-b border-brand-border">
						Cấu hình kho hàng &amp; giá bán đơn lẻ
					</h4>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Giá bán (đ) <span className="text-red-500">*</span>
							</label>
							<NumberInput
								value={simplePrice}
								onChange={(v) => {
									setSimplePrice(v);
									const r = simplePriceSchema.safeParse({ simplePrice: v, simpleDiscountPrice, simpleStock });
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map(e => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simplePrice && (
								<p className="flex items-center gap-1 text-red-500 mt-1"><AlertCircle className="w-3 h-3" />{simpleErrors.simplePrice}</p>
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
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map(e => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simpleDiscountPrice && (
								<p className="flex items-center gap-1 text-red-500 mt-1"><AlertCircle className="w-3 h-3" />{simpleErrors.simpleDiscountPrice}</p>
							)}
						</div>
						<div className="col-span-2">
							<label className="block font-bold text-brand-dark mb-1">
								Kho hàng khả dụng <span className="text-red-500">*</span>
							</label>
							<NumberInput
								value={simpleStock}
								onChange={(v) => {
									setSimpleStock(v);
									const r = simplePriceSchema.safeParse({ simplePrice, simpleDiscountPrice, simpleStock: v });
									setSimpleErrors(r.success ? {} : Object.fromEntries(r.error.errors.map(e => [e.path[0], e.message])));
								}}
							/>
							{simpleErrors.simpleStock && (
								<p className="flex items-center gap-1 text-red-500 mt-1"><AlertCircle className="w-3 h-3" />{simpleErrors.simpleStock}</p>
							)}
						</div>
					</div>

					<h4 className="font-bold text-brand-dark pb-1.5 border-b border-brand-border pt-2">
						Thông tin vận chuyển đơn lẻ
					</h4>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Khối lượng (gram)
							</label>
							<NumberInput
								value={generatedVariants[0]?.weight || 0}
								onChange={(weight) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], weight },
									])
								}
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Chiều dài (cm)
							</label>
							<NumberInput
								value={generatedVariants[0]?.length || 0}
								onChange={(length) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], length },
									])
								}
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Chiều rộng (cm)
							</label>
							<NumberInput
								value={generatedVariants[0]?.width || 0}
								onChange={(width) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], width },
									])
								}
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Chiều cao (cm)
							</label>
							<NumberInput
								value={generatedVariants[0]?.height || 0}
								onChange={(height) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], height },
									])
								}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
