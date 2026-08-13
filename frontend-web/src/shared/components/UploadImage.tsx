import { useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { storageService } from "../services/storageService";

interface UploadImageProps {
	value: string;
	onChange: (url: string) => void;
	className?: string; // Khai báo nhận prop className
}

export default function UploadImage({
	value,
	onChange,
	className,
}: UploadImageProps) {
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
			if (!value) {
				setPreview("");
			}
		} finally {
			setIsUploading(false);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
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
				onClick={() => inputRef.current?.click()}
				// Sửa lại thành dấu backtick (`) ở đầu để biến template string hoạt động
				className={`relative aspect-square border-2 border-dashed border-brand-border rounded-lg bg-brand-light-soft hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${className ?? ""}`}
			>
				{preview ? (
					<img
						src={preview}
						alt="Preview"
						className={`w-full h-full object-cover ${
							isUploading ? "opacity-40" : ""
						}`}
					/>
				) : (
					<div className="flex flex-col items-center gap-1 text-brand-muted">
						<Plus className="w-6 h-6" />
						<span className="text-[10px] font-medium">
							Tải ảnh lên
						</span>
					</div>
				)}

				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center">
						<Loader2 className="w-8 h-8 animate-spin" />
					</div>
				)}
			</div>
		</>
	);
}
