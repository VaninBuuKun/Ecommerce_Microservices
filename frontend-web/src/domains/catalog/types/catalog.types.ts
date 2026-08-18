export interface ProductOptionValueDto {
	id: string;
	value: string;
	imageUrl?: string;
}

export interface ProductOptionDto {
	id: string;
	name: string;
	values: ProductOptionValueDto[];
}

export interface ProductVariantDto {
	id: string;
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
	variantOptions?: { optionValueId: string }[];
}

export interface ProductDto {
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
	availableStock: number;
	weight?: number;
	length?: number;
	width?: number;
	height?: number;
	thumbnailUrl?: string;
	videoUrl?: string;
	imageUrls?: string[];
	status: string;
	averageRating?: number;
	reviewCount?: number;
	options?: ProductOptionDto[];
	variants?: ProductVariantDto[];
}

export interface CategoryDto {
	id: number | string;
	name: string;
	parentId?: number | string;
	description?: string;
	iconUrl?: string;
	subCategories?: CategoryDto[];
	children?: CategoryDto[];
}
