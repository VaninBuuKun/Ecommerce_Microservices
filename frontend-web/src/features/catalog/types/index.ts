import { z } from "zod";

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
	discountPrice: number;
	variantName?: string;
	thumbnailUrl?: string;
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
	thumbnailUrl: string;
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
	discountPrice: number;
	categoryId: string;
	categoryName?: string;
	parentCategoryName?: string;
	shopId: number;
	shopName?: string;
	shopPhone?: string;
	shopAddress?: string;
	shopRecipient?: string;
	shopOwnerId?: number;
	tag: string | null;
}

export interface PagedCursorResponse<T> {
	items: T[];
	nextCursor: string | null;
	hasNext: boolean;
}

// 1. Zod Schema khớp hoàn toàn với Request Record của Backend
export const bulkVariantsCommandSchema = z.object({
	options: z.array(
		z.object({
			id: z.string().uuid().optional().nullable(),
			name: z.string(),
			values: z.array(
				z.object({
					id: z.string().uuid().optional().nullable(),
					value: z.string(),
					imageUrl: z.string().optional().nullable(),
				}),
			),
		}),
	),
	variants: z.array(
		z.object({
			id: z.string().uuid().optional().nullable(),
			price: z.number().min(0, "Giá bán không được âm"),
			discountPrice: z.number().min(0).optional().nullable(),
			availableStock: z.number().int().min(0, "Tồn kho không được âm"),
			weight: z.number().min(0),
			length: z.number().min(0),
			width: z.number().min(0),
			height: z.number().min(0),
			optionValues: z.array(
				z.object({
					optionName: z.string(),
					valueName: z.string(),
				}),
			),
		}),
	),
});

export type BulkVariantsPayload = z.infer<typeof bulkVariantsCommandSchema>;
