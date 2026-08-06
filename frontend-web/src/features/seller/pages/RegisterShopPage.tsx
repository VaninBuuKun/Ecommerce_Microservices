import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store } from "lucide-react";
import { z } from "zod";
import { UploadImage } from "../../../shared"; // Đường dẫn tới component UploadImage của bạn
import { useSellerStore } from "../stores"; // Giả định store chứa hàm tạo shop
import { useCreateShopMutation } from "../hooks";

// 1. Khởi tạo schema Zod validate form tạo gian hàng
const registerShopSchema = z.object({
	shopName: z.string().min(1, "Vui lòng nhập tên gian hàng!"),
	description: z.string().optional(),
	avatarUrl: z.string().min(1, "Vui lòng tải lên ảnh đại diện gian hàng!"),
});

export default function RegisterSellerPage() {
	const navigate = useNavigate();
	const { activeShop } = useSellerStore();
	const createShopMutation = useCreateShopMutation();

	const [shopName, setShopName] = useState("");
	const [description, setDescription] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// 2. Validate bằng Zod
		const result = registerShopSchema.safeParse({
			shopName,
			description,
			avatarUrl,
		});

		if (!result.success) {
			// Lấy lỗi đầu tiên để hiển thị alert (hoặc dùng form error state)
			const errorMessage = result.error.errors[0].message;
			alert(errorMessage);
			return;
		}

		setIsSubmitting(true);
		try {
			const createdShop = await createShopMutation.mutateAsync({
				name: result.data.shopName,
				description: result.data.description ?? "",
				logoUrl: result.data.avatarUrl,
			});
			alert("Tạo gian hàng thành công!");
			navigate(
				createdShop?.id
					? `/seller/${createdShop.id}/dashboard`
					: activeShop?.id
						? `/seller/${activeShop.id}/dashboard`
						: "/seller/dashboard",
			);
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi tạo gian hàng.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-brand-light-soft flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
			<div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-sm border border-brand-border p-6 sm:p-8">
				{/* Header Title */}
				<div className="border-b border-brand-border pb-4 mb-6">
					<h1 className="text-xl font-bold text-brand-dark flex items-center gap-2">
						<Store className="w-5 h-5 text-brand-primary-deep" />
						Thông tin gian hàng
					</h1>
					<p className="text-xs text-brand-muted mt-1">
						Nhập các thông tin cần thiết để bắt đầu khởi tạo gian
						hàng của bạn.
					</p>
				</div>

				{/* Form Body */}
				<form onSubmit={handleSubmit} className="space-y-5">
					{/* 1. Tên gian hàng */}
					<div>
						<label className="block text-xs font-semibold text-brand-dark mb-1.5">
							Tên gian hàng{" "}
							<span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={shopName}
							onChange={(e) => setShopName(e.target.value)}
							placeholder="Nhập tên gian hàng của bạn"
							className="w-full px-3 py-2 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
						/>
					</div>

					{/* 2. Mô tả gian hàng */}
					<div>
						<label className="block text-xs font-semibold text-brand-dark mb-1.5">
							Mô tả gian hàng
						</label>
						<textarea
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Mô tả ngắn gọn về gian hàng và sản phẩm của bạn..."
							className="w-full px-3 py-2 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary resize-none text-brand-dark"
						/>
					</div>

					{/* 3. Ảnh đại diện gian hàng (Sử dụng UploadImage có sẵn) */}
					<div>
						<label className="block text-xs font-semibold text-brand-dark mb-2">
							Ảnh đại diện gian hàng{" "}
							<span className="text-red-500">*</span>
						</label>

						{/* Truyền thêm className (nếu component UploadImage của bạn nhận prop className để style khung/bo tròn) */}
						<UploadImage
							value={avatarUrl}
							onChange={setAvatarUrl}
							className="w-30 h-30 rounded-full"
						/>
					</div>

					{/* Action Buttons */}
					<div className="pt-5 border-t border-brand-border flex items-center justify-between">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft flex items-center gap-1.5 cursor-pointer transition-colors"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Quay lại
						</button>

						<button
							type="submit"
							disabled={isSubmitting}
							className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
						>
							<Store className="w-4 h-4" />
							{isSubmitting ? "Đang xử lý..." : "Tạo gian hàng"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
