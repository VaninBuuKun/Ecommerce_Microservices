import type { Shop } from "./models";

export interface SellerState {
	activeShop: Shop | null;

	setActiveShop: (shop: Shop | null) => void;
}
