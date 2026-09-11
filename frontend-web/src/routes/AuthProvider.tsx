import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore, useCurrentUserQuery, authService } from "@/domains/auth";
import { isAuthenticated } from "@/shared/utils/authHelper";

interface AuthProviderProps {
	children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
	const { accessToken, isInitializing, clearState, setAccessToken } = useAuthStore();
	const [isSilentRefreshing, setIsSilentRefreshing] = useState<boolean>(() => {
		// Chỉ cần silent refresh khi vừa mở app mà KHÔNG có accessToken hợp lệ trong localStorage
		const token = localStorage.getItem("accessToken");
		return !token || !isAuthenticated(token);
	});

	// Silent refresh khi vừa vào app (nếu có cookie refresh_token 7 ngày còn hạn)
	useEffect(() => {
		if (!isSilentRefreshing) return;

		let isMounted = true;
		authService
			.refresh()
			.then((newToken) => {
				if (isMounted && newToken) {
					setAccessToken(newToken);
				}
			})
			.catch((err) => {
				// Chỉ clearState khi server trả về 401/400 (hết hạn hoặc không có cookie)
				// Không clear khi là Network Error (máy chủ đang restart)
				const status = err?.response?.status;
				if (status === 401 || status === 400) {
					clearState();
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsSilentRefreshing(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, []);

	const currentUserQuery = useCurrentUserQuery();

	useEffect(() => {
		if (currentUserQuery.isError && accessToken) {
			const status = (currentUserQuery.error as any)?.response?.status;
			// ⚠️ CHỈ clearState khi lỗi thực sự là 401 Unauthorized từ server (token hết hạn và refresh thất bại)
			// Tuyệt đối KHÔNG clearState khi là Network Error (máy chủ đang restart) hoặc lỗi 5xx
			if (status === 401) {
				console.warn("Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401):", currentUserQuery.error);
				clearState();
			} else {
				console.warn("Không thể kết nối đến máy chủ hoặc máy chủ đang khởi động lại:", currentUserQuery.error);
			}
		}
	}, [
		accessToken,
		clearState,
		currentUserQuery.error,
		currentUserQuery.isError,
	]);

	const shouldShowBootstrapLoader =
		isSilentRefreshing ||
		isInitializing ||
		(Boolean(accessToken) && currentUserQuery.isLoading);

	// Hiển thị màn hình chờ toàn cục khi app đang check auth lúc mới vào
	if (shouldShowBootstrapLoader) {
		return (
			<div className="flex items-center justify-center h-screen bg-background text-foreground">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return <>{children}</>;
}

