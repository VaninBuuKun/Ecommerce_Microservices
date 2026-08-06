import { useQuery } from "@tanstack/react-query";
import api from "../../../shared/lib/axios";
import type { Category } from "../types";

export const useCategories = () => {
	return useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const res = await api.get<Category[]>("/categories");
			return res.data;
		},
		staleTime: 1000 * 60 * 5, // 5 phút không gọi lại API nếu dữ liệu còn mới
	});
};
