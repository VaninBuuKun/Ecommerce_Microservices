import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { UploadImage, UploadVideo } from "../../../shared";
import { useCategoriesQuery } from "../../catalog/hooks/useCategoriesQuery";

const basicInfoSchema = z.object({
	name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự").max(200, "Tên sản phẩm tối đa 200 ký tự"),
	description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
});

type BasicInfoErrors = Partial<Record<"name" | "description", string>>;

interface ProductBasicInfoProps {
	name: string;
	setName: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	coverImage: string;
	setCoverImage: (val: string) => void;
	imageUrls: string[];
	setImageUrls: (val: string[]) => void;
	videoUrl: string;
	setVideoUrl: (val: string) => void;
	categoryId: string;
	setCategoryId: (val: string) => void;
}

export const ProductBasicInfoSection: React.FC<ProductBasicInfoProps> = ({
	name,
	setName,
	description,
	setDescription,
	coverImage,
	setCoverImage,
	imageUrls,
	setImageUrls,
	videoUrl,
	setVideoUrl,
	categoryId,
	setCategoryId,
}) => {
	const [errors, setErrors] = useState<BasicInfoErrors>({});

	const validate = (field: "name" | "description", value: string) => {
		const result = basicInfoSchema.safeParse({ name: field === "name" ? value : name, description: field === "description" ? value : description });
		if (!result.success) {
			const fieldErr = result.error.errors.find(e => e.path[0] === field);
			setErrors(prev => ({ ...prev, [field]: fieldErr?.message }));
		} else {
			setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
		}
	};

	// Fetch danh sách danh mục
	const { data: categories = [], isLoading: isLoadingCates } = useCategoriesQuery();

	// Lọc chỉ lấy những danh mục cha CÓ chứa subCategories (độ dài > 0)
	const validCategories = useMemo(() => {
		return categories.filter(
			(c: any) => Array.isArray(c.subCategories) && c.subCategories.length > 0
		);
	}, [categories]);

	// Dropdown states
	const [isOpen, setIsOpen] = useState(false);
	const [activeParentId, setActiveParentId] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Set danh mục cha active mặc định
	useEffect(() => {
		if (validCategories.length > 0) {
			if (categoryId) {
				const parent = validCategories.find((c: any) =>
					c.subCategories?.some((s: any) => s.id === categoryId)
				);
				if (parent) {
					setActiveParentId(parent.id);
					return;
				}
			}
			if (!activeParentId || !validCategories.some((c: any) => c.id === activeParentId)) {
				setActiveParentId(validCategories[0]?.id || null);
			}
		}
	}, [categoryId, validCategories, activeParentId]);

	// Lấy chuỗi hiển thị danh mục (VD: Thời trang > Áo sơ mi)
	const getCategoryDisplayPath = () => {
		if (!categoryId || validCategories.length === 0) return "Chọn Danh mục";
		for (const parent of validCategories) {
			const sub = parent.subCategories?.find((s: any) => s.id === categoryId);
			if (sub) {
				return `${parent.name} > ${sub.name}`;
			}
		}
		return "Chọn Danh mục";
	};

	const activeParent = validCategories.find((c: any) => c.id === activeParentId);
	const activeSubCategories = activeParent?.subCategories || [];

	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left">
			<h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
				Thông tin cơ bản
			</h3>

			<div className="space-y-5">
				{/* Row 1: Cover Image */}
				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Ảnh bìa sản phẩm <span className="text-red-500 font-bold">*</span>
					</label>
					<UploadImage
						value={coverImage}
						onChange={setCoverImage}
						className="w-28 h-28 rounded-lg"
					/>
				</div>

				{/* Row 2: Image List (max 6) */}
				<div className="space-y-1.5">
					<label className="block text-xs font-bold text-brand-dark">
						Hình ảnh sản phẩm (Tối đa 6 ảnh) <span className="text-red-500 font-bold">*</span>
					</label>
					<div className="flex flex-wrap gap-2.5 items-center">
						{imageUrls.map((url, imgIdx) => (
							<div key={imgIdx} className="relative w-20 h-20 border border-brand-border rounded-lg overflow-hidden group">
								<img src={url} alt={`Product ${imgIdx + 1}`} className="w-full h-full object-cover" />
								<button
									type="button"
									onClick={() => {
										const newUrls = imageUrls.filter((_, idx) => idx !== imgIdx);
										setImageUrls(newUrls);
									}}
									className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer border-none"
								>
									Xóa
								</button>
							</div>
						))}
						{imageUrls.length < 6 && (
							<UploadImage
								value=""
								onChange={(url) => {
									if (url) setImageUrls([...imageUrls, url]);
								}}
								className="w-20 h-20 rounded-lg"
							/>
						)}
					</div>
				</div>

				{/* Row 3: Product Video */}
				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Video sản phẩm
					</label>
					<UploadVideo
						value={videoUrl}
						onChange={setVideoUrl}
						className="w-44 h-28 rounded-lg"
					/>
				</div>

				{/* Row 4: Category Dropdown */}
				<div className="relative" ref={dropdownRef}>
					<label className="block text-xs font-bold text-brand-dark mb-1">
						Danh mục <span className="text-red-500 font-bold">*</span>
					</label>
					<div
						onClick={() => setIsOpen(!isOpen)}
						className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs flex justify-between items-center bg-white cursor-pointer select-none"
					>
						<span className="font-semibold text-brand-dark">
							{getCategoryDisplayPath()}
						</span>
						<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
					</div>

					{isOpen && (
						<div className="absolute left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-lg z-50 flex h-60 overflow-hidden">
							{isLoadingCates ? (
								<div className="flex items-center justify-center w-full py-6 text-brand-muted text-xs gap-1.5 bg-white">
									<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
									Đang tải danh mục...
								</div>
							) : validCategories.length === 0 ? (
								<div className="p-3 text-center text-brand-muted text-xs w-full bg-white">
									Không có danh mục nào hợp lệ.
								</div>
							) : (
								<>
									{/* Column 1: Parent Categories (Chỉ hiển thị các mục có subCategories) */}
									<div className="w-1/2 border-r border-brand-border/60 overflow-y-auto p-1.5 space-y-0.5 bg-gray-50/50">
										{validCategories.map((parent: any) => {
											const isActive = activeParentId === parent.id;

											return (
												<div
													key={parent.id}
													onMouseEnter={() => setActiveParentId(parent.id)}
													onClick={() => setActiveParentId(parent.id)}
													className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${isActive
															? "bg-brand-primary/10 text-brand-primary-deep font-bold"
															: "hover:bg-brand-light-soft text-brand-dark font-semibold"
														}`}
												>
													<span>{parent.name}</span>
													<ChevronRight className="w-3 h-3 text-brand-muted" />
												</div>
											);
										})}
									</div>

									{/* Column 2: Sub Categories */}
									<div className="w-1/2 overflow-y-auto p-1.5 space-y-0.5 bg-white">
										{activeSubCategories.map((sub: any) => {
											const isSelected = categoryId === sub.id;

											return (
												<div
													key={sub.id}
													onClick={() => {
														setCategoryId(sub.id);
														setIsOpen(false);
													}}
													className={`px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${isSelected
															? "bg-brand-primary/15 text-brand-primary-deep font-bold"
															: "hover:bg-brand-light-soft text-brand-muted font-medium"
														}`}
												>
													{sub.name}
												</div>
											);
										})}
									</div>
								</>
							)}
						</div>
					)}
				</div>

				{/* Separator before text inputs */}
				<div className="border-t border-brand-border/60 pt-4 space-y-4">
					{/* Product Name */}
					<div>
						<label className="block text-xs font-bold text-brand-dark mb-1">
							Tên sản phẩm <span className="text-red-500 font-bold">*</span>
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								validate("name", e.target.value);
							}}
							placeholder="Nhập tên sản phẩm..."
							className={`w-full h-8 px-3 border rounded-lg text-xs focus:outline-none focus:border-brand-primary ${
								errors.name ? "border-red-400 bg-red-50" : "border-brand-border"
							}`}
						/>
						{errors.name && (
							<p className="flex items-center gap-1 text-red-500 text-[10px] mt-1">
								<AlertCircle className="w-3 h-3" />{errors.name}
							</p>
						)}
					</div>

					{/* Product Description */}
					<div>
						<label className="block text-xs font-bold text-brand-dark mb-1">
							Mô tả sản phẩm <span className="text-red-500 font-bold">*</span>
						</label>
						<textarea
							rows={5}
							value={description}
							onChange={(e) => {
								setDescription(e.target.value);
								validate("description", e.target.value);
							}}
							placeholder="Mô tả đặc điểm nổi bật, chất liệu, hướng dẫn sử dụng sản phẩm..."
							className={`w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:border-brand-primary ${
								errors.description ? "border-red-400 bg-red-50" : "border-brand-border"
							}`}
						/>
						{errors.description && (
							<p className="flex items-center gap-1 text-red-500 text-[10px] mt-1">
								<AlertCircle className="w-3 h-3" />{errors.description}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};