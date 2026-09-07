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

	// Helper to check if a variant's optionValue matches a target option value
	const isVariantOptionMatch = (vo: any, targetValId: string) => {
		if (String(vo.optionValueId) === String(targetValId)) return true;
		const valObj = options
			?.flatMap((o: any) => o.values)
			.find((ov: any) => String(ov.id) === String(vo.optionValueId));
		const targetObj = options
			?.flatMap((o: any) => o.values)
			.find((ov: any) => String(ov.id) === String(targetValId));
		if (
			valObj &&
			targetObj &&
			valObj.value?.trim().toLowerCase() === targetObj.value?.trim().toLowerCase()
		) {
			return true;
		}
		return false;
	};

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

								// Other selected options in different tiers
								const otherSelectedEntries = Object.entries(selectedOptions).filter(
									([optId]) => optId !== String(option.id),
								);

								const matchingVariants = variants
									? variants.filter((v: any) => {
											// 1. Must match current option value
											const matchesCurrent = v.variantOptions?.some((vo: any) =>
												isVariantOptionMatch(vo, String(val.id)),
											);
											if (!matchesCurrent) return false;

											// 2. Must match other already-selected options in other tiers
											const matchesOthers = otherSelectedEntries.every(
												([_, otherValId]) =>
													v.variantOptions?.some((vo: any) =>
														isVariantOptionMatch(vo, String(otherValId)),
													),
											);
											return matchesOthers;
										})
									: [];

								const isUnavailable =
									matchingVariants.length === 0 ||
									matchingVariants.every(
										(v: any) => (v.availableStock || 0) <= 0,
									);

								return (
									<button
										key={val.id}
										type="button"
										disabled={isUnavailable}
										onClick={() => {
											if (isUnavailable) return;
											onOptionSelect(
												String(option.id),
												String(val.id),
												tierIndex,
											);
										}}
										className={`px-4 py-2 rounded-md text-sm font-bold border transition-all flex items-center gap-2 ${
											isUnavailable
												? "cursor-not-allowed opacity-40 pointer-events-none bg-gray-100 text-gray-400 border-gray-200 line-through"
												: "cursor-pointer bg-white text-brand-dark border-brand-border hover:border-gray-400"
										} ${
											isSelected && !isUnavailable
												? "bg-brand-primary text-brand-dark border-brand-primary shadow-sm ring-2 ring-brand-primary/30"
												: ""
										}`}
									>
										{/* Only show image for Option 1 (tierIndex === 0), NEVER for Option 2 (tierIndex > 0) */}
										{val.imageUrl && tierIndex === 0 && (
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
