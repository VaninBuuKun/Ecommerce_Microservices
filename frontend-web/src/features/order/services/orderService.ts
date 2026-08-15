import api from "../../../shared/lib/axios";
import type {
	UserAddress,
	CreateUserAddressRequest,
	CalculateOrderTotalRequest,
	CalOrderGrandTotalResponse,
	CreateOrderCommand,
	CustomerOrderResponse,
	PaymentMethod,
} from "../types";

export const orderService = {
	// Lấy danh sách địa chỉ nhận hàng
	getAddresses: async (): Promise<UserAddress[]> => {
		const response = await api.get<UserAddress[]>("/users/addresses");
		return response.data;
	},

	// Thêm địa chỉ mới
	createAddress: async (
		data: CreateUserAddressRequest,
	): Promise<UserAddress> => {
		const response = await api.post<UserAddress>("/users/addresses", data);
		return response.data;
	},

	// Tính toán tiền hàng và phí vận chuyển
	calculateTotal: async (
		data: CalculateOrderTotalRequest,
	): Promise<CalOrderGrandTotalResponse> => {
		const response = await api.post<CalOrderGrandTotalResponse>(
			"/v1/orders/calculate",
			data,
		);
		return response.data;
	},

	// Thực hiện thanh toán và tạo đơn hàng chính thức
	checkout: async (
		data: CreateOrderCommand,
	): Promise<CustomerOrderResponse> => {
		const response = await api.post<CustomerOrderResponse>(
			"/v1/orders/checkout",
			data,
		);
		return response.data;
	},

	// Đặt địa chỉ mặc định
	setDefaultAddress: async (id: string): Promise<string> => {
		const response = await api.put<string>(`/users/addresses/${id}/default`);
		return response.data;
	},

	// Xóa địa chỉ nhận hàng
	deleteAddress: async (id: string): Promise<void> => {
		await api.delete(`/users/addresses/${id}`);
	},

	// Lấy danh sách hình thức thanh toán khả dụng từ Payments API
	getPaymentMethods: async (): Promise<PaymentMethod[]> => {
		const response = await api.get<PaymentMethod[]>("/payments/methods");
		return response.data;
	},

	// Lấy danh sách voucher khả dụng cho checkout
	getAvailableVouchers: async (shopId?: number | null): Promise<any> => {
		const url = shopId ? `/vouchers/available?shopId=${shopId}` : "/vouchers/available";
		const response = await api.get<any>(url);
		return response.data?.value || response.data;
	},


	// Lấy danh sách đơn hàng của Shop dành cho Seller (hỗ trợ phân trang và lọc ở BE)
	getShopSubOrders: async (
		shopId: string,
		pageNumber = 1,
		pageSize = 5,
		status?: string
	): Promise<any> => {
		const params = new URLSearchParams();
		params.append("pageNumber", String(pageNumber));
		params.append("pageSize", String(pageSize));
		if (status && status !== "All") {
			params.append("status", status);
		}
		const response = await api.get<any>(`/v1/orders/shop/${shopId}/suborders?${params.toString()}`);
		return response.data?.value || response.data;
	},

	// Xác nhận đơn hàng con
	confirmSubOrder: async (subOrderId: string): Promise<void> => {
		await api.put(`/v1/orders/suborder/${subOrderId}/confirm`);
	},

	// Từ chối/hủy đơn hàng con
	rejectSubOrder: async (subOrderId: string, reason: string): Promise<void> => {
		await api.put(`/v1/orders/suborder/${subOrderId}/reject?reason=${encodeURIComponent(reason)}`);
	},

	// Báo đóng gói xong
	packageReadySubOrder: async (
		subOrderId: string,
		dimensions: { weight: number; length: number; width: number; height: number },
	): Promise<void> => {
		await api.put(`/v1/orders/suborder/${subOrderId}/package-ready`, dimensions);
	},

	// Lấy chi tiết đơn hàng con (Aggregate gRPC từ Identity, Payment)
	getSubOrderDetail: async (subOrderId: string, isSeller = true): Promise<any> => {
		const response = await api.get<any>(`/v1/orders/suborder/${subOrderId}/detail?isSeller=${isSeller}`);
		return response.data?.value || response.data;
	},

	// Lấy danh sách lịch sử mua hàng của khách hàng
	getCustomerOrders: async (customerId: string): Promise<any[]> => {
		const response = await api.get<any>(`/v1/orders/customer/${customerId}`);
		return response.data?.value || response.data;
	},

	// Lấy danh sách yêu cầu hoàn tiền của Shop
	getShopRefunds: async (shopId: string): Promise<any[]> => {
		const response = await api.get<any>(`/v1/refunds/shop-requests/${shopId}`);
		return response.data?.value || response.data;
	},

	// Chấp nhận yêu cầu hoàn tiền
	approveRefund: async (id: string, sellerNote?: string): Promise<void> => {
		await api.put(`/v1/refunds/${id}/approve`, { sellerNote });
	},

	// Từ chối yêu cầu hoàn tiền
	rejectRefund: async (id: string, sellerNote: string): Promise<void> => {
		await api.delete(`/v1/refunds/${id}/reject`, { data: { sellerNote } });
	},

	// Khách hàng hủy đơn hàng con
	cancelCustomerSubOrder: async (subOrderId: string, reason: string): Promise<void> => {
		await api.put(`/v1/orders/suborder/${subOrderId}/cancel?reason=${encodeURIComponent(reason)}`);
	},

	// Khách hàng xác nhận đã nhận hàng (hoàn tất đơn hàng)
	completeSubOrder: async (subOrderId: string): Promise<void> => {
		await api.put(`/v1/orders/suborder/${subOrderId}/complete`);
	},

	// Khách hàng yêu cầu hoàn tiền
	createRefund: async (subOrderId: string, reason: string): Promise<any> => {
		const response = await api.post("/v1/refunds", { subOrderId, reason });
		return response.data;
	},

	// Lấy thông tin ví của user
	getWallet: async (): Promise<any> => {
		const response = await api.get("/wallet");
		return response.data;
	},

	// Kích hoạt ví
	activateWallet: async (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string }): Promise<any> => {
		const response = await api.post("/wallet/activate", data);
		return response.data;
	},

	// Lấy danh sách giao dịch ví
	getWalletTransactions: async (): Promise<any[]> => {
		const response = await api.get("/wallet/transactions");
		return response.data;
	},

	// Lấy danh sách tài khoản ngân hàng
	getBankAccounts: async (): Promise<any[]> => {
		const response = await api.get("/wallet/bank-accounts");
		return response.data;
	},

	// Thêm tài khoản ngân hàng liên kết
	addBankAccount: async (data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean }): Promise<any> => {
		const response = await api.post("/wallet/bank-accounts", data);
		return response.data;
	},

	// Cập nhật tài khoản ngân hàng
	updateBankAccount: async (id: string, data: { bankName: string; bankAccountNumber: string; bankAccountHolder: string; isDefault: boolean }): Promise<any> => {
		const response = await api.put(`/wallet/bank-accounts/${id}`, data);
		return response.data;
	},

	// Lấy danh sách yêu cầu hoàn tiền của khách hàng hiện tại
	getMyRefunds: async (): Promise<any[]> => {
		const response = await api.get<any>("/v1/refunds/my-requests");
		return response.data?.value || response.data;
	},

	// Hủy/Rút yêu cầu hoàn tiền
	cancelRefundRequest: async (id: string): Promise<void> => {
		await api.delete(`/v1/refunds/${id}`);
	},
};
