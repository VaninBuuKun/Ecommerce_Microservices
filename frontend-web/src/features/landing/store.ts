import { create } from "zustand";
import type { CategoryState } from "./types";

export const useCategoryStore = create<CategoryState>()((set) => ({
	selectedCategory: null,
	setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
