import { formatPrice } from "@/shared";

interface ProductPriceProps {
	priceCalculations: {
		displayPrice: number;
		displayDiscountPrice: number;
		minPrice: number;
		maxPrice: number;
		minDiscountPrice: number;
		maxDiscountPrice: number;
		maxDiscountPercent: number;
		hasMultiplePrices: boolean;
	};
}

export function ProductPrice({ priceCalculations }: ProductPriceProps) {
	const {
		displayPrice,
		displayDiscountPrice,
		minPrice,
		maxPrice,
		minDiscountPrice,
		maxDiscountPrice,
		maxDiscountPercent,
		hasMultiplePrices,
	} = priceCalculations;

	return (
		<div className="p-3.5 bg-brand-light-soft/40 border border-brand-border rounded-xl flex items-center justify-between gap-2.5">
			<div className="flex items-baseline gap-2.5 flex-wrap">
				<span className="text-2xl md:text-3xl font-black text-red-600">
					{hasMultiplePrices
						? `${formatPrice(minDiscountPrice)} - ${formatPrice(maxDiscountPrice)}`
						: formatPrice(displayDiscountPrice)}
				</span>

				{hasMultiplePrices
					? minPrice !== minDiscountPrice && (
							<span className="text-xs text-brand-muted line-through font-semibold">
								{formatPrice(minPrice)} -{" "}
								{formatPrice(maxPrice)}
							</span>
						)
					: displayPrice > displayDiscountPrice && (
							<span className="text-xs text-brand-muted line-through font-semibold">
								{formatPrice(displayPrice)}
							</span>
						)}

				{maxDiscountPercent > 0 && (
					<span className="text-[10px] bg-red-100 text-red-700 font-extrabold uppercase px-2 py-0.5 rounded-md">
						-{maxDiscountPercent}% GIẢM
					</span>
				)}
			</div>
		</div>
	);
}
