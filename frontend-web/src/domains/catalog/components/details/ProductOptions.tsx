import { useMemo } from "react";
import type { ProductOption, ProductVariant } from "../../types/catalog.types";

interface ProductOptionsProps {
	options: ProductOption[];
	variants?: ProductVariant[];
	selectedOptions: Record<string, string>;
	onOptionSelect: (
		optionId: string,
		valueId: string,
		tierIndex: number,
	) => void;
}

export function ProductOptions({
	options,
	variants,
	selectedOptions,
	onOptionSelect,
}: ProductOptionsProps) {
	const uniqueOptions = useMemo(() => {
		return (
			options?.reduce((acc: any[], current: any) => {
				if (
					!acc.some(
						(o: any) =>
							o.name.toLowerCase() === current.name.toLowerCase(),
					)
				) {
					acc.push(current);
				}
				return acc;
			}, []) || []
		);
	}, [options]);

	return (
		<div className="space-y-4">
			{uniqueOptions.map((option: any, tierIndex: number) => (
				<div key={option.id} className="space-y-2">
					<div className="flex items-start gap-3">
						<span className="w-20 font-bold text-brand-dark text-xs shrink-0 pt-2">
							{option.name}:
						</span>
						<div className="flex flex-wrap gap-2.5 flex-1">
							{option.values?.map((val: any) => {
								const isSelected =
									selectedOptions[String(option.id)] === String(val.id);

								const matchingVariants = variants
									? variants.filter((v: any) =>
											v.variantOptions?.some(
												(vo: any) => {
													const valObj = options
														.flatMap(
															(o: any) =>
																o.values,
														)
														.find(
															(ov: any) =>
																String(ov.id) ===
																String(vo.optionValueId),
														);
													return (
														valObj?.value?.toLowerCase() ===
														val.value?.toLowerCase()
													);
												},
											),
										)
									: [];
								const isOutOfStock =
									matchingVariants.length === 0 ||
									matchingVariants.every(
										(v: any) =>
											(v.availableStock || 0) <= 0,
									);

								return (
									<button
										key={val.id}
										type="button"
										onClick={() => {
											if (isOutOfStock) return;
											onOptionSelect(
												String(option.id),
												String(val.id),
												tierIndex,
											);
										}}
										className={`px-4 py-2 rounded-md text-sm font-bold border transition-all flex items-center gap-2 ${
											isOutOfStock
												? "cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 line-through"
												: "cursor-pointer bg-white text-brand-dark border-brand-border hover:border-gray-400"
										} ${
											isSelected && !isOutOfStock
												? "bg-brand-primary text-brand-dark border-brand-primary shadow-sm ring-2 ring-brand-primary/30"
												: ""
										}`}
									>
										{val.imageUrl && (
											<img
												src={val.imageUrl}
												alt={val.value}
												className="w-5 h-5 rounded-md object-cover"
											/>
										)}
										<span>{val.value}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
