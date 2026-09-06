import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { storageService } from "@/shared/services/storageService";
import type { ChatPendingMedia } from "../types/chat.types";

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB cho 1 video riêng lẻ
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB cho 1 ảnh riêng lẻ

interface UseChatMediaUploadOptions {
	onAutoSendMedia?: (
		s3Url: string,
		type: "Image" | "Video",
		pendingId: string,
		targetRoomId?: string,
		recipientId?: number | string,
		senderRole?: string
	) => void;
}

/**
 * Hook quản lý hàng đợi tải lên tệp đa phương tiện ngầm lên S3 (Background S3 Media Uploader).
 * - Hỗ trợ chọn và tải lên nhiều tệp cùng lúc (Multiple files).
 * - Giới hạn dung lượng tối đa 50MB / 1 video (tính trên từng video riêng lẻ, không cộng dồn) và 20MB / 1 ảnh.
 * - Tải ngầm lên S3, theo dõi % tiến độ thực tế, trả về Public URL.
 * - Hỗ trợ cơ chế Auto-send: Nếu người dùng bấm Gửi trước khi upload xong, tệp sẽ tự động được gửi qua SignalR ngay khi S3 hoàn tất.
 */
export function useChatMediaUpload(options?: UseChatMediaUploadOptions) {
	const [pendingMediaList, setPendingMediaList] = useState<ChatPendingMedia[]>([]);
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const handleSelectFiles = useCallback(async (files: FileList | File[]) => {
		const fileArray = Array.from(files);
		if (fileArray.length === 0) return;

		for (const file of fileArray) {
			const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
			const maxSizeBytes = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
			const maxLabel = isVideo ? "50MB cho mỗi video" : "20MB cho mỗi ảnh";

			if (file.size > maxSizeBytes) {
				toast.warning(`Tệp "${file.name}" vượt quá dung lượng tối đa cho phép (${maxLabel}).`);
				continue;
			}

			const type: "Image" | "Video" = isVideo ? "Video" : "Image";
			const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
			const previewUrl = URL.createObjectURL(file);

			const pendingItem: ChatPendingMedia = {
				id,
				file,
				type,
				fileName: file.name,
				fileSize: file.size,
				previewUrl,
				status: "uploading",
				progress: 0,
			};

			setPendingMediaList((prev) => [...prev, pendingItem]);

			// Upload ngầm lên S3 qua storageService
			storageService
				.uploadFile(file, (percent) => {
					setPendingMediaList((prev) =>
						prev.map((m) => (m.id === id ? { ...m, progress: percent } : m))
					);
				})
				.then((s3Url) => {
					setPendingMediaList((prev) => {
						const current = prev.find((m) => m.id === id);
						if (current?.autoSendWhenDone) {
							// Người dùng đã bấm Gửi trước đó -> Tự động gửi ngay qua SignalR
							if (optionsRef.current?.onAutoSendMedia) {
								optionsRef.current.onAutoSendMedia(
									s3Url,
									type,
									id,
									current.targetRoomId,
									current.recipientId,
									current.senderRole
								);
							}
							return prev.filter((m) => m.id !== id);
						}
						return prev.map((m) =>
							m.id === id ? { ...m, status: "done", uploadedUrl: s3Url, progress: 100 } : m
						);
					});
				})
				.catch((err) => {
					console.error("Upload S3 failed:", err);
					toast.error(`Tải lên tệp "${file.name}" thất bại!`);
					setPendingMediaList((prev) =>
						prev.map((m) => (m.id === id ? { ...m, status: "error", error: "Tải lên thất bại" } : m))
					);
				});
		}
	}, []);

	const removePendingMedia = useCallback((id: string) => {
		setPendingMediaList((prev) => {
			const item = prev.find((m) => m.id === id);
			if (item?.previewUrl) {
				URL.revokeObjectURL(item.previewUrl);
			}
			return prev.filter((m) => m.id !== id);
		});
	}, []);

	const clearAllPendingMedia = useCallback(() => {
		setPendingMediaList((prev) => {
			prev.forEach((m) => {
				if (m.previewUrl) URL.revokeObjectURL(m.previewUrl);
			});
			return [];
		});
	}, []);

	const markUploadingAsAutoSend = useCallback(
		(targetRoomId?: string, recipientId?: number | string, senderRole?: string) => {
			const uploadingItems = pendingMediaList.filter((m) => m.status === "uploading");
			if (uploadingItems.length === 0) return [];

			setPendingMediaList((prev) =>
				prev.map((m) =>
					m.status === "uploading"
						? { ...m, autoSendWhenDone: true, targetRoomId, recipientId, senderRole }
						: m
				)
			);
			return uploadingItems;
		},
		[pendingMediaList]
	);

	const pendingMediaListRef = useRef(pendingMediaList);
	pendingMediaListRef.current = pendingMediaList;

	const waitForPendingUploads = useCallback(async (timeoutMs = 30000): Promise<ChatPendingMedia[]> => {
		const start = Date.now();
		while (pendingMediaListRef.current.some((m) => m.status === "uploading")) {
			if (Date.now() - start > timeoutMs) break;
			await new Promise((r) => setTimeout(r, 120));
		}
		return pendingMediaListRef.current;
	}, []);

	const removePendingMediaList = useCallback((ids: string[]) => {
		setPendingMediaList((prev) => {
			const idSet = new Set(ids);
			prev.forEach((m) => {
				if (idSet.has(m.id) && m.previewUrl) {
					URL.revokeObjectURL(m.previewUrl);
				}
			});
			return prev.filter((m) => !idSet.has(m.id));
		});
	}, []);

	const uploadingCount = pendingMediaList.filter((m) => m.status === "uploading").length;
	const readyToSendList = pendingMediaList.filter((m) => m.status === "done" && m.uploadedUrl);

	return {
		pendingMediaList,
		setPendingMediaList,
		handleSelectFiles,
		removePendingMedia,
		removePendingMediaList,
		clearAllPendingMedia,
		markUploadingAsAutoSend,
		uploadingCount,
		readyToSendList,
		waitForPendingUploads,
	};
}

export default useChatMediaUpload;
