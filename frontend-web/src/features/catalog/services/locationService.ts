import api from "../../../shared/lib/axios";

export interface Province {
	id: number;
	name: string;
	displayName: string;
}

export interface District {
	id: number;
	provinceId: number;
	name: string;
	displayName: string;
}

export interface Ward {
	id: number;
	districtId: number;
	name: string;
	displayName: string;
}

export const locationService = {
	getProvinces: async (): Promise<Province[]> => {
		const response = await api.get<Province[]>("/locations/provinces");
		return response.data;
	},

	getDistricts: async (provinceId: number): Promise<District[]> => {
		const response = await api.get<District[]>(`/locations/provinces/${provinceId}/districts`);
		return response.data;
	},

	getWards: async (districtId: number): Promise<Ward[]> => {
		const response = await api.get<Ward[]>(`/locations/districts/${districtId}/wards`);
		return response.data;
	},
};
