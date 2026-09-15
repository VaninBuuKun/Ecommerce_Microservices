export interface Province {
	id: number;
	code: string;
	name: string;
	displayName?: string;
}

export interface District {
	id: number;
	provinceId: number;
	code: string;
	name: string;
	displayName?: string;
}

export interface Ward {
	id: number;
	districtId: number;
	code: string;
	name: string;
	displayName?: string;
}

export interface LocationSummary {
	provinceId: number;
	provinceName: string;
	districtId: number;
	districtName: string;
	wardId: number;
	wardName: string;
}

export interface Shipment {
	id: string | number;
	orderId?: number;
	subOrderId: number;
	customerId?: number;
	shopId?: number;
	carrierName?: string;
	carrier?: string;
	shippingFee: number;
	status: string;
	waybillCode?: string;
	trackingNumber?: string;
	senderAddress?: string;
	recipientAddress?: string;
	recipientName?: string;
	recipientPhone?: string;
	expectedDeliveryDate?: string;
	isRefund?: boolean;
	failureReason?: string;
	trackingLogs?: string;
	createdDate?: string;
	createdAt?: string;
}

// Backward compatibility type aliases
export type ProvinceDto = Province;
export type DistrictDto = District;
export type WardDto = Ward;
export type ShipmentDto = Shipment;
