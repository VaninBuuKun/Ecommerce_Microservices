import axios from "axios";
import { api } from "@/core";


export const storageService = {
	async getUploadUrl(fileName: string, contentType: string): Promise<string> {
		const res = await api.get(`/medias/upload-url`, {
			params: {
				fileName,
				contentType,
			},
		});

		return res.data.uploadUrl;
	},

	async uploadS3(uploadUrl: string, file: File): Promise<void> {
		await axios.put(uploadUrl, file, {
			headers: {
				"Content-Type": file.type || "application/octet-stream",
			},
		});
	},
};
