export interface SellerOverviewData {
	todayRevenue: number;
	monthRevenue: number;
	totalOrders: number;
	todayOrders: number;
	pendingOrders: number;
	totalProducts: number;
	averageRating: number;
	totalFollowers: number;
}

export interface RevenueChartPoint {
	date: string;
	revenue: number;
	orderCount: number;
}

export interface TopProductItem {
	productId: string;
	name: string;
	soldQuantity: number;
	revenue: number;
}

export const mockSellerOverview: SellerOverviewData = {
	todayRevenue: 14500000,
	monthRevenue: 185000000,
	totalOrders: 642,
	todayOrders: 28,
	pendingOrders: 6,
	totalProducts: 48,
	averageRating: 4.8,
	totalFollowers: 1350,
};

export const mockSellerRevenue7d: RevenueChartPoint[] = [
	{ date: "09-05", revenue: 9800000, orderCount: 18 },
	{ date: "09-06", revenue: 12400000, orderCount: 24 },
	{ date: "09-07", revenue: 15200000, orderCount: 31 },
	{ date: "09-08", revenue: 11000000, orderCount: 20 },
	{ date: "09-09", revenue: 16800000, orderCount: 35 },
	{ date: "09-10", revenue: 13500000, orderCount: 26 },
	{ date: "09-11", revenue: 14500000, orderCount: 28 },
];

export const mockSellerRevenue30d: RevenueChartPoint[] = [
	{ date: "08-15", revenue: 8500000, orderCount: 15 },
	{ date: "08-20", revenue: 11200000, orderCount: 22 },
	{ date: "08-25", revenue: 14000000, orderCount: 29 },
	{ date: "08-30", revenue: 13200000, orderCount: 25 },
	{ date: "09-05", revenue: 12400000, orderCount: 24 },
	{ date: "09-10", revenue: 16800000, orderCount: 35 },
	{ date: "09-11", revenue: 14500000, orderCount: 28 },
];

export const mockSellerTopProducts: TopProductItem[] = [
	{
		productId: "223811871176790001",
		name: "Bàn phím cơ không dây Bluetooth 3 chế độ kết nối RGB Hot-swap",
		soldQuantity: 142,
		revenue: 134900000,
	},
	{
		productId: "223811871176790002",
		name: "Chuột Gaming công thái học không dây 26000 DPI siêu nhẹ 49g",
		soldQuantity: 98,
		revenue: 67620000,
	},
	{
		productId: "223811871176790006",
		name: "Tấm lót chuột bàn di chuột cỡ lớn 90x40cm chống trượt viền may",
		soldQuantity: 280,
		revenue: 33600000,
	},
	{
		productId: "223811871176790004",
		name: "Giá đỡ màn hình máy tính công thái học tải trọng 9kg xoay 360",
		soldQuantity: 65,
		revenue: 31200000,
	},
];
