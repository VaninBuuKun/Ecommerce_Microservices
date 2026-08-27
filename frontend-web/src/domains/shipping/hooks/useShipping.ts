import { useQuery, useMutation } from "@tanstack/react-query";
import { shippingApi, type CalculateShippingFeeRequest } from "../api/shippingApi";

export const shippingQueryKeys = {
	all: ["shipping"] as const,
	locations: ["locations"] as const,
	provinces: () => [...shippingQueryKeys.locations, "provinces"] as const,
	districts: (provinceId?: number) =>
		[...shippingQueryKeys.locations, "districts", provinceId] as const,
	wards: (districtId?: number) =>
		[...shippingQueryKeys.locations, "wards", districtId] as const,
};

export function useProvincesQuery() {
	return useQuery({
		queryKey: shippingQueryKeys.provinces(),
		queryFn: () => shippingApi.getProvinces(),
	});
}

export function useDistrictsQuery(provinceId?: number) {
	return useQuery({
		queryKey: shippingQueryKeys.districts(provinceId),
		queryFn: () => shippingApi.getDistricts(provinceId),
		enabled: Boolean(provinceId),
	});
}

export function useWardsQuery(districtId?: number) {
	return useQuery({
		queryKey: shippingQueryKeys.wards(districtId),
		queryFn: () => shippingApi.getWards(districtId),
		enabled: Boolean(districtId),
	});
}

export function useCalculateShippingFeeMutation() {
	return useMutation({
		mutationFn: (payload: CalculateShippingFeeRequest) =>
			shippingApi.calculateShippingFee(payload),
	});
}
