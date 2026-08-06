import { create } from "zustand";
import type { SellerState } from "../types/states";

export const useSellerStore = create<SellerState>((set) => ({
	activeShop: null,

	setActiveShop: (shop) => {
		set({ activeShop: shop });
	},
}));
