export interface ProductOptionValue {
	id: number | string;
	value: string;
	imageUrl?: string;
}

export interface ProductOption {
	id: number | string;
	name: string;
	values: ProductOptionValue[];
}

export interface ProductVariant {
	id: number | string;
	sku?: string;
	price: number;
	discountPrice?: number;
	availableStock?: number;
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
	variantName?: string;
	thumbnailUrl?: string;
	variantOptions?: { optionValueId: number | string }[];
}

export interface Product {
	id: number | string;
	shopId: number;
	shopName?: string;
	shopAddress?: string;
	shopPhone?: string;
	shopRecipient?: string;
	categoryId?: number;
	categoryName?: string;
	parentCategoryName?: string;
	name: string;
	description?: string;
	price: number;
	discountPrice?: number;
	availableStock: number;
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
	thumbnailUrl?: string;
	videoUrl?: string;
	imageUrls?: string[];
	averageRating?: number;
	reviewCount?: number;
	soldCount?: number;
	status: string;
	options?: ProductOption[];
	variants?: ProductVariant[];
}

export interface Category {
	id: number | string;
	name: string;
	parentId?: number | string;
	description?: string;
	iconUrl?: string;
	subCategories?: Category[];
	children?: Category[];
}

export interface ProductReview {
	id: string;
	productId: string;
	userId: string;
	userName: string;
	userAvatarUrl?: string;
	rating: number;
	comment?: string;
	mediaUrls?: string[];
	createdAt: string;
	updatedAt?: string;
}

export interface ProductReviewSummary {
	averageRating: number;
	totalReviews: number;
	starDistribution: Record<number, number>;
}

// Backward compatibility type aliases
export type ProductDto = Product;
export type ProductVariantDto = ProductVariant;
export type ProductOptionDto = ProductOption;
export type ProductOptionValueDto = ProductOptionValue;
export type CategoryDto = Category;
