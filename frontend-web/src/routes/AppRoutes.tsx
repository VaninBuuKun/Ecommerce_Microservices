import { Routes, Route, Link, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../features/landing/components/LandingPage";
import CartPage from "../features/cart/pages/CartPage";
import CheckoutPage from "../features/order/CheckoutPage";
import ProductDetailPage from "../features/catalog/pages/ProductDetailPage";
import { LoginPage, RegisterPage, UserProfilePage } from "../features/auth";
import SelectShopPage from "../features/seller/pages/SelectShopPage";
import RegisterShopPage from "../features/seller/pages/RegisterShopPage";
import SellerLayout from "../layouts/SellerLayout";
import SellerDashboard from "../features/seller/pages/SellerDashboard";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../features/admin/pages/AdminDashboard";

export default function AppRoutes() {
	return (
		<Routes>
			{/* Các trang hiển thị đầy đủ Header & Footer */}
			<Route path="/" element={<MainLayout />}>
				<Route index element={<LandingPage />} />
				<Route path="cart" element={<CartPage />} />
				<Route path="checkout" element={<CheckoutPage />} />
				<Route path="products/:id" element={<ProductDetailPage />} />
				<Route path="profile" element={<UserProfilePage />} />
				<Route path="orders" element={<UserProfilePage />} />
				<Route
					path="*"
					element={
						<div className="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-md mx-auto px-6">
							<h1 className="text-4xl font-extrabold text-brand-dark mb-3">
								404
							</h1>
							<p className="text-brand-muted mb-6">
								Trang bạn yêu cầu không tồn tại hoặc đã bị di
								dời.
							</p>
							<Link
								to="/"
								className="px-6 py-2.5 bg-brand-primary text-white rounded-full hover:bg-opacity-90 transition-all font-semibold text-sm"
							>
								Quay lại Trang Chủ
							</Link>
						</div>
					}
				/>
			</Route>

			{/* Các trang người bán */}
			<Route path="/seller" element={<SelectShopPage />} />
			<Route path="/seller/register" element={<RegisterShopPage />} />
			<Route
				path="/seller/:shopId/dashboard/*"
				element={<SellerLayout />}
			>
				<Route path="*" element={<SellerDashboard />} />
			</Route>
			<Route path="/seller/dashboard/*" element={<SellerLayout />}>
				<Route path="*" element={<SellerDashboard />} />
			</Route>

			{/* Các trang Admin hệ thống */}
			<Route
				path="/admin/*"
				element={
					<AdminGuard>
						<AdminLayout />
					</AdminGuard>
				}
			>
				<Route path="*" element={<AdminDashboard />} />
			</Route>

			{/* Các trang Login & Register standalone (Không có Header / Footer) */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
		</Routes>
	);
}

function parseJwt(token: string) {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split("")
				.map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join(""),
		);
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
}

function isAdmin() {
	const token = localStorage.getItem("accessToken");
	if (!token) return false;
	const payload = parseJwt(token);
	if (!payload) return false;
	const roles =
		payload.role ||
		payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
	if (Array.isArray(roles)) {
		return roles.includes("Admin") || roles.includes("admin");
	}
	return (
		roles === "Admin" ||
		roles === "admin" ||
		payload.email === "admin@system.com"
	);
}

function AdminGuard({ children }: { children: React.ReactNode }) {
	if (!isAdmin()) {
		return <Navigate to="/" replace />;
	}
	return <>{children}</>;
}
