import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { UploadImage } from "@/shared";
import { useCreateProductMutation } from "@/domains/catalog";

interface CreateProductModalProps {
	open: boolean;
	onClose: () => void;
	shopId: number;
}

export function CreateProductModal({ open, onClose, shopId }: CreateProductModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [thumbnailUrl, setThumbnailUrl] = useState("");

	const createProductMutation = useCreateProductMutation();

	if (!open) return null;

	const handleCreate = async () => {
		if (!name.trim()) {
			toast.error("Vui lòng nhập tên sản phẩm.");
			return;
		}

		try {
			await createProductMutation.mutateAsync({
				shopId,
				name: name.trim(),
				description: description.trim(),
				thumbnailUrl: thumbnailUrl || undefined,
			});

			toast.success("Tạo sản phẩm mới thành công!");
			setName("");
			setDescription("");
			setThumbnailUrl("");
			onClose();
		} catch (err: any) {
			toast.error(`Tạo sản phẩm thất bại: ${err?.message || "Lỗi hệ thống"}`);
		}
	};

	const isPending = createProductMutation.isPending;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center font-sans text-xs">
			<div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

			<div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl border border-brand-border overflow-hidden">
				<div className="flex items-center justify-between border-b border-brand-border p-4 bg-brand-light-soft">
					<h2 className="font-bold text-brand-dark text-sm">Thêm sản phẩm mới</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-brand-dark cursor-pointer">
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="space-y-4 p-4 text-left">
					<div>
						<label className="block font-bold text-brand-dark mb-1">Tên sản phẩm</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Nhập tên sản phẩm..."
							className="w-full h-8 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
						/>
					</div>

					<div>
						<label className="block font-bold text-brand-dark mb-1">Mô tả ngắn</label>
						<textarea
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Nhập mô tả sản phẩm..."
							className="w-full p-2 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary text-xs"
						/>
					</div>

					<div>
						<label className="block font-bold text-brand-dark mb-1">Ảnh bìa (Logo)</label>
						<UploadImage
							value={thumbnailUrl}
							onChange={setThumbnailUrl}
							className="w-24 h-24 rounded-lg"
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-brand-border p-4 bg-brand-light-soft">
					<button
						onClick={onClose}
						disabled={isPending}
						className="px-3 py-1.5 border border-brand-border rounded-lg hover:bg-gray-50 cursor-pointer font-semibold"
					>
						Hủy
					</button>

					<button
						onClick={handleCreate}
						disabled={isPending}
						className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-65"
					>
						{isPending && <Loader2 className="w-3 h-3 animate-spin" />}
						Tạo mới
					</button>
				</div>
			</div>
		</div>
	);
}
export default CreateProductModal;
