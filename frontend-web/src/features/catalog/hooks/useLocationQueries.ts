import { useQuery } from "@tanstack/react-query";
import { locationService } from "../services/locationService";

export function useProvincesQuery() {
	return useQuery({
		queryKey: ["locations", "provinces"],
		queryFn: () => locationService.getProvinces(),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});
}

export function useDistrictsQuery(provinceId: number | undefined) {
	return useQuery({
		queryKey: ["locations", "districts", provinceId],
		queryFn: () => locationService.getDistricts(provinceId!),
		enabled: Boolean(provinceId),
		staleTime: 1000 * 60 * 60 * 24,
	});
}

export function useWardsQuery(districtId: number | undefined) {
	return useQuery({
		queryKey: ["locations", "wards", districtId],
		queryFn: () => locationService.getWards(districtId!),
		enabled: Boolean(districtId),
		staleTime: 1000 * 60 * 60 * 24,
	});
}
