export interface AdminOverviewData {
	totalShops: number;
	totalOrders: number;
	platformRevenue: number;
	todayNewOrders: number;
}

export interface AdminRevenueChartPoint {
	date: string;
	revenue: number;
	orderCount: number;
}

export const mockAdminOverview: AdminOverviewData = {
	totalShops: 13,
	totalOrders: 1540,
	platformRevenue: 580000000,
	todayNewOrders: 85,
};

export const mockAdminRevenue7d: AdminRevenueChartPoint[] = [
	{ date: "09-05", revenue: 65000000, orderCount: 140 },
	{ date: "09-06", revenue: 82000000, orderCount: 195 },
	{ date: "09-07", revenue: 95000000, orderCount: 230 },
	{ date: "09-08", revenue: 74000000, orderCount: 165 },
	{ date: "09-09", revenue: 110000000, orderCount: 260 },
	{ date: "09-10", revenue: 89000000, orderCount: 210 },
	{ date: "09-11", revenue: 98000000, orderCount: 225 },
];

export const mockAdminRevenue30d: AdminRevenueChartPoint[] = [
	{ date: "08-15", revenue: 55000000, orderCount: 120 },
	{ date: "08-20", revenue: 72000000, orderCount: 170 },
	{ date: "08-25", revenue: 88000000, orderCount: 205 },
	{ date: "08-30", revenue: 92000000, orderCount: 220 },
	{ date: "09-05", revenue: 82000000, orderCount: 195 },
	{ date: "09-10", revenue: 110000000, orderCount: 260 },
	{ date: "09-11", revenue: 98000000, orderCount: 225 },
];
