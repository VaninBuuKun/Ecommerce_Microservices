import { api } from "@/core";
import type { Province, District, Ward } from "../types/shipping.types";

export interface CalculateShippingFeeRequest {
	fromDistrictId: number;
	fromWardCode?: string;
	toDistrictId: number;
	toWardCode?: string;
	weightInGrams: number;
	length?: number;
	width?: number;
	height?: number;
	insuranceValue?: number;
}

export interface CalculateShippingFeeResponse {
	totalFee: number;
	serviceFee?: number;
	insuranceFee?: number;
	expectedDeliveryTime?: string;
}

export const shippingApi = {
	getProvinces: async (): Promise<Province[]> => {
		const res = await api.get("/locations/provinces");
		return res.data?.value || res.data || [];
	},

	getDistricts: async (provinceId?: number): Promise<District[]> => {
		if (!provinceId) return [];
		const res = await api.get(`/locations/provinces/${provinceId}/districts`);
		return res.data?.value || res.data || [];
	},

	getWards: async (districtId?: number): Promise<Ward[]> => {
		if (!districtId) return [];
		const res = await api.get(`/locations/districts/${districtId}/wards`);
		return res.data?.value || res.data || [];
	},

	calculateShippingFee: async (
		payload: CalculateShippingFeeRequest,
	): Promise<CalculateShippingFeeResponse> => {
		const res = await api.post("/shipping/calculate", payload);
		return res.data?.value || res.data;
	},
};
