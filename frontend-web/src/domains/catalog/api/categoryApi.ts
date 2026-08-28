import { api } from "@/core";
import type { Category } from "../types/catalog.types";

export interface CreateCategoryRequest {
	name: string;
	parentId?: number;
	description?: string;
	iconUrl?: string;
}

export interface UpdateCategoryRequest {
	name: string;
	parentId?: number;
	description?: string;
	iconUrl?: string;
}

export const categoryApi = {
	getCategories: async (): Promise<Category[]> => {
		const response = await api.get("/categories");
		return response.data?.value || response.data || [];
	},

	createCategory: async (payload: CreateCategoryRequest): Promise<Category> => {
		const response = await api.post("/categories", payload);
		return response.data?.value || response.data;
	},

	updateCategory: async (
		id: number,
		payload: UpdateCategoryRequest,
	): Promise<Category> => {
		const response = await api.put(`/categories/${id}`, payload);
		return response.data?.value || response.data;
	},

	deleteCategory: async (id: number): Promise<void> => {
		await api.delete(`/categories/${id}`);
	},
};
