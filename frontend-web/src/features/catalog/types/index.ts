export interface ProductImage {
	id: string;
	imageUrl: string;
	isMain: boolean;
}

export interface ProductOptionValue {
	id: string;
	value: string;
	imageUrl?: string;
	sortOrder: number;
}

export interface ProductOption {
	id: string;
	name: string;
	sortOrder: number;
	values: ProductOptionValue[];
}

export interface ProductVariantOption {
	optionValueId: string;
}

export interface ProductVariant {
	id: string;
	sku?: string;
	price: number;
	availableStock: number;
	reservedStocks: number;
	variantOptions: ProductVariantOption[];
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
}

export interface Product {
	id: string;
	name: string;
	description: string;
	status: string;
	averageRating: number;
	reviewCount: number;
	ratingSum: number;
	priceDisplay: number;
	mainImageUrl: string;
	thumbnailUrl?: string;
	videoUrl?: string;
	imageUrls: string[];
	weight: number;
	length: number;
	width: number;
	height: number;
	options: ProductOption[];
	variants: ProductVariant[];
	availableStock: number;
	price: number;
}

export interface PagedCursorResponse<T> {
	items: T[];
	nextCursor: string | null;
	hasNext: boolean;
}
