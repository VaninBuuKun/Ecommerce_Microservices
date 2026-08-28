import api from "@/core/api/axiosInstance";

export const addressApi = {
  getUserAddresses: async (): Promise<any[]> => {
    const res = await api.get("/users/addresses");
    return res.data;
  },

  createAddress: async (data: any): Promise<any> => {
    const res = await api.post("/users/addresses", data);
    return res.data;
  },

  setDefaultAddress: async (id: number): Promise<any> => {
    const res = await api.put(`/users/addresses/${id}/default`);
    return res.data;
  },

  deleteAddress: async (id: number): Promise<void> => {
    await api.delete(`/users/addresses/${id}`);
  },
};
