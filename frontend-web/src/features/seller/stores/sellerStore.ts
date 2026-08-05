import { create } from "zustand";
import type { Shop } from "../types/models";
import type { SellerState } from "../types/states";
import { kycService, shopService } from "../services";
import type { CreateShopRequest } from "../types";

const DEFAULT_SHOPS: Shop[] = [];

export const useSellerStore = create<SellerState>((set, get) => ({
	shops: DEFAULT_SHOPS,
	activeShop: DEFAULT_SHOPS.length > 0 ? DEFAULT_SHOPS[0] : null,
	kyc: null,
	isLoadingProfile: false,
	isRegisterKyc: false,

	setActiveShop: (shop) => {
		set({ activeShop: shop });
	},

	addShop: async (request: CreateShopRequest) => {
		try {
			// 1. Gọi API qua service (nhớ thêm await vì là bất đồng bộ)
			const newShop = await shopService.createNewShop(request);

			// 2. Cập nhật state: thêm vào mảng shops và gán activeShop nếu chưa có
			set((state) => ({
				shops: [...state.shops, newShop],
				activeShop: state.activeShop ?? newShop, // Nếu chưa có activeShop thì lấy luôn shop mới tạo này làm active
			}));

			return newShop;
		} catch (error) {
			console.error("Lỗi khi tạo gian hàng:", error);
			// Re-throw lỗi ra ngoài để component hoặc nơi gọi có thể bắt được và bắn toast thông báo
			throw error;
		}
	},

	setKyc: (kycData) => {
		set({
			kyc: kycData,
			isRegisterKyc: kycData?.status === "Verified",
		});
	},

	fetchSellerProfile: async () => {
		set({ isLoadingProfile: true });
		try {
			const profile = await kycService.getMySellerProfile();

			set({
				kyc: profile.kyc,
				shops: profile.shops,
				activeShop: null,
				isRegisterKyc: profile.kyc?.status === "Verified",
				isLoadingProfile: false,
			});
			return { kyc: profile.kyc, shops: profile.shops };
		} catch (error) {
			console.error("Lỗi khi tải thông tin profile người bán:", error);
			set({ isLoadingProfile: false });
			return { kyc: null, shops: [] };
		}
	},

	saveKycDraft: async ({ identityNumber, identityFront, identityBack }) => {
		const kyc = await kycService.registerKyc({
			identityCardNumber: identityNumber,
			identityCardFrontUrl: identityFront,
			identityCardBackUrl: identityBack,
			isDraft: true,
		});
		set({
			kyc,
			isRegisterKyc: kyc.status === "Verified",
		});
		return kyc;
	},

	submitKyc: async ({ identityNumber, identityFront, identityBack }) => {
		const kyc = await kycService.registerKyc({
			identityCardNumber: identityNumber,
			identityCardFrontUrl: identityFront,
			identityCardBackUrl: identityBack,
			isDraft: false,
		});
		set({
			kyc,
			isRegisterKyc: kyc.status === "Verified",
		});
		return kyc;
	},

	withdrawKycDraft: async () => {
		const kyc = await kycService.withdrawDraft();
		set({
			kyc,
			isRegisterKyc: kyc.status === "Verified",
		});
		return kyc;
	},
}));
