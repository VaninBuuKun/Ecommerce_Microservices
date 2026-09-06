import React from "react";
import { SyncOutlined, CheckOutlined, CloseOutlined, CloudUploadOutlined, VideoCameraOutlined, FileImageOutlined } from "@ant-design/icons";
import type { ChatPendingMedia } from "@/domains/notification";

interface ChatUploadingWidgetProps {
	pendingMediaList: ChatPendingMedia[];
	onRemoveMedia: (id: string) => void;
}

export function ChatUploadingWidget({
	pendingMediaList,
	onRemoveMedia,
}: ChatUploadingWidgetProps) {
	if (!pendingMediaList || pendingMediaList.length === 0) return null;

	const uploadingList = pendingMediaList.filter((m) => m.status === "uploading");
	const uploadingCount = uploadingList.length;

	return (
		<div className="mb-2 flex items-center gap-2 p-1.5 bg-brand-light-soft/60 rounded-md border border-brand-border overflow-x-auto max-w-full hide-scrollbar">
			{/* Khối vuông thể hiện tiến trình tải lên kèm Hover Popover danh sách video/ảnh chờ upload */}
			{uploadingCount > 0 && (
				<div className="relative group shrink-0">
					<div
						className="w-14 h-14 rounded-md border border-brand-primary/60 bg-brand-primary/10 hover:bg-brand-primary/20 flex flex-col items-center justify-center relative cursor-pointer shadow-2xs transition-colors"
						title="Di chuột để xem danh sách tài nguyên đang tải lên"
					>
						<SyncOutlined spin className="text-brand-primary text-base" />
						<span className="text-[8px] font-black text-brand-dark uppercase tracking-tight mt-0.5">
							Tải lên
						</span>
						<span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
							{uploadingCount}
						</span>
					</div>

					{/* Hover Tooltip/Popover hiển thị chi tiết danh sách tài nguyên đang tải lên */}
					<div className="absolute bottom-16 left-0 z-50 w-72 bg-white rounded-md border border-brand-border shadow-2xl p-2.5 space-y-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 select-none">
						<div className="flex items-center justify-between pb-1.5 border-b border-brand-border/60">
							<span className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
								<CloudUploadOutlined className="text-brand-primary" />
								Đang tải lên ({uploadingCount})
							</span>
							<span className="text-[10px] text-brand-muted font-medium">Tối đa 50MB/video</span>
						</div>

						<div className="max-h-48 overflow-y-auto space-y-2 pr-0.5">
							{uploadingList.map((item) => (
								<div key={item.id} className="space-y-1 bg-slate-50 p-1.5 rounded-md border border-brand-border/40">
									<div className="flex items-center gap-1.5 min-w-0">
										{item.type === "Video" ? (
											<VideoCameraOutlined className="text-xs text-brand-primary shrink-0" />
										) : (
											<FileImageOutlined className="text-xs text-blue-500 shrink-0" />
										)}
										<span className="text-xs font-bold text-brand-dark truncate flex-1">
											{item.fileName}
										</span>
										<span className="text-[10px] text-brand-muted font-medium shrink-0">
											{(item.fileSize / (1024 * 1024)).toFixed(1)} MB
										</span>
									</div>

									{/* Progress bar */}
									<div className="flex items-center gap-2">
										<div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
											<div
												className="bg-brand-primary h-full transition-all duration-150"
												style={{ width: `${item.progress}%` }}
											/>
										</div>
										<span className="text-[9px] font-bold text-brand-muted shrink-0 w-6 text-right">
											{item.progress}%
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Dải thumbnail xem trước từng tệp trong hàng đợi */}
			{pendingMediaList.map((item) => {
				const isUploading = item.status === "uploading";
				const isDone = item.status === "done";
				const isError = item.status === "error";

				return (
					<div
						key={item.id}
						className="w-14 h-14 rounded-md border border-brand-border relative overflow-hidden bg-slate-100 shrink-0 shadow-2xs group"
						title={item.fileName}
					>
						{item.type === "Video" ? (
							<video src={item.previewUrl} className="w-full h-full object-cover" />
						) : (
							<img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
						)}

						{/* Overlay khi đang tải lên */}
						{isUploading && (
							<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-0.5">
								<SyncOutlined spin className="text-xs" />
								<span className="text-[9px] font-black mt-0.5">{item.progress}%</span>
							</div>
						)}

						{/* Badge hoàn tất tải lên S3 */}
						{isDone && (
							<span className="absolute bottom-0.5 left-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs flex items-center justify-center">
								<CheckOutlined className="text-[7px]" />
							</span>
						)}

						{/* Badge lỗi nếu có */}
						{isError && (
							<span className="absolute bottom-0.5 left-0.5 bg-red-500 text-white rounded-md px-1 py-0.5 text-[8px] font-bold shadow-2xs">
								Lỗi
							</span>
						)}

						{/* Nút xóa/hủy tệp */}
						<button
							type="button"
							onClick={() => onRemoveMedia(item.id)}
							className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/65 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer border-none flex items-center justify-center shadow-xs"
							title="Hủy bỏ"
						>
							<CloseOutlined className="text-[8px]" />
						</button>
					</div>
				);
			})}
		</div>
	);
}

export default ChatUploadingWidget;
