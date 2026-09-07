import { formatPrice } from "@/shared";

interface ProductPriceProps {
	priceCalculations: {
		displayPrice: number;
		displayDiscountPrice: number;
		minPrice: number;
		maxPrice: number;
		minDiscountPrice: number;
		maxDiscountPrice: number;
		minDiscountPercent: number;
		maxDiscountPercent: number;
		hasMultiplePrices: boolean;
	};
}

export function ProductPrice({ priceCalculations }: ProductPriceProps) {
	const {
		displayPrice,
		displayDiscountPrice,
		minDiscountPrice,
		maxDiscountPrice,
		minDiscountPercent,
		maxDiscountPercent,
		hasMultiplePrices,
	} = priceCalculations;

	return (
		<div className="p-3.5 bg-brand-light-soft/40 border border-brand-border rounded-md flex items-center justify-between gap-2.5 min-h-[52px]">
			<div className="flex items-baseline gap-2 whitespace-nowrap overflow-hidden text-ellipsis leading-none">
				<span className="text-xl md:text-2xl font-black text-red-600 tracking-tight">
					{hasMultiplePrices
						? `${formatPrice(minDiscountPrice)} - ${formatPrice(maxDiscountPrice)}`
						: formatPrice(displayDiscountPrice)}
				</span>

				{hasMultiplePrices ? (
					maxDiscountPercent > 0 && (
						<span className="text-xs md:text-sm font-bold text-red-500">
							{minDiscountPercent === maxDiscountPercent
								? `(-${minDiscountPercent}%)`
								: `(-${minDiscountPercent}% ~ -${maxDiscountPercent}%)`}
						</span>
					)
				) : (
					displayPrice > displayDiscountPrice && maxDiscountPercent > 0 && (
						<span className="text-xs md:text-sm font-bold text-red-500">
							(-{maxDiscountPercent}%)
						</span>
					)
				)}
			</div>
		</div>
	);
}
