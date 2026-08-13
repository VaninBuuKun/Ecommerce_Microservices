import { useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
import { storageService } from "../services/storageService";

interface UploadVideoProps {
	value: string;
	onChange: (url: string) => void;
	className?: string;
}

export default function UploadVideo({
	value,
	onChange,
	className,
}: UploadVideoProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const [preview, setPreview] = useState(value ?? "");
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		setPreview(value ?? "");
	}, [value]);

	const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		if (!file) return;

		setPreview(URL.createObjectURL(file));

		setIsUploading(true);

		try {
			const uploadUrl = await storageService.getUploadUrl(
				file.name,
				file.type,
			);

			await storageService.uploadS3(uploadUrl, file);

			const publicUrl = uploadUrl.split("?")[0];

			onChange(publicUrl);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept="video/*"
				className="hidden"
				onChange={handleSelectFile}
			/>

			<div
				onClick={() => inputRef.current?.click()}
				className={`relative border-2 border-dashed border-brand-border rounded-lg bg-brand-light-soft hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${className ?? ""}`}
			>
				{preview ? (
					<div className="relative w-full h-full">
						<video
							src={preview}
							controls
							className={`w-full h-full object-cover ${
								isUploading ? "opacity-40" : ""
							}`}
							onClick={(e) => {
								e.stopPropagation();
							}}
						/>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setPreview("");
								onChange("");
							}}
							className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 text-[10px] cursor-pointer border-none z-10"
						>
							Xóa
						</button>
					</div>
				) : (
					<div className="flex flex-col items-center gap-1 text-brand-muted">
						<Video className="w-6 h-6 text-brand-primary" />
						<span className="text-[10px] font-medium">
							Tải video lên
						</span>
					</div>
				)}

				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/10">
						<Loader2 className="w-8 h-8 animate-spin" />
					</div>
				)}
			</div>
		</>
	);
}
