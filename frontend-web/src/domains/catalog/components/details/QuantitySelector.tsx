import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
	quantity: number;
	setQuantity: (qty: number) => void;
	currentStock: number;
}

export function QuantitySelector({
	quantity,
	setQuantity,
	currentStock,
}: QuantitySelectorProps) {
	return (
		<div className="flex items-center gap-3 text-xs">
			<span className="w-20 font-bold text-brand-dark shrink-0">
				Số lượng:
			</span>
			<div className="flex items-center gap-1">
				<button
					type="button"
					disabled={quantity <= 1}
					onClick={() => setQuantity(quantity - 1)}
					className="w-8 h-8 rounded-md border border-brand-border bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer disabled:opacity-40"
				>
					<Minus className="w-3.5 h-3.5" />
				</button>

				<input
					type="number"
					value={quantity}
					min={1}
					max={currentStock || 99}
					onChange={(e) =>
						setQuantity(Math.max(1, Number(e.target.value)))
					}
					className="w-12 h-8 border border-brand-border rounded-md text-center font-bold text-brand-dark text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>

				<button
					type="button"
					disabled={quantity >= (currentStock || 99)}
					onClick={() => setQuantity(quantity + 1)}
					className="w-8 h-8 rounded-md border border-brand-border bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer disabled:opacity-40"
				>
					<Plus className="w-3.5 h-3.5" />
				</button>
			</div>
			<span className="text-[11px] text-brand-muted font-semibold ml-2">
				{currentStock !== undefined
					? `${currentStock} sản phẩm có sẵn`
					: ""}
			</span>
		</div>
	);
}
