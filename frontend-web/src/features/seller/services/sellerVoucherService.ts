import api from "../../../shared/lib/axios";

export interface CreateVoucherRequest {
	code: string;
	discountType: number; // 0: FixedAmount, 1: Percentage
	discountValue: number;
	maxDiscountAmount?: number | null;
	minOrderValue?: number | null;
	startDate: string;
	endDate: string;
	maxUsageCount?: number | null;
	isActive: boolean;
	shopId?: number | null;
}

export interface UpdateVoucherRequest {
	discountValue: number;
	maxDiscountAmount?: number | null;
	minOrderValue?: number | null;
	startDate: string;
	endDate: string;
	maxUsageCount?: number | null;
	isActive: boolean;
}

export const sellerVoucherService = {
	async getVouchers(params: {
		page?: number;
		pageSize?: number;
		code?: string;
		discountType?: number;
		usageLimit?: boolean;
		startDate?: string;
		endDate?: string;
		isActive?: boolean;
		shopId?: number;
	}): Promise<any> {
		const queryParams = new URLSearchParams();
		Object.entries(params).forEach(([key, val]) => {
			if (val !== undefined && val !== null) {
				queryParams.append(key, String(val));
			}
		});
		const res = await api.get(`/vouchers?${queryParams.toString()}`);
		return res.data;
	},

	async createVoucher(payload: CreateVoucherRequest): Promise<any> {
		const res = await api.post("/vouchers", payload);
		return res.data?.value || res.data;
	},

	async updateVoucher(voucherId: string, payload: UpdateVoucherRequest): Promise<any> {
		const res = await api.put(`/vouchers/${voucherId}`, payload);
		return res.data?.value || res.data;
	},

	async deleteVoucher(voucherId: string): Promise<any> {
		// Xóa voucher bằng cách gọi deactive qua API Update (hoặc API DELETE nếu BE có hỗ trợ - 
		// dựa trên VoucherController, cập nhật active/deactive qua UpdateVoucherRequest.isActive = false)
		// Để thuận tiện, ta sẽ có hàm deactive này như một phương thức delete/deactivate.
		const res = await api.put(`/vouchers/${voucherId}`, {
			isActive: false,
			// Bắt buộc truyền các giá trị mặc định cho update
			discountValue: 0,
			startDate: new Date().toISOString(),
			endDate: new Date(Date.now() + 86400000).toISOString(),
		});
		return res.data;
	}
};
