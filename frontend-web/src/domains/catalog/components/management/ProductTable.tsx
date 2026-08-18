import { useState } from "react";
import { ProductRow } from "./ProductRow";
import type { ProductDto } from "../../types/catalog.types";

interface ProductTableProps {
	products: ProductDto[];
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggleStatus?: (id: string, currentStatus: string) => void;
	isDeleting?: boolean;
	updatingStatusId?: string | null;
}

export function ProductTable({
	products,
	onEdit,
	onDelete,
	onToggleStatus,
	isDeleting,
	updatingStatusId,
}: ProductTableProps) {
	const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(
		new Set(),
	);

	const toggleExpand = (id: string) => {
		setExpandedProductIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	if (products.length === 0) {
		return (
			<div className="text-center py-12 border border-dashed border-brand-border rounded-xl text-brand-muted text-xs">
				Không tìm thấy sản phẩm nào.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
			<table className="w-full text-xs text-left border-collapse">
				<thead>
					<tr className="border-b border-brand-border bg-brand-light-soft/50 text-brand-muted font-bold">
						<th className="p-3 w-2/5">Tên sản phẩm</th>
						<th className="p-3">Đã bán</th>
						<th className="p-3">Giá bán</th>
						<th className="p-3">Kho hàng</th>
						<th className="p-3 text-right">Thao tác</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-brand-border/60">
					{products.map((product) => (
						<ProductRow
							key={product.id}
							product={product}
							isExpanded={expandedProductIds.has(product.id)}
							onToggleExpand={toggleExpand}
							onEdit={onEdit}
							onDelete={onDelete}
							onToggleStatus={onToggleStatus}
							isDeleting={isDeleting}
							isUpdatingStatus={updatingStatusId === product.id}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
