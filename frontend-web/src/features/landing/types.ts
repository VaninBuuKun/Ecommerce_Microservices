export interface Category {
	id: string;
	name: string;
	description?: string;
	parentId?: string;
	iconUrl?: string;
}

export interface CategoryState {
	selectedCategory: Category | null;
	setSelectedCategory: (category: Category | null) => void;
}

export interface ProductBasic {
	id: string;
	name: string;
	description: string;
	averageRating: number;
	reviewCount: number;
	ratingSum: number;
	mainImageUrl: string;
}
