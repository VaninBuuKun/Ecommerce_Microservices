export const catalogQueryKeys = {
	all: ["catalog"] as const,
	products: (filters: any) => [...catalogQueryKeys.all, "products", filters] as const,
	detail: (id: string) => [...catalogQueryKeys.all, "product", id] as const,
	categories: () => [...catalogQueryKeys.all, "categories"] as const,
};
