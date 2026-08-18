import { useState } from "react";
import { Search } from "lucide-react";

interface ProductSearchBarProps {
	initialSearchTerm: string;
	onSearch: (term: string) => void;
}

export function ProductSearchBar({
	initialSearchTerm,
	onSearch,
}: ProductSearchBarProps) {
	const [searchInput, setSearchInput] = useState(initialSearchTerm);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch(searchInput);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex gap-2 p-3 bg-gray-50 border border-brand-border rounded-lg"
		>
			<div className="relative flex-1 max-w-sm">
				<input
					type="text"
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Tìm theo tên sản phẩm..."
					className="w-full h-8 pl-8 pr-3 bg-white border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary transition-colors"
				/>
				<Search className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-2.5" />
			</div>
			<button
				type="submit"
				className="h-8 px-3 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary-deep text-xs font-bold rounded cursor-pointer transition-colors"
			>
				Tìm kiếm
			</button>
		</form>
	);
}
