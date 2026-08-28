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

export interface Shipment {
	id: number;
	orderId: number;
	subOrderId: number;
	trackingNumber?: string;
	carrier: string;
	status: string;
	shippingFee: number;
	expectedDeliveryDate?: string;
	createdAt: string;
}

// Backward compatibility type aliases
export type ProvinceDto = Province;
export type DistrictDto = District;
export type WardDto = Ward;
export type ShipmentDto = Shipment;
