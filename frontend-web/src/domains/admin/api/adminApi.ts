import { api } from "@/core";

export const adminApi = {
  // KYC Admin API
  getAdminKycs: async (params?: { page?: number; pageSize?: number; status?: string }): Promise<any> => {
    const res = await api.get("/kyc/admin/list", { params });
    return res.data?.value || res.data;
  },

  approveKyc: async (kycId: number): Promise<any> => {
    const res = await api.put(`/kyc/${kycId}/approve`);
    return res.data;
  },

  rejectKyc: async (kycId: number, reason: string): Promise<any> => {
    const res = await api.put(`/kyc/${kycId}/reject`, { reason });
    return res.data;
  },

  // Withdrawals Admin API
  getWithdrawalRequests: async (params?: any): Promise<any> => {
    const res = await api.get("/admin/withdrawals", { params });
    return res.data?.value || res.data;
  },

  approveWithdrawal: async (id: number): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/approve`);
    return res.data;
  },

  rejectWithdrawal: async (id: number, adminNote: string): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/reject`, { adminNote });
    return res.data;
  },

  completeWithdrawal: async (id: number, data: { adminNote?: string; proofImageUrl?: string }): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/complete`, data);
    return res.data;
  },

  // Vouchers Admin API (Hỗ trợ phân trang offset, lọc scope: Platform / Shop, ShopId, Code,...)
  getVouchers: async (params?: {
    page?: number;
    pageSize?: number;
    code?: string;
    discountType?: string;
    scope?: string;
    isActive?: boolean;
    shopId?: number;
    usageLimit?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const res = await api.get("/vouchers/admin", { params });
    return res.data?.value || res.data;
  },

  createVoucher: async (payload: any): Promise<any> => {
    const res = await api.post("/vouchers", payload);
    return res.data;
  },

  updateVoucher: async ({ id, payload }: { id: number; payload: any }): Promise<any> => {
    const res = await api.put(`/vouchers/${id}`, payload);
    return res.data;
  },

  deleteVoucher: async (id: number): Promise<any> => {
    const res = await api.delete(`/vouchers/${id}`);
    return res.data;
  },

  // Products Admin API
  getAdminProducts: async (params?: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    categoryId?: number;
    shopId?: number;
    status?: string;
  }): Promise<any> => {
    const res = await api.get("/products/admin", { params });
    return res.data?.value || res.data;
  },

  // Users Admin API
  getAdminUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<any> => {
    const res = await api.get("/users", { params });
    return res.data?.value || res.data;
  },

  // Shops Admin API
  getAdminShops: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: string;
  }): Promise<any> => {
    const res = await api.get("/shop/all", { params });
    return res.data?.value || res.data;
  },

  // Orders Admin API
  getAdminOrders: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
    searchKeyword?: string;
  }): Promise<any> => {
    const res = await api.get("/orders/admin/sub-orders", { params });
    return res.data?.value || res.data;
  },

  // Payment Methods Admin API
  getPaymentMethods: async (): Promise<any> => {
    const res = await api.get("/payments/methods");
    return res.data?.value || res.data;
  },

  createPaymentMethod: async (payload: {
    title: string;
    subTitle?: string;
    isActive: boolean;
    providerName: string;
    iconUrl: string;
  }): Promise<any> => {
    const res = await api.post("/payments/methods", payload);
    return res.data?.value || res.data;
  },

  updatePaymentMethod: async ({
    id,
    payload,
  }: {
    id: number;
    payload: {
      title: string;
      subTitle?: string;
      isActive: boolean;
      providerName: string;
      iconUrl: string;
    };
  }): Promise<any> => {
    const res = await api.put(`/payments/methods/${id}`, payload);
    return res.data?.value || res.data;
  },

  togglePaymentMethodStatus: async (id: number): Promise<any> => {
    const res = await api.put(`/payments/methods/${id}/toggle`);
    return res.data?.value || res.data;
  },
};
