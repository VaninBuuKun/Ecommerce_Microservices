/**
 * =========================================================================
 * CẤU HÌNH DỮ LIỆU THỐNG KÊ & PHÂN TÍCH (ANALYST / ANALYTICS SERVICE)
 * =========================================================================
 * - Đặt false: Gọi trực tiếp API backend thật qua /api/analytics/... và /api/users/count
 * - Đặt true:  Hiển thị Mock Data phong phú trên giao diện Seller & Admin Dashboard
 *              khi backend chưa bật hoặc chưa có dữ liệu giao dịch thực tế.
 *
 * [MẸO NHANH]: Bạn có thể đổi biến USE_MOCK_ANALYTICS dưới đây (hoặc bật tạm qua Console:
 * localStorage.setItem("USE_MOCK_ANALYTICS", "true"))
 */
export const USE_MOCK_ANALYTICS = false;

export function isMockAnalyticsEnabled(): boolean {
	if (typeof window !== "undefined") {
		const localSetting = localStorage.getItem("USE_MOCK_ANALYTICS");
		if (localSetting !== null) return localSetting === "true";
	}
	return USE_MOCK_ANALYTICS;
}
