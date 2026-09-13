import { useSellerStore, ShopAnalyticsDashboard } from "@/domains/seller";

export function RevenueView() {
	const { activeShop } = useSellerStore();

	return (
		<div className="space-y-6 text-left font-sans">
			{/* Dashboard Thống Kê & Phân Tích (Cập nhật động 100% theo mốc thời gian được chọn) */}
			<ShopAnalyticsDashboard
				shopId={activeShop?.id}
				shopName={activeShop?.name || "Cửa hàng của tôi"}
				isAdminView={false}
			/>
		</div>
	);
}

export default RevenueView;
