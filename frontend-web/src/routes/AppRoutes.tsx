import { Routes, Route, Link, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";
import { checkIsAdmin } from "../shared/utils/authHelper";

// Customer Apps Pages
import LandingPage from "@/apps/customer/pages/LandingPage";
import CartPage from "@/apps/customer/pages/CartPage";
import CheckoutPage from "@/apps/customer/pages/CheckoutPage";
import ProductDetailPage from "@/apps/customer/pages/ProductDetailPage";
import WishlistPage from "@/apps/customer/pages/WishlistPage";
import UserProfilePage from "@/apps/customer/pages/UserProfilePage";
import UserProfilePublicPage from "@/apps/customer/pages/UserProfilePublicPage";
import ShopProfilePublicPage from "@/apps/customer/pages/ShopProfilePublicPage";
import ChatPage from "@/apps/customer/pages/ChatPage";
import ExploreProductsPage from "@/apps/customer/pages/ExploreProductsPage";
import OrderDetailPage from "@/apps/customer/pages/OrderDetailPage";

// Seller Apps Pages
import SelectShopPage from "@/apps/seller/pages/SelectShopPage";
import RegisterShopPage from "@/apps/seller/pages/RegisterShopPage";
import SellerDashboardPage from "@/apps/seller/pages/SellerDashboardPage";

// Admin Apps Pages
import AdminDashboardPage from "@/apps/admin/pages/AdminDashboardPage";

// Auth Apps Pages
import LoginPage from "@/apps/auth/pages/LoginPage";
import RegisterPage from "@/apps/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/apps/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/apps/auth/pages/ResetPasswordPage";

export default function AppRoutes() {
	return (
		<Routes>
			{/* Các trang hiển thị đầy đủ Header & Footer */}
			<Route path="/" element={<MainLayout />}>
				<Route index element={<LandingPage />} />
				<Route path="cart" element={<CartPage />} />
				<Route path="checkout" element={<CheckoutPage />} />
				<Route path="products/:id" element={<ProductDetailPage />} />
				<Route path="products" element={<ExploreProductsPage />} />
				<Route path="explore" element={<ExploreProductsPage />} />
				<Route path="wishlist" element={<WishlistPage />} />
				<Route path="chat" element={<ChatPage />} />

				<Route path="profile" element={<UserProfilePage />} />
				<Route path="orders" element={<UserProfilePage />} />
				<Route path="orders/:subOrderId" element={<OrderDetailPage />} />
				<Route path="users/:userId" element={<UserProfilePublicPage />} />
				<Route path="shops/:shopId" element={<ShopProfilePublicPage />} />
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
				<Route path="*" element={<SellerDashboardPage />} />
			</Route>
			<Route path="/seller/dashboard/*" element={<SellerLayout />}>
				<Route path="*" element={<SellerDashboardPage />} />
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
				<Route path="*" element={<AdminDashboardPage />} />
			</Route>

			{/* Các trang Login & Register standalone (Không có Header / Footer) */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
		</Routes>
	);
}

function AdminGuard({ children }: { children: React.ReactNode }) {
	if (!checkIsAdmin()) {
		return <Navigate to="/" replace />;
	}
	return <>{children}</>;
}
