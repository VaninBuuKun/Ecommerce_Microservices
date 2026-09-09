import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/domains/auth";
import { isAuthenticated } from "@/shared/utils/authHelper";

interface RequireAuthProps {
	children?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
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

	return children ? <>{children}</> : <Outlet />;
};

export default RequireAuth;
