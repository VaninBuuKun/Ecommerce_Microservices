import { useEffect, useRef, useState } from "react";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { storageService } from "../services/storageService";

interface UploadSmallImageProps {
	value: string;
	onChange: (url: string) => void;
	className?: string;
}

export default function UploadSmallImage({
	value,
	onChange,
	className,
}: UploadSmallImageProps) {
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
			const uploadUrl = await storageService.getUploadUrl(file.name, file.type);
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
				accept="image/*"
				className="hidden"
				onChange={handleSelectFile}
			/>

			<div
				onClick={(e) => {
					e.stopPropagation();
					inputRef.current?.click();
				}}
				className={`relative w-8 h-8 border border-dashed border-emerald-500/50 hover:border-emerald-500 rounded bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0 ${className ?? ""}`}
				title="Tải ảnh phân loại"
			>
				{preview ? (
					<img
						src={preview}
						alt="Preview"
						className={`w-full h-full object-cover ${isUploading ? "opacity-45" : ""}`}
					/>
				) : (
					<ImageIcon className="w-3.5 h-3.5 text-emerald-600 hover:text-emerald-700 transition-colors" />
				)}

				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-white/70">
						<Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
					</div>
				)}
			</div>
		</>
	);
}
