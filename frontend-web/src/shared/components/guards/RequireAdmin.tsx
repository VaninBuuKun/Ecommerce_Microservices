import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/domains/auth";
import { isAuthenticated, checkIsAdmin } from "@/shared/utils/authHelper";
import { toast } from "react-toastify";

interface RequireAdminProps {
	children?: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
	const location = useLocation();
	const accessToken = useAuthStore((s) => s.accessToken);
	const authed = !!accessToken && isAuthenticated(accessToken);

	if (!authed) {
		if (accessToken) {
			useAuthStore.getState().clearState();
		}
		const redirectUrl = encodeURIComponent(location.pathname + location.search);
		return <Navigate to={`/login?redirect=${redirectUrl}`} replace state={{ from: location }} />;
	}

	if (!checkIsAdmin()) {
		toast.error("Bạn không có quyền truy cập vào trang Quản trị.");
		return <Navigate to="/" replace />;
	}

	return children ? <>{children}</> : <Outlet />;
};

export default RequireAdmin;
