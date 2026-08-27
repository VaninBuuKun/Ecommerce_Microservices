import { productApi } from "./productApi";
import { categoryApi } from "./categoryApi";
import { reviewApi } from "./reviewApi";
import { shippingApi } from "@/domains/shipping";

/**
 * @deprecated Use domain-focused `productApi`, `categoryApi`, `reviewApi`, or `shippingApi` directly.
 */
export const catalogApi = {
	...productApi,
	...categoryApi,
	...reviewApi,
	...shippingApi,
};

export * from "./productApi";
export * from "./categoryApi";
export * from "./reviewApi";
export * from "./wishlistApi";
