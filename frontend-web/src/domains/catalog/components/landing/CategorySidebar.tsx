import {
	Laptop,
	Smartphone,
	Home,
	Watch,
	Camera,
	Tv,
	Shirt,
	FolderOpen,
	Tag,
	ShoppingBag,
	Sparkles,
} from "lucide-react";
import { useCategoriesQuery } from "../../hooks/useCatalog";
import { useNavigate } from "react-router-dom";
export function CategorySidebar() {
	const navigate = useNavigate();
	const { data: categories = [], isLoading: isCategoriesLoading } = useCategoriesQuery();

	const getCategoryIcon = (name: string, index: number) => {
		const lowerName = name.toLowerCase();
		if (lowerName.includes("máy tính") || lowerName.includes("laptop"))
			return <Laptop className="w-4 h-4 text-blue-600 shrink-0" />;
		if (lowerName.includes("điện thoại") || lowerName.includes("phụ kiện"))
			return <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />;
		if (lowerName.includes("thời trang") || lowerName.includes("áo") || lowerName.includes("quần"))
			return <Shirt className="w-4 h-4 text-pink-600 shrink-0" />;
		if (lowerName.includes("nhà cửa") || lowerName.includes("gia dụng"))
			return <Home className="w-4 h-4 text-amber-600 shrink-0" />;
		if (lowerName.includes("đồng hồ") || lowerName.includes("trang sức"))
			return <Watch className="w-4 h-4 text-emerald-600 shrink-0" />;
		if (lowerName.includes("máy ảnh") || lowerName.includes("quay phim"))
			return <Camera className="w-4 h-4 text-indigo-600 shrink-0" />;
		if (lowerName.includes("điện tử") || lowerName.includes("tivi"))
			return <Tv className="w-4 h-4 text-cyan-600 shrink-0" />;

		const icons = [
			<Tag key="1" className="w-4 h-4 text-rose-600 shrink-0" />,
			<ShoppingBag key="2" className="w-4 h-4 text-orange-600 shrink-0" />,
			<Sparkles key="3" className="w-4 h-4 text-yellow-600 shrink-0" />,
			<FolderOpen key="4" className="w-4 h-4 text-teal-600 shrink-0" />,
		];
		return icons[index % icons.length];
	};

	return (
		<aside className="w-[230px] shrink-0 sticky top-16 space-y-3 max-h-[calc(100vh-80px)] overscroll-contain">
			{/* Left Card 1: Promo Welcome Card */}
			{/* <div className="bg-white border border-brand-border/70 rounded-xl p-3 shadow-2xs flex items-center justify-between text-left">
				<div className="space-y-0.5">
					<h4 className="text-[11px] font-black text-blue-600 uppercase tracking-tight">
						ƯU ĐÃI ĐẾN 100K – ĐƠN ĐẦU TIÊN
					</h4>
					<p className="text-[10px] text-brand-muted font-bold leading-tight">
						Giảm 50K + Freeship 50K | Có sẵn trong ví khi đặt...
					</p>
				</div>
				<div className="p-1 bg-blue-50 rounded-md text-blue-600 font-extrabold text-[10px] shrink-0">
					-100K
				</div>
			</div> */}

			{/* Left Card 2: Category List */}
			<div className="bg-white border border-brand-border/70 rounded-xl p-3 shadow-2xs space-y-2 text-left">
				<h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
					Danh mục
				</h3>
				<div className="space-y-0.5 max-h-[460px] overflow-y-auto category-scrollbar pr-1 pb-2">
					{isCategoriesLoading ? (
						<div className="space-y-2 py-1">
							{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
								<div
									key={i}
									className="h-7 bg-slate-100 rounded-lg animate-pulse"
								/>
							))}
						</div>
					) : categories.length === 0 ? (
						<p className="text-xs text-brand-muted py-6 text-center font-semibold">
							Không có danh mục nào
						</p>
					) : (
						categories.map((c: any, index: number) => (
							<button
								key={c.id}
								onClick={() => {
									if (!c.parentId) {
										navigate(`/explore?parentCategoryId=${c.id}`);
									} else {
										navigate(`/explore?subCategoryId=${c.id}`);
									}
								}}
								className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs font-bold text-brand-dark hover:bg-brand-primary/10 hover:text-brand-primary-deep transition-all duration-150 cursor-pointer border-none bg-transparent group text-left"
							>
								{c.iconUrl ? (
									<img
										src={c.iconUrl}
										alt={c.name}
										className="w-4 h-4 object-cover rounded-md shrink-0 group-hover:scale-110 transition-transform"
									/>
								) : (
									getCategoryIcon(c.name, index)
								)}
								<span className="line-clamp-1 leading-tight flex-1">
									{c.name}
								</span>
							</button>
						))
					)}
				</div>
			</div>
		</aside>
	);
}
