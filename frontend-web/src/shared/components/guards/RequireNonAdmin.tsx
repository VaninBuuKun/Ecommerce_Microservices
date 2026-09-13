import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/domains/auth";
import { checkIsAdmin } from "@/shared/utils/authHelper";
import { toast } from "react-toastify";

interface RequireNonAdminProps {
	children?: React.ReactNode;
	message?: string;
	redirectTo?: string;
}

/**
 * Route Guard ngăn chặn tài khoản Quản trị viên (Admin) truy cập vào
 * các trang đặc thù của Khách hàng (Cart, Wishlist, Checkout) hoặc Người bán (Seller Center).
 * Nếu Admin truy cập, tự động chuyển hướng về Trang Quản Trị (/admin).
 */
export const RequireNonAdmin: React.FC<RequireNonAdminProps> = ({
	children,
	message = "Tài khoản Quản trị viên không có quyền truy cập trang này.",
	redirectTo = "/admin",
}) => {
	const accessToken = useAuthStore((s) => s.accessToken);

	if (accessToken && checkIsAdmin(accessToken)) {
		toast.info(message);
		return <Navigate to={redirectTo} replace />;
	}

	return children ? <>{children}</> : <Outlet />;
};

export default RequireNonAdmin;
