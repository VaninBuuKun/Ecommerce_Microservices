import axios from "axios";
import { api } from "@/core";

export interface S3UploadInfo {
	uploadUrl: string;
	publicUrl: string;
	uniqueFileName: string;
}

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

	async getUploadInfo(fileName: string, contentType: string): Promise<S3UploadInfo> {
		const res = await api.get(`/medias/upload-url`, {
			params: {
				fileName,
				contentType,
			},
		});
		return res.data;
	},

	async uploadS3(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
		await axios.put(uploadUrl, file, {
			headers: {
				"Content-Type": file.type || "application/octet-stream",
			},
			onUploadProgress: (progressEvent) => {
				if (onProgress && progressEvent.total) {
					const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(percent);
				}
			},
		});
	},

	/**
	 * Tải tệp lên S3 ngầm thông qua Presigned URL và trả về Public URL trực tiếp.
	 */
	async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
		const info = await this.getUploadInfo(file.name, file.type || "application/octet-stream");
		await this.uploadS3(info.uploadUrl, file, onProgress);
		return info.publicUrl || info.uploadUrl.split("?")[0];
	},
};

export default storageService;
