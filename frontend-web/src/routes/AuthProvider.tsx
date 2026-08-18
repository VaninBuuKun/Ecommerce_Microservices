import { useEffect, type ReactNode } from "react";
import { useAuthStore, useCurrentUserQuery } from "@/domains/auth";

interface AuthProviderProps {
	children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
	const { accessToken, isInitializing, clearState } = useAuthStore();
	const currentUserQuery = useCurrentUserQuery();

	useEffect(() => {
		if (currentUserQuery.isError && accessToken) {
			console.error("Lỗi xác thực token:", currentUserQuery.error);
			clearState();
		}
	}, [
		accessToken,
		clearState,
		currentUserQuery.error,
		currentUserQuery.isError,
	]);

	const shouldShowBootstrapLoader =
		Boolean(accessToken) && currentUserQuery.isLoading;

	// Hiển thị màn hình chờ toàn cục khi app đang check auth lúc mới vào
	if (isInitializing || shouldShowBootstrapLoader) {
		return (
			<div className="flex items-center justify-center h-screen bg-background text-foreground">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return <>{children}</>;
}
