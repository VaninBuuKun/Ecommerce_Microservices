import React from "react";
import { Plus } from "lucide-react";

interface ShopItem {
	id: number | string;
	name: string;
	description?: string;
	logoUrl?: string;
}

interface Props {
	shops: ShopItem[];
	onSelectShop: (shop: ShopItem) => void;
	onCreateShop: () => void;
}

export const ShopSelectList: React.FC<Props> = ({
	shops,
	onSelectShop,
	onCreateShop,
}) => {
	return (
		<div>
			<div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
				<h2 className="text-sm font-bold text-brand-dark">
					Chọn cửa hàng bán hàng
				</h2>
				<button
					type="button"
					onClick={onCreateShop}
					className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-primary-deep transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
				>
					<Plus className="w-3.5 h-3.5" />
					Tạo shop mới
				</button>
			</div>

			<div className="space-y-3 max-h-80 overflow-y-auto pr-1">
				{shops.map((shop) => (
					<button
						key={shop.id || shop.name}
						type="button"
						onClick={() => onSelectShop(shop)}
						className="w-full flex items-center gap-3 p-3 border border-brand-border rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group cursor-pointer"
					>
						<img
							src={shop.logoUrl || "https://cdn-icons-png.flaticon.com/512/3081/3081986.png"}
							alt={shop.name}
							className="w-10 h-10 object-cover rounded-full border border-brand-border shrink-0"
							onError={(e) => {
								(e.target as HTMLImageElement).src =
									"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
							}}
						/>
						<div className="flex-1 min-w-0">
							<h4 className="text-xs font-bold text-brand-dark truncate group-hover:text-brand-primary-deep transition-colors">
								{shop.name}
							</h4>
							<p className="text-[10px] text-brand-muted truncate">
								{shop.description || "Chưa có mô tả cửa hàng"}
							</p>
						</div>
					</button>
				))}
			</div>
		</div>
	);
};
