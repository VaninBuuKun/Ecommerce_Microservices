import { create } from "zustand";
import type { ShopDto } from "../types/seller.types";

interface SellerState {
	activeShop: ShopDto | null;
	setActiveShop: (shop: ShopDto | null) => void;
}

export const useSellerStore = create<SellerState>((set) => ({
	activeShop: null,
	setActiveShop: (shop) => {
		set({ activeShop: shop });
	},
}));
