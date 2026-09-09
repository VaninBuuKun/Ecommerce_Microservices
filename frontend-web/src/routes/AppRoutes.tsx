import { Routes, Route, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";
import { RequireAuth, RequireAdmin } from "@/shared/components";

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
			{/* Layout chính: Header & Footer */}
			<Route path="/" element={<MainLayout />}>
				{/* 1. Public Routes (Ai cũng có thể xem) */}
				<Route index element={<LandingPage />} />
				<Route path="products/:id" element={<ProductDetailPage />} />
				<Route path="products" element={<ExploreProductsPage />} />
				<Route path="explore" element={<ExploreProductsPage />} />
				<Route path="users/:userId" element={<UserProfilePublicPage />} />
				<Route path="shops/:shopId" element={<ShopProfilePublicPage />} />

				{/* 2. Customer Protected Routes (Bắt buộc đăng nhập -> Chưa login thì redirect sang /login) */}
				<Route element={<RequireAuth />}>
					<Route path="cart" element={<CartPage />} />
					<Route path="checkout" element={<CheckoutPage />} />
					<Route path="wishlist" element={<WishlistPage />} />
					<Route path="chat" element={<ChatPage />} />
					<Route path="profile" element={<UserProfilePage />} />
					<Route path="orders" element={<UserProfilePage />} />
					<Route path="orders/:subOrderId" element={<OrderDetailPage />} />
				</Route>

				{/* 3. Trang 404 Not Found */}
				<Route
					path="*"
					element={
						<div className="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-md mx-auto px-6">
							<h1 className="text-4xl font-extrabold text-brand-dark mb-3">
								404
							</h1>
							<p className="text-brand-muted mb-6">
								Trang bạn yêu cầu không tồn tại hoặc đã bị di dời.
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

			{/* 4. Seller Protected Routes (Bắt buộc đăng nhập tài khoản) */}
			<Route element={<RequireAuth />}>
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
			</Route>

			{/* 5. Admin Protected Routes (Bắt buộc đăng nhập + Quyền Admin) */}
			<Route element={<RequireAdmin />}>
				<Route path="/admin/*" element={<AdminLayout />}>
					<Route path="*" element={<AdminDashboardPage />} />
				</Route>
			</Route>

			{/* 6. Auth Guest Routes */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<ForgotPasswordPage />} />
			<Route path="/reset-password" element={<ResetPasswordPage />} />
		</Routes>
	);
}
