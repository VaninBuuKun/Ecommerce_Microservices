import { api } from "@/core";

export interface BannerDto {
	id: number;
	title: string;
	subtitle?: string;
	badge?: string;
	imageUrl: string;
	buttonText: string;
	targetUrl: string;
	themeGradient: string;
	displayOrder: number;
	isActive: boolean;
	createdDate: string;
}

export interface CreateBannerRequest {
	title: string;
	subtitle?: string;
	badge?: string;
	imageUrl: string;
	buttonText: string;
	targetUrl: string;
	themeGradient: string;
}

export interface UpdateBannerRequest {
	title: string;
	subtitle?: string;
	badge?: string;
	imageUrl: string;
	buttonText: string;
	targetUrl: string;
	themeGradient: string;
}

export interface ToggleBannerStatusRequest {
	customDisplayOrder?: number;
}

export interface ReorderBannersRequest {
	bannerIds: number[];
}

export const bannerApi = {
	// Public lấy active banners cho Landing page
	getActiveBanners: async (): Promise<BannerDto[]> => {
		const response = await api.get<BannerDto[]>("/banners");
		return response.data;
	},

	// Admin lấy toàn bộ danh sách banners
	getAdminBanners: async (): Promise<BannerDto[]> => {
		const response = await api.get<BannerDto[]>("/banners/admin");
		return response.data;
	},

	// Admin tạo banner mới (mặc định isActive = false, displayOrder = 0)
	createBanner: async (data: CreateBannerRequest): Promise<number> => {
		const response = await api.post<number>("/banners", data);
		return response.data;
	},

	// Admin cập nhật banner
	updateBanner: async (id: number, data: UpdateBannerRequest): Promise<void> => {
		await api.put(`/banners/${id}`, data);
	},

	// Admin xóa banner
	deleteBanner: async (id: number): Promise<void> => {
		await api.delete(`/banners/${id}`);
	},

	// Admin toggle bật / tắt banner kèm vị trí customDisplayOrder
	toggleBannerStatus: async (id: number, customDisplayOrder?: number): Promise<void> => {
		await api.patch(`/banners/${id}/toggle`, { customDisplayOrder });
	},

	// Admin sắp xếp lại thứ tự banner bằng kéo thả (sorted list)
	reorderBanners: async (bannerIds: number[]): Promise<void> => {
		await api.put("/banners/reorder", { bannerIds });
	},
};
