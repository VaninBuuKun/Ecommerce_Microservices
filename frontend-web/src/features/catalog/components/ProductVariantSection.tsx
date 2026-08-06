import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { NumberInput, UploadSmallImage } from "../../../shared";
export interface OptionType {
	id?: string;
	name: string;
	values: { id?: string; value: string; imageUrl?: string }[];
}

export interface GeneratedVariantType {
	id?: string;
	price: number;
	stock: number;
	optionValues: { optionName: string; valueName: string }[];
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
		field: "sku" | "price" | "stock",
		val: any,
	) => void;
}

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
}) => {
	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 space-y-6">
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
					{/* Option list editor */}
					<div className="space-y-4">
						{options.map((opt, optIdx) => (
							<div
								key={optIdx}
								className="p-4 bg-brand-light-soft border border-brand-border rounded-xl relative space-y-3"
							>
								<button
									type="button"
									onClick={() => handleRemoveOption(optIdx)}
									className="absolute top-3.5 right-3.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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

								{/* Option value chips */}
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
													className="text-gray-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-100"
												>
													×
												</button>
											</div>
										))}
									</div>

									{/* Option value input */}
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
											className="px-2.5 bg-brand-primary text-brand-dark rounded text-xs font-bold hover:bg-brand-primary-deep cursor-pointer"
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
								className="h-8 px-4 border border-dashed border-brand-border hover:border-brand-primary hover:text-brand-primary-deep rounded-lg flex items-center gap-1.5 text-xs text-brand-muted cursor-pointer transition-colors"
							>
								<Plus className="w-3.5 h-3.5" />
								Thêm nhóm phân loại mới
							</button>
						)}
					</div>

					{/* Dynamic Variant Table */}
					{generatedVariants.length > 0 && (
						<div className="border border-brand-border rounded-xl overflow-hidden bg-white">
							<table className="w-full text-xs text-left">
								<thead className="bg-brand-light-soft border-b border-brand-border font-bold text-brand-dark">
									<tr>
										<th className="p-3">Tên biến thể</th>
										<th className="p-3">Giá bán (đ)</th>
										<th className="p-3">Kho hàng</th>
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
													value={v.stock}
													onChange={(val) =>
														handleUpdateVariantField(
															idx,
															"stock",
															val,
														)
													}
													className="h-8 px-2 border border-brand-border rounded-lg text-xs w-24 focus:outline-none"
													placeholder="Nhập tồn..."
												/>
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
				/* Single Variant Inputs */
				<div className="space-y-4 text-xs max-w-md">
					<h4 className="font-bold text-brand-dark pb-1.5 border-b border-brand-border">
						Cấu hình kho hàng & giá bán đơn lẻ
					</h4>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Giá bán (đ)
							</label>
							<NumberInput
								value={generatedVariants[0]?.price || 0}
								onChange={(price) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], price },
									])
								}
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">
								Kho hàng khả dụng
							</label>
							<NumberInput
								value={generatedVariants[0]?.stock || 0}
								onChange={(stock) =>
									setGeneratedVariants([
										{ ...generatedVariants[0], stock },
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
