import { formatPrice, formatStock } from "../../../shared";

interface Variant {
	variantName?: string;
	thumbnailUrl?: string;
	price?: number;
	availableStock?: number;
}

interface ProductVariantRowProps {
	variant: Variant;
	parentThumbnail?: string;
}

export function ProductVariantRow({
	variant,
	parentThumbnail,
}: ProductVariantRowProps) {
	const variantName = variant.variantName || "Mặc định";

	return (
		<tr className="bg-gray-50/20 border-t-0 hover:bg-gray-50/60 transition-colors align-top">
			<td className="p-3 pl-11 pb-3.5">
				<div className="flex items-start gap-2.5">
					<img
						src={
							variant.thumbnailUrl ||
							parentThumbnail ||
							"https://via.placeholder.com/32"
						}
						alt={variantName}
						className="w-7 h-7 object-cover rounded border border-brand-border bg-white shrink-0"
					/>
					<div className="space-y-0.5 text-left max-w-xs">
						<span className="text-brand-dark font-medium block truncate">
							{variantName}
						</span>
					</div>
				</div>
			</td>
			<td className="p-3 text-brand-dark font-medium">0</td>
			<td className="p-3 text-brand-dark font-medium">
				{formatPrice(variant.price ?? 0)}
			</td>
			<td className="p-3 text-brand-muted font-medium">
				{formatStock(variant.availableStock ?? 0)}
			</td>
			<td className="p-3"></td>
		</tr>
	);
}
