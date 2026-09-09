import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

interface AttributeItem {
	key: string;
	value: string;
}

interface ProductDescriptionProps {
	description?: string | null;
	attributesJson?: string | null;
}

export function ProductDescription({ description, attributesJson }: ProductDescriptionProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasContent = description && description.trim().length > 0;

	// Parse JSON attributes
	const attributes: AttributeItem[] = useMemo(() => {
		if (!attributesJson) return [];
		try {
			const parsed = JSON.parse(attributesJson);
			if (Array.isArray(parsed)) {
				return parsed.filter((item) => item.key && item.value);
			}
			return [];
		} catch {
			return [];
		}
	}, [attributesJson]);

	return (
		<div className="bg-white rounded-md border border-brand-border shadow-sm p-4 md:p-5 mb-6 text-left space-y-6">
			{/* Product Specification Attributes Table */}
			{attributes.length > 0 && (
				<div>
					<h2 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-3 border-b border-brand-border pb-2 flex items-center gap-1.5">
						<Layers className="w-4 h-4 text-brand-primary-deep" />
						Thông số sản phẩm
					</h2>
					<div className="rounded-md border border-brand-border/60 overflow-hidden text-xs">
						<table className="w-full text-left border-collapse">
							<tbody>
								{attributes.map((attr, idx) => (
									<tr
										key={idx}
										className={idx % 2 === 0 ? "bg-gray-50/70" : "bg-white"}
									>
										<td className="py-2.5 px-4 font-semibold text-brand-muted w-1/3 border-r border-brand-border/40">
											{attr.key}
										</td>
										<td className="py-2.5 px-4 font-medium text-brand-dark">
											{attr.value}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Product Description Section */}
			<div>
				<h2 className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-3 border-b border-brand-border pb-2">
					Mô tả sản phẩm
				</h2>

				{!hasContent ? (
					<p className="text-xs text-brand-muted italic py-2">
						Chưa có thông tin mô tả chi tiết cho sản phẩm này.
					</p>
				) : (
					<div className="relative">
						<div
							className={`text-xs text-brand-dark leading-relaxed space-y-2 overflow-hidden transition-all duration-300 prose prose-sm max-w-none prose-img:rounded-xl prose-img:max-h-96 prose-img:mx-auto ${
								!isExpanded ? "max-h-60" : "max-h-none"
							}`}
							dangerouslySetInnerHTML={{ __html: description }}
						/>

						{!isExpanded && description.length > 300 && (
							<div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
						)}

						{description.length > 300 && (
							<div className="text-center pt-3 mt-2 border-t border-brand-border/40">
								<button
									type="button"
									onClick={() => setIsExpanded(!isExpanded)}
									className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary-deep hover:text-brand-dark transition-colors cursor-pointer"
								>
									{isExpanded ? (
										<>
											Thu gọn{" "}
											<ChevronUp className="w-4 h-4" />
										</>
									) : (
										<>
											Xem thêm nội dung{" "}
											<ChevronDown className="w-4 h-4" />
										</>
									)}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
