import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, AlertCircle, Plus, Trash2, GripVertical } from "lucide-react";
import { z } from "zod";
import { UploadImage, UploadVideo } from "@/shared";
import { useCategoriesQuery } from "@/domains/catalog";

const basicInfoSchema = z.object({
	name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự").max(200, "Tên sản phẩm tối đa 200 ký tự"),
	description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
});

type BasicInfoErrors = Partial<Record<"name" | "description", string>>;

export interface AttributeItem {
	key: string;
	value: string;
}

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
	categoryId: number | null;
	setCategoryId: (val: number | null) => void;
	attributes: AttributeItem[];
	setAttributes: React.Dispatch<React.SetStateAction<AttributeItem[]>>;
	attributeErrors?: Record<number, { key?: boolean; value?: boolean }>;
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
	attributes,
	setAttributes,
	attributeErrors = {},
}) => {
	const [errors, setErrors] = useState<BasicInfoErrors>({});

	// Drag and drop state for attribute rows
	const [draggedAttrIdx, setDraggedAttrIdx] = useState<number | null>(null);
	const [dragOverAttrIdx, setDragOverAttrIdx] = useState<number | null>(null);

	const handleMoveAttribute = (fromIdx: number, toIdx: number) => {
		if (
			fromIdx === toIdx ||
			fromIdx < 0 ||
			toIdx < 0 ||
			fromIdx >= attributes.length ||
			toIdx >= attributes.length
		)
			return;
		const updated = [...attributes];
		const [moved] = updated.splice(fromIdx, 1);
		updated.splice(toIdx, 0, moved);
		setAttributes(updated);
	};

	const validate = (field: "name" | "description", value: string) => {
		const result = basicInfoSchema.safeParse({
			name: field === "name" ? value : name,
			description: field === "description" ? value : description,
		});
		if (!result.success) {
			const fieldErr = result.error.errors.find((e) => e.path[0] === field);
			setErrors((prev) => ({ ...prev, [field]: fieldErr?.message }));
		} else {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[field];
				return next;
			});
		}
	};

	const { data: categories = [], isLoading: isLoadingCates } = useCategoriesQuery();

	const validCategories = useMemo(() => {
		return categories;
	}, [categories]);

	const [isOpen, setIsOpen] = useState(false);
	const [activeParentId, setActiveParentId] = useState<number | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (validCategories.length > 0) {
			if (categoryId) {
				const numCateId = Number(categoryId);
				const parent = validCategories.find((c: any) =>
					c.subCategories?.some((s: any) => Number(s.id) === numCateId),
				);
				if (parent) {
					setActiveParentId(parent.id);
					return;
				}
			}
			setActiveParentId((prev) => {
				if (prev && validCategories.some((c: any) => c.id === prev)) {
					return prev;
				}
				return validCategories[0]?.id || null;
			});
		}
	}, [categoryId, validCategories]);

	const getCategoryDisplayPath = () => {
		if (!categoryId || validCategories.length === 0) return "Chọn Danh mục con";
		const numCateId = Number(categoryId);
		for (const parent of validCategories) {
			const sub = parent.subCategories?.find((s: any) => Number(s.id) === numCateId);
			if (sub) {
				return `${parent.name} > ${sub.name}`;
			}
		}
		return "Chọn Danh mục con";
	};

	const activeParent = validCategories.find((c: any) => c.id === activeParentId);
	const activeSubCategories = activeParent?.subCategories || [];

	return (
		<div className="bg-white border border-brand-border rounded-md p-5 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left">
			<h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
				Thông tin cơ bản
			</h3>

			<div className="space-y-5">
				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Ảnh bìa sản phẩm <span className="text-red-500 font-bold">*</span>
					</label>
					<UploadImage
						value={coverImage}
						onChange={setCoverImage}
						className="w-28 h-28 rounded-md"
					/>
				</div>

				<div className="space-y-1.5">
					<label className="block text-xs font-bold text-brand-dark">
						Hình ảnh sản phẩm (Tối đa 6 ảnh) <span className="text-red-500 font-bold">*</span>
					</label>
					<div className="flex flex-wrap gap-2.5 items-center">
						{imageUrls.map((url, imgIdx) => (
							<div
								key={imgIdx}
								className="relative w-20 h-20 border border-brand-border rounded-md overflow-hidden group"
							>
								<img
									src={url}
									alt={`Product ${imgIdx + 1}`}
									className="w-full h-full object-cover"
								/>
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
								className="w-20 h-20 rounded-md"
							/>
						)}
					</div>
				</div>

				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Video sản phẩm
					</label>
					<UploadVideo
						value={videoUrl}
						onChange={setVideoUrl}
						className="w-44 h-28 rounded-md"
					/>
				</div>

				<div className="relative" ref={dropdownRef}>
					<label className="block text-xs font-bold text-brand-dark mb-1">
						Danh mục con (SubCategory) <span className="text-red-500 font-bold">*</span>
					</label>
					<div
						onClick={() => setIsOpen(!isOpen)}
						className="w-full h-8 px-3 border border-brand-border rounded-md text-xs flex justify-between items-center bg-white cursor-pointer select-none"
					>
						<span
							className={`font-semibold ${
								categoryId ? "text-brand-dark" : "text-brand-muted"
							}`}
						>
							{getCategoryDisplayPath()}
						</span>
						<ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
					</div>

					{isOpen && (
						<div className="absolute left-0 right-0 mt-1 bg-white border border-brand-border rounded-md shadow-lg z-50 flex h-60 overflow-hidden">
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
									<div className="w-1/2 border-r border-brand-border/60 overflow-y-auto p-1.5 space-y-0.5 bg-gray-50/50">
										{validCategories.map((parent: any) => {
											const isActive = activeParentId === parent.id;
											const hasSubs =
												Array.isArray(parent.subCategories) &&
												parent.subCategories.length > 0;

											return (
												<div
													key={parent.id}
													onClick={() => setActiveParentId(parent.id)}
													className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer text-xs transition-colors ${
														isActive
															? "bg-brand-primary/10 text-brand-primary-deep font-bold"
															: "hover:bg-brand-light-soft text-brand-dark font-semibold"
													}`}
												>
													<span>{parent.name}</span>
													{hasSubs && (
														<ChevronRight className="w-3 h-3 text-brand-muted" />
													)}
												</div>
											);
										})}
									</div>

									<div className="w-1/2 overflow-y-auto p-1.5 space-y-0.5 bg-white">
										{activeSubCategories.length === 0 ? (
											<div className="p-3 text-center text-brand-muted text-[11px] italic">
												(Không có danh mục con)
											</div>
										) : (
											activeSubCategories.map((sub: any) => {
												const isSelected = categoryId === sub.id;

												return (
													<div
														key={sub.id}
														onClick={() => {
															setCategoryId(sub.id);
															setIsOpen(false);
														}}
														className={`px-2.5 py-2 rounded-md cursor-pointer text-xs transition-colors ${
															isSelected
																? "bg-brand-primary/20 text-brand-primary-deep font-bold"
																: "hover:bg-brand-light-soft text-brand-dark font-medium"
														}`}
													>
														{sub.name}
													</div>
												);
											})
										)}
									</div>
								</>
							)}
						</div>
					)}
				</div>

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
						placeholder="Nhập tên sản phẩm (Ví dụ: Áo thun nam phong cách Streetwear)"
						className={`w-full h-8 px-3 border rounded-md text-xs bg-white focus:outline-none text-brand-dark font-sans ${
							errors.name
								? "border-red-500 focus:border-red-500"
								: "border-brand-border focus:border-brand-primary"
						}`}
					/>
					{errors.name && (
						<p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
							<AlertCircle className="w-3 h-3 shrink-0" />
							{errors.name}
						</p>
					)}
				</div>

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
						placeholder="Nhập thông tin chi tiết sản phẩm, chất liệu, hướng dẫn sử dụng, bảo quản..."
						className={`w-full p-3 border rounded-md text-xs bg-white focus:outline-none text-brand-dark font-sans resize-y ${
							errors.description
								? "border-red-500 focus:border-red-500"
								: "border-brand-border focus:border-brand-primary"
						}`}
					/>
					{errors.description && (
						<p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
							<AlertCircle className="w-3 h-3 shrink-0" />
							{errors.description}
						</p>
					)}
				</div>

				{/* Specification Attributes Section */}
				<div className="pt-4 border-t border-brand-border/60 space-y-3">
					<div>
						<label className="block text-xs font-bold text-brand-dark">
							Thông số & Thuộc tính sản phẩm
						</label>
						<p className="text-[11px] text-brand-muted font-medium">
							Ví dụ: Xuất xứ - Việt Nam, Chất liệu - Cotton 100%, Thương hiệu - Local Brand
						</p>
					</div>

					{attributes.length === 0 ? (
						<div className="p-3 text-center text-brand-muted text-xs bg-gray-50 border border-brand-border/60 rounded-md italic">
							Chưa thêm thuộc tính nào cho sản phẩm.
						</div>
					) : (
						<div className="space-y-2">
							{attributes.map((attr, idx) => {
								const hasKeyErr = Boolean(attributeErrors[idx]?.key);
								const hasValErr = Boolean(attributeErrors[idx]?.value);
								const isDragging = draggedAttrIdx === idx;
								const isOver = dragOverAttrIdx === idx;

								return (
									<div
										key={idx}
										draggable
										onDragStart={(e) => {
											setDraggedAttrIdx(idx);
											e.dataTransfer.setData("text/plain", String(idx));
											e.dataTransfer.effectAllowed = "move";
										}}
										onDragOver={(e) => {
											e.preventDefault();
											e.dataTransfer.dropEffect = "move";
											if (dragOverAttrIdx !== idx) {
												setDragOverAttrIdx(idx);
											}
										}}
										onDragLeave={() => {
											if (dragOverAttrIdx === idx) {
												setDragOverAttrIdx(null);
											}
										}}
										onDrop={(e) => {
											e.preventDefault();
											setDragOverAttrIdx(null);
											if (draggedAttrIdx !== null && draggedAttrIdx !== idx) {
												handleMoveAttribute(draggedAttrIdx, idx);
											}
											setDraggedAttrIdx(null);
										}}
										onDragEnd={() => {
											setDraggedAttrIdx(null);
											setDragOverAttrIdx(null);
										}}
										className={`space-y-1 p-1 rounded-md transition-all border ${
											isOver
												? "border-brand-primary bg-brand-primary/10 shadow-xs"
												: isDragging
												? "opacity-40 border-dashed border-gray-400"
												: "border-transparent"
										}`}
									>
										<div className="flex items-center gap-2">
											{/* Drag Handle */}
											<div
												className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-brand-dark p-1 shrink-0 select-none"
												title="Kéo thả để sắp xếp thứ tự thuộc tính"
											>
												<GripVertical className="w-4 h-4" />
											</div>

											<input
												type="text"
												value={attr.key}
												onChange={(e) => {
													const updated = [...attributes];
													updated[idx].key = e.target.value;
													setAttributes(updated);
												}}
												placeholder="Tên thuộc tính (VD: Chất liệu)"
												className={`w-1/3 h-8 px-3 border rounded-md text-xs font-sans text-brand-dark focus:outline-none ${
													hasKeyErr
														? "border-red-500 focus:border-red-500 bg-red-50/20"
														: "border-brand-border focus:border-brand-primary bg-white"
												}`}
											/>
											<input
												type="text"
												value={attr.value}
												onChange={(e) => {
													const updated = [...attributes];
													updated[idx].value = e.target.value;
													setAttributes(updated);
												}}
												placeholder="Giá trị (VD: 100% Cotton)"
												className={`flex-1 h-8 px-3 border rounded-md text-xs font-sans text-brand-dark focus:outline-none ${
													hasValErr
														? "border-red-500 focus:border-red-500 bg-red-50/20"
														: "border-brand-border focus:border-brand-primary bg-white"
												}`}
											/>
											<button
												type="button"
												onClick={() => {
													const updated = attributes.filter((_, i) => i !== idx);
													setAttributes(updated);
												}}
												className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-none shrink-0"
												title="Xóa thuộc tính"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>

										{(hasKeyErr || hasValErr) && (
											<p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold pl-7">
												<AlertCircle className="w-3 h-3 shrink-0" />
												{hasKeyErr && hasValErr
													? "Vui lòng nhập đầy đủ tên và giá trị thuộc tính (hoặc xóa dòng thừa)."
													: hasKeyErr
													? "Vui lòng nhập tên thuộc tính."
													: "Vui lòng nhập giá trị thuộc tính."}
											</p>
										)}
									</div>
								);
							})}
						</div>
					)}

					{/* Add Attribute Button Positioned At The Bottom Beneath List */}
					<button
						type="button"
						onClick={() => setAttributes([...attributes, { key: "", value: "" }])}
						className="w-full h-8 border border-dashed border-brand-border hover:border-brand-primary hover:text-brand-primary-deep rounded-md flex items-center justify-center gap-1.5 text-xs text-brand-muted cursor-pointer transition-colors bg-white font-semibold shadow-2xs mt-2"
					>
						<Plus className="w-3.5 h-3.5" />
						Thêm thuộc tính mới
					</button>
				</div>
			</div>
		</div>
	);
};
