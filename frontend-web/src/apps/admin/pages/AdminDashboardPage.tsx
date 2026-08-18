import { Routes, Route, Navigate } from "react-router-dom";
import { 
	AdminProductsView, 
	AdminOrdersView, 
	AdminShipmentsView, 
	AdminRefundsView, 
	AdminCategoriesView, 
	AdminUsersView, 
	AdminShopsView, 
	AdminVouchersView, 
	AdminWalletsDashboardView 
} from "@/domains/admin";

export default function AdminDashboardPage() {
	return (
		<Routes>
			<Route index element={<Navigate to="products" replace />} />
			<Route path="products" element={<AdminProductsView />} />
			<Route path="orders" element={<AdminOrdersView />} />
			<Route path="shipments" element={<AdminShipmentsView />} />
			<Route path="refunds" element={<AdminRefundsView />} />
			<Route path="categories" element={<AdminCategoriesView />} />
			<Route path="users" element={<AdminUsersView />} />
			<Route path="shops" element={<AdminShopsView />} />
			<Route path="vouchers" element={<AdminVouchersView />} />
			<Route path="wallets" element={<AdminWalletsDashboardView />} />
		</Routes>
	);
}

