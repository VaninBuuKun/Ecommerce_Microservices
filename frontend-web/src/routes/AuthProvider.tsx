// src/providers/AuthProvider.tsx
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "../features/auth";

interface AuthProviderProps {
	children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
	const { accessToken, fetchUserProfile } = useAuthStore();
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			if (accessToken) {
				try {
					await fetchUserProfile();
				} catch (error) {
					console.error("Lỗi xác thực token:", error);
				}
			}
			setIsInitializing(false);
		};

		initAuth();
	}, [accessToken, fetchUserProfile]);

	// Hiển thị màn hình chờ toàn cục khi app đang check auth lúc mới vào
	if (isInitializing) {
		return (
			<div className="flex items-center justify-center h-screen bg-background text-foreground">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return <>{children}</>;
}
