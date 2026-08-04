import { create } from "zustand";

export interface Shop {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  identityName?: string;
  identityFrontUrl?: string;
  identityBackUrl?: string;
}

interface SellerState {
  shops: Shop[];
  activeShop: Shop | null;
  setActiveShop: (shop: Shop | null) => void;
  addShop: (shop: Omit<Shop, "id">) => Shop;
}

// Khởi tạo một vài shop mẫu nếu cần test, hoặc rỗng hoàn toàn để kiểm tra luồng đăng ký ban đầu.
// Để có trải nghiệm mượt mà, mặc định chúng ta khởi tạo rỗng. Người dùng có thể click "Đăng ký shop".
const DEFAULT_SHOPS: Shop[] = [];

export const useSellerStore = create<SellerState>((set, get) => ({
  shops: DEFAULT_SHOPS,
  activeShop: DEFAULT_SHOPS.length > 0 ? DEFAULT_SHOPS[0] : null,

  setActiveShop: (shop) => {
    set({ activeShop: shop });
  },

  addShop: (newShopData) => {
    const id = `shop_${Date.now()}`;
    const newShop: Shop = {
      ...newShopData,
      id,
    };
    
    const updatedShops = [...get().shops, newShop];
    set({
      shops: updatedShops,
      activeShop: get().activeShop ? get().activeShop : newShop, // Set làm active shop nếu chưa có active shop
    });

    return newShop;
  },
}));
