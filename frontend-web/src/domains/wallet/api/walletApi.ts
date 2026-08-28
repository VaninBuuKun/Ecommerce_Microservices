import api from "@/core/api/axiosInstance";

export const walletApi = {
  getWallet: async (): Promise<any> => {
    const res = await api.get("/wallet");
    return res.data;
  },

  activateWallet: async (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }): Promise<any> => {
    const res = await api.post("/wallet/activate", data);
    return res.data;
  },

  getWalletTransactions: async (): Promise<any[]> => {
    const res = await api.get("/wallet/transactions");
    return res.data;
  },

  getBankAccounts: async (): Promise<any[]> => {
    const res = await api.get("/wallet/bank-accounts");
    return res.data;
  },

  addBankAccount: async (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean }): Promise<any> => {
    const res = await api.post("/wallet/bank-accounts", data);
    return res.data;
  },

  updateBankAccount: async (id: number, data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean }): Promise<any> => {
    const res = await api.put(`/wallet/bank-accounts/${id}`, data);
    return res.data;
  },

  createWithdrawal: async (data: { amount: number; bankAccountId: number }): Promise<any> => {
    const res = await api.post("/withdrawals", data);
    return res.data;
  },

  getMyWithdrawals: async (): Promise<any[]> => {
    const res = await api.get("/withdrawals");
    return res.data?.value || res.data || [];
  },
};
