import api from "@/core/api/axiosInstance";

export const adminApi = {
  // KYC Admin API
  getPendingKycs: async (params?: any): Promise<any> => {
    const res = await api.get("/admin/kyc/pending", { params });
    return res.data;
  },

  approveKyc: async (kycId: string): Promise<any> => {
    const res = await api.post(`/admin/kyc/${kycId}/approve`);
    return res.data;
  },

  rejectKyc: async (kycId: string, reason: string): Promise<any> => {
    const res = await api.post(`/admin/kyc/${kycId}/reject`, { reason });
    return res.data;
  },

  // Withdrawals Admin API
  getWithdrawalRequests: async (params?: any): Promise<any> => {
    const res = await api.get("/admin/withdrawals", { params });
    return res.data?.value || res.data;
  },

  approveWithdrawal: async (id: string): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/approve`);
    return res.data;
  },

  rejectWithdrawal: async (id: string, adminNote: string): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/reject`, { adminNote });
    return res.data;
  },

  completeWithdrawal: async (id: string, data: { adminNote?: string; proofImageUrl?: string }): Promise<any> => {
    const res = await api.put(`/admin/withdrawals/${id}/complete`, data);
    return res.data;
  },


  // Vouchers Admin API
  getVouchers: async (params?: any): Promise<any> => {
    const res = await api.get("/vouchers", { params });
    return res.data?.value || res.data;
  },

  createVoucher: async (payload: any): Promise<any> => {
    const res = await api.post("/vouchers", payload);
    return res.data;
  },

  updateVoucher: async ({ id, payload }: { id: string; payload: any }): Promise<any> => {
    const res = await api.put(`/vouchers/${id}`, payload);
    return res.data;
  },

  deleteVoucher: async (id: string): Promise<any> => {
    const res = await api.delete(`/vouchers/${id}`);
    return res.data;
  },
};
