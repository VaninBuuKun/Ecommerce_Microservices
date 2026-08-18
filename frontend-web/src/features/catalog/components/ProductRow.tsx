import {
	ChevronDown,
	ChevronRight,
	Edit,
	Trash2,
	Play,
	Pause,
	Loader2,
} from "lucide-react";
import { ProductVariantRow } from "./ProductVariantRow";
import { formatPrice, formatStock } from "../../../shared";
import type { Product } from "../types";

interface ProductRowProps {
	product: Product;
	isExpanded: boolean;
	onToggleExpand: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggleStatus?: (id: string, currentStatus: string) => void; // Callback xử lý gỡ / mở bán
	isDeleting?: boolean;
	isUpdatingStatus?: boolean; // Loading khi bấm gỡ
}

export function ProductRow({
	product,
	isExpanded,
	onToggleExpand,
	onEdit,
	onDelete,
	onToggleStatus,
	isDeleting,
	isUpdatingStatus,
}: ProductRowProps) {
	console.log(product.status);
	const hasVariants = product.variants && product.variants.length > 0;

	const totalStock = hasVariants
		? product.variants.reduce(
			(acc: number, v: any) => acc + (v.availableStock || 0),
			0,
		)
		: (product.availableStock ?? 0);

	const minPrice = hasVariants
		? Math.min(...product.variants.map((v: any) => v.price))
		: (product.price ?? 0);

	const thumbnail =
		product.thumbnailUrl ||
		product.thumbnailUrl ||
		"https://via.placeholder.com/60";

	const isActive = product.status === "Active";

	return (
		<React.Fragment>
			<tr
				className={`hover:bg-gray-50/20 transition-colors align-top ${!isActive ? "bg-gray-50/50 opacity-80" : ""}`}
			>
				<td className="p-3 pt-4">
					<div className="flex gap-2.5 items-start">
						{hasVariants ? (
							<button
								type="button"
								onClick={() => onToggleExpand(product.id)}
								className="p-1 hover:bg-gray-200/60 rounded text-brand-muted cursor-pointer transition-colors shrink-0 mt-0.5"
							>
								{isExpanded ? (
									<ChevronDown className="w-3.5 h-3.5" />
								) : (
									<ChevronRight className="w-3.5 h-3.5" />
								)}
							</button>
						) : (
							<div className="w-5.5 h-5.5 shrink-0" />
						)}

						<div className="relative shrink-0">
							<img
								src={thumbnail}
								alt={product.name}
								className="w-18 h-18 object-cover rounded border border-brand-border bg-gray-50"
							/>
						</div>

						<div className="flex flex-col items-start gap-1 text-left max-w-sm">
							<span
								className={`px-1.5 py-0.2 font-semibold text-[8px] uppercase tracking-wide inline-block opacity-80 ${isActive
										? "bg-green-50 text-green-700 border border-green-200/80"
										: "bg-red-50 text-red-700 border border-red-200/80"
									}`}
							>
								{isActive ? "Đang hoạt động" : "Đã ẩn"}
							</span>

							<h4 className="font-extrabold text-brand-dark text-sm leading-snug hover:text-brand-primary-deep cursor-pointer truncate w-full">
								{product.name}
							</h4>
						</div>
					</div>
				</td>
				<td className="p-3 pt-4 text-brand-dark font-medium">0</td>
				<td className="p-3 pt-4 text-brand-dark">
					{formatPrice(minPrice)}
				</td>
				<td className="p-3 pt-4 text-brand-muted">
					{formatStock(totalStock)}
				</td>
				<td className="p-3 pt-4 text-right">
					<div className="flex items-center justify-end gap-1.5">
						{/* Nút Đổi trạng thái (Gỡ / Đăng bán lại) */}
						{onToggleStatus && (
							<button
								type="button"
								onClick={() =>
									onToggleStatus(product.id, product.status)
								}
								disabled={isUpdatingStatus}
								className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isActive
										? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
										: "text-green-600 bg-green-50 hover:bg-green-100"
									}`}
								title={
									isActive
										? "Gỡ bán / Tạm ẩn"
										: "Đăng bán lại"
								}
							>
								{isUpdatingStatus ? (
									<Loader2 className="w-4 h-4 animate-spin text-gray-500" />
								) : isActive ? (
									<Pause className="w-4 h-4" />
								) : (
									<Play className="w-4 h-4" />
								)}
							</button>
						)}

						{/* Nút Sửa */}
						<button
							type="button"
							onClick={() => onEdit(product.id)}
							className="p-1.5 text-gray-400 hover:text-brand-dark hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
							title="Chỉnh sửa sản phẩm"
						>
							<Edit className="w-4 h-4" />
						</button>

						{/* Nút Xóa */}
						<button
							type="button"
							onClick={() => onDelete(product.id)}
							disabled={isDeleting}
							className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
							title="Xóa sản phẩm"
						>
							{isDeleting ? (
								<Loader2 className="w-4 h-4 animate-spin text-red-500" />
							) : (
								<Trash2 className="w-4 h-4" />
							)}
						</button>
					</div>
				</td>
			</tr>

			{/* Render Variants */}
			{isExpanded &&
				hasVariants &&
				product.variants.map((variant: any) => (
					<ProductVariantRow
						key={variant.variantName || variant.id}
						variant={variant}
						parentThumbnail={thumbnail}
					/>
				))}
		</React.Fragment>
	);
}
