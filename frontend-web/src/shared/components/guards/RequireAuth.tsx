import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/domains/auth";


interface RequireAuthProps {
	children?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
	const location = useLocation();
	const accessToken = useAuthStore((s) => s.accessToken);

	// Chỉ chuyển hướng sang Login khi người dùng thực sự không có session đăng nhập
	if (!accessToken) {
		const redirectUrl = encodeURIComponent(location.pathname + location.search);
		return <Navigate to={`/login?redirect=${redirectUrl}`} replace state={{ from: location }} />;
	}

	return children ? <>{children}</> : <Outlet />;
};

export default RequireAuth;
