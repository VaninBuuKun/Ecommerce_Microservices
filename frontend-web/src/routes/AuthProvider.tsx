import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore, useCurrentUserQuery } from "@/domains/auth";
import { parseJwt, isAuthenticated } from "@/shared/utils/authHelper";
import { refreshAccessToken } from "@/core";

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

	// 1. Silent refresh khi vừa vào app (nếu có cookie refresh_token 7 ngày còn hạn)
	useEffect(() => {
		if (!isSilentRefreshing) return;

		let isMounted = true;
		refreshAccessToken()
			.then((newToken) => {
				if (isMounted && newToken) {
					setAccessToken(newToken);
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

	// 2. Proactive Refresh Timer: Chủ động làm mới accessToken trước khi hết hạn 5 phút
	useEffect(() => {
		if (!accessToken) return;

		const payload = parseJwt(accessToken);
		if (!payload?.exp || typeof payload.exp !== "number") return;

		const remainingMs = payload.exp * 1000 - Date.now();
		if (remainingMs <= 0) {
			// Đã quá hạn, làm mới ngay lập tức
			refreshAccessToken();
			return;
		}

		// Đặt hẹn giờ làm mới trước khi hết hạn 5 phút (hoặc 80% thời gian nếu còn dưới 5 phút)
		const refreshBufferMs = 5 * 60 * 1000;
		const delay = remainingMs > refreshBufferMs
			? remainingMs - refreshBufferMs
			: Math.max(5000, remainingMs * 0.8);

		const timerId = setTimeout(() => {
			refreshAccessToken();
		}, delay);

		return () => {
			clearTimeout(timerId);
		};
	}, [accessToken]);

	// 3. Xử lý khi người dùng quay lại tab hoặc mở lại nắp máy tính (visibilitychange & focus)
	useEffect(() => {
		const checkAndRefreshIfNeeded = () => {
			const token = useAuthStore.getState().accessToken;
			if (!token) return;

			const payload = parseJwt(token);
			if (!payload?.exp || typeof payload.exp !== "number") return;

			const remainingMs = payload.exp * 1000 - Date.now();
			// Nếu token đã hết hạn hoặc sắp hết hạn trong vòng 2 phút -> làm mới ngay
			if (remainingMs < 2 * 60 * 1000) {
				refreshAccessToken();
			}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				checkAndRefreshIfNeeded();
			}
		};

		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("focus", checkAndRefreshIfNeeded);

		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("focus", checkAndRefreshIfNeeded);
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

