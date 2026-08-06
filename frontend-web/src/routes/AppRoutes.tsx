import { Routes, Route, Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LandingPage from "../features/landing/components/LandingPage";
import CartPage from "../features/cart/CartPage";
import CheckoutPage from "../features/order/CheckoutPage";
import { LoginPage, RegisterPage } from "../features/auth";
import SelectShopPage from "../features/seller/pages/SelectShopPage";
import RegisterShopPage from "../features/seller/pages/RegisterShopPage";
import SellerLayout from "../layouts/SellerLayout";
import SellerDashboard from "../features/seller/pages/SellerDashboard";

export default function AppRoutes() {
	return (
		<Routes>
			{/* Các trang hiển thị đầy đủ Header & Footer */}
			<Route path="/" element={<MainLayout />}>
				<Route index element={<LandingPage />} />
				<Route path="cart" element={<CartPage />} />
				<Route path="checkout" element={<CheckoutPage />} />
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

			{/* Các trang Login & Register standalone (Không có Header / Footer) */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
		</Routes>
	);
}
