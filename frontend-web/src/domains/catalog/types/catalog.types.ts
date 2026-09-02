export interface ProductOptionValue {
	id: string;
	value: string;
	imageUrl?: string;
	sortOrder?: number;
}

export interface ProductOption {
	id: string;
	name: string;
	sortOrder?: number;
	values: ProductOptionValue[];
}

export interface ProductVariant {
	id: string;
	sku?: string;
	price: number;
	discountPrice?: number;
	availableStock?: number;
	variantName?: string;
	thumbnailUrl?: string;
	variantOptions?: { optionValueId: string }[];
}

export interface Product {
	id: string;
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
	minPrice?: number;
	maxPrice?: number;
	minDiscountPrice?: number;
	maxDiscountPrice?: number;
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
	sold?: number;
	soldCount?: number;
	attributesJson?: string;
	status: string;
	options?: ProductOption[];
	variants?: ProductVariant[];
}

export interface Category {
	id: number;
	name: string;
	parentId?: number;
	description?: string;
	iconUrl?: string;
	subCategories?: Category[];
	children?: Category[];
}

export interface ProductReview {
	id: number;
	productId: string;
	userId: number;
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
	oneStarCount: number;
	twoStarCount: number;
	threeStarCount: number;
	fourStarCount: number;
	fiveStarCount: number;
	starDistribution?: Record<number, number>;
}

// Backward compatibility type aliases
export type ProductDto = Product;
export type ProductVariantDto = ProductVariant;
export type ProductOptionDto = ProductOption;
export type ProductOptionValueDto = ProductOptionValue;
