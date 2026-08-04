import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 phút
			refetchOnWindowFocus: false, // Không tự fetch lại khi click ra ngoài tab
			retry: 1, // Thử lại 1 lần nếu request lỗi
		},
	},
});
