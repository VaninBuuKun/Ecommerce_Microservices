import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, AlertCircle, Plus, Trash2, GripVertical, Eye, Upload } from "lucide-react";
import { VideoCameraOutlined } from "@ant-design/icons";
import { z } from "zod";
import { useCategoriesQuery, ProductImageModal, type ProductModalImageItem } from "@/domains/catalog";
import { storageService } from "@/shared/services/storageService";

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

	// Drag and drop & review state for gallery images
	const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
	const [dragOverImgIdx, setDragOverImgIdx] = useState<number | null>(null);
	const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

	const [isUploadingCover, setIsUploadingCover] = useState(false);
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);
	const [isUploadingGallery, setIsUploadingGallery] = useState(false);

	const coverInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);
	const galleryInputRef = useRef<HTMLInputElement>(null);

	const handleMoveImage = (fromIdx: number, toIdx: number) => {
		if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= imageUrls.length || toIdx >= imageUrls.length) return;
		const updated = [...imageUrls];
		const [moved] = updated.splice(fromIdx, 1);
		updated.splice(toIdx, 0, moved);
		setImageUrls(updated);
	};

	const modalImages = useMemo(() => {
		const list: ProductModalImageItem[] = [];
		if (coverImage) {
			list.push({ url: coverImage, label: "Ảnh bìa", isThumbnail: true });
		}
		imageUrls.forEach((url, i) => {
			list.push({ url, label: `Ảnh chi tiết ${i + 1}` });
		});
		return list;
	}, [coverImage, imageUrls]);

	const handleSelectCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploadingCover(true);
		try {
			const uploadUrl = await storageService.getUploadUrl(file.name, file.type);
			await storageService.uploadS3(uploadUrl, file);
			const publicUrl = uploadUrl.split("?")[0];
			setCoverImage(publicUrl);
		} catch (err) {
			console.error("Lỗi khi tải ảnh bìa:", err);
		} finally {
			setIsUploadingCover(false);
			if (coverInputRef.current) coverInputRef.current.value = "";
		}
	};

	const handleSelectVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploadingVideo(true);
		try {
			const uploadUrl = await storageService.getUploadUrl(file.name, file.type);
			await storageService.uploadS3(uploadUrl, file);
			const publicUrl = uploadUrl.split("?")[0];
			setVideoUrl(publicUrl);
		} catch (err) {
			console.error("Lỗi khi tải video:", err);
		} finally {
			setIsUploadingVideo(false);
			if (videoInputRef.current) videoInputRef.current.value = "";
		}
	};

	const handleSelectGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const availableSlots = 6 - imageUrls.length;
		if (availableSlots <= 0) return;
		const filesToUpload = Array.from(files).slice(0, availableSlots);
		setIsUploadingGallery(true);
		try {
			const newUrls: string[] = [];
			for (const file of filesToUpload) {
				const uploadUrl = await storageService.getUploadUrl(file.name, file.type);
				await storageService.uploadS3(uploadUrl, file);
				newUrls.push(uploadUrl.split("?")[0]);
			}
			setImageUrls([...imageUrls, ...newUrls]);
		} catch (err) {
			console.error("Lỗi khi tải ảnh chi tiết:", err);
		} finally {
			setIsUploadingGallery(false);
			if (galleryInputRef.current) galleryInputRef.current.value = "";
		}
	};

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
				{/* 1. Ảnh bìa sản phẩm */}
				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Ảnh bìa sản phẩm <span className="text-red-500 font-bold">*</span>
					</label>
					<div className="flex items-start gap-4">
						<div
							className="relative w-28 h-28 border border-brand-border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group shadow-2xs shrink-0"
							onClick={() => {
								if (coverImage) {
									setPreviewImageIndex(0);
								} else {
									coverInputRef.current?.click();
								}
							}}
							title={coverImage ? "Click để xem phóng to ảnh" : "Click để tải ảnh lên"}
						>
							{coverImage ? (
								<>
									<img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
									<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity font-bold">
										<Eye className="w-4 h-4" />
										<span>Xem ảnh</span>
									</div>
								</>
							) : (
								<div className="flex flex-col items-center gap-1 text-brand-muted">
									<Plus className="w-6 h-6" />
									<span className="text-[10px] font-bold">Tải ảnh bìa</span>
								</div>
							)}
							{isUploadingCover && (
								<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
									<Loader2 className="w-5 h-5 animate-spin" />
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 pt-1">
							<input
								ref={coverInputRef}
								type="file"
								accept="image/*"
								onChange={handleSelectCoverFile}
								className="hidden"
							/>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => coverInputRef.current?.click()}
									disabled={isUploadingCover}
									className="px-3 py-1.5 bg-brand-light-soft hover:bg-slate-200 text-brand-dark font-bold text-xs rounded-md border border-brand-border flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
								>
									<Upload className="w-3.5 h-3.5" />
									<span>{coverImage ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
								</button>
								{coverImage && (
									<button
										type="button"
										onClick={() => setCoverImage("")}
										className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-md border border-red-200 flex items-center gap-1.5 cursor-pointer transition-colors"
									>
										<Trash2 className="w-3.5 h-3.5" />
										<span>Xóa ảnh</span>
									</button>
								)}
							</div>
							<p className="text-[11px] text-brand-muted leading-tight max-w-[280px]">
								Ảnh bìa là hình ảnh đầu tiên khách hàng nhìn thấy. Tỉ lệ 1:1, dung lượng tối đa 20MB. Nhấn vào ảnh để review phóng to.
							</p>
						</div>
					</div>
				</div>

				{/* 2. Danh sách ảnh chi tiết (Kéo thả sắp xếp & Review) */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<label className="block text-xs font-bold text-brand-dark">
							Hình ảnh sản phẩm (Tối đa 6 ảnh) <span className="text-red-500 font-bold">*</span>
						</label>
						<span className="text-[11px] text-brand-muted font-medium">
							Giữ và kéo thả ảnh để đổi vị trí hiển thị • {imageUrls.length}/6 ảnh
						</span>
					</div>

					<input
						ref={galleryInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handleSelectGalleryFiles}
						className="hidden"
					/>

					<div className="flex flex-wrap gap-3 items-start pt-1">
						{imageUrls.map((url, imgIdx) => {
							const isDragging = draggedImgIdx === imgIdx;
							const isOver = dragOverImgIdx === imgIdx;
							const modalIdx = (coverImage ? 1 : 0) + imgIdx;

							return (
								<div
									key={imgIdx}
									draggable
									onDragStart={() => setDraggedImgIdx(imgIdx)}
									onDragOver={(e) => {
										e.preventDefault();
										setDragOverImgIdx(imgIdx);
									}}
									onDragLeave={() => setDragOverImgIdx(null)}
									onDrop={() => {
										if (draggedImgIdx !== null) {
											handleMoveImage(draggedImgIdx, imgIdx);
											setDraggedImgIdx(null);
											setDragOverImgIdx(null);
										}
									}}
									onDragEnd={() => {
										setDraggedImgIdx(null);
										setDragOverImgIdx(null);
									}}
									className={`flex flex-col items-center gap-1 group transition-all select-none cursor-grab active:cursor-grabbing ${
										isDragging ? "opacity-30 scale-95" : ""
									} ${isOver ? "ring-2 ring-brand-primary rounded-md" : ""}`}
								>
									<div
										className="relative w-20 h-20 border border-brand-border rounded-md overflow-hidden bg-gray-50 cursor-pointer shadow-2xs group-hover:border-brand-primary transition-colors"
										onClick={() => setPreviewImageIndex(modalIdx)}
										title="Nhấn để xem review ảnh • Giữ kéo thả để đổi vị trí"
									>
										<img
											src={url}
											alt={`Product detail ${imgIdx + 1}`}
											className="w-full h-full object-cover pointer-events-none"
										/>
										<div className="absolute top-1 left-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
											<GripVertical className="w-3 h-3" />
										</div>
										<div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity gap-0.5">
											<Eye className="w-3 h-3" />
											<span>Xem</span>
										</div>
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											const newUrls = imageUrls.filter((_, idx) => idx !== imgIdx);
											setImageUrls(newUrls);
										}}
										className="px-2 py-0.5 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 flex items-center gap-1 cursor-pointer transition-colors"
										title="Xóa ảnh này"
									>
										<Trash2 className="w-3 h-3" />
										<span>Xóa</span>
									</button>
								</div>
							);
						})}

						{imageUrls.length < 6 && (
							<div
								onClick={() => galleryInputRef.current?.click()}
								className="w-20 h-20 border-2 border-dashed border-brand-border rounded-md bg-brand-light-soft hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-colors text-brand-muted hover:text-brand-dark relative shadow-2xs"
								title="Tải thêm ảnh chi tiết (tối đa 6 ảnh)"
							>
								{isUploadingGallery ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<>
										<Plus className="w-5 h-5 mb-0.5" />
										<span className="text-[10px] font-bold">Thêm ảnh</span>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* 3. Video sản phẩm */}
				<div>
					<label className="block text-xs font-bold text-brand-dark mb-1.5">
						Video sản phẩm
					</label>
					<div className="flex items-start gap-4">
						<input
							ref={videoInputRef}
							type="file"
							accept="video/*"
							onChange={handleSelectVideoFile}
							className="hidden"
						/>
						{videoUrl ? (
							<div className="relative w-48 h-28 border border-brand-border rounded-md overflow-hidden bg-black shadow-2xs shrink-0">
								<video src={videoUrl} controls className="w-full h-full object-cover" />
							</div>
						) : (
							<div
								onClick={() => videoInputRef.current?.click()}
								className="w-48 h-28 border-2 border-dashed border-brand-border rounded-md bg-brand-light-soft hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-colors text-brand-muted hover:text-brand-dark shadow-2xs shrink-0"
							>
								{isUploadingVideo ? (
									<Loader2 className="w-6 h-6 animate-spin" />
								) : (
									<div className="flex flex-col items-center gap-1">
										<VideoCameraOutlined className="text-xl text-brand-primary" />
										<span className="text-[10px] font-bold">Tải video sản phẩm</span>
									</div>
								)}
							</div>
						)}
						<div className="flex flex-col gap-2 pt-1">
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => videoInputRef.current?.click()}
									disabled={isUploadingVideo}
									className="px-3 py-1.5 bg-brand-light-soft hover:bg-slate-200 text-brand-dark font-bold text-xs rounded-md border border-brand-border flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
								>
									<Upload className="w-3.5 h-3.5" />
									<span>{videoUrl ? "Thay đổi video" : "Tải video lên"}</span>
								</button>
								{videoUrl && (
									<button
										type="button"
										onClick={() => setVideoUrl("")}
										className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-md border border-red-200 flex items-center gap-1.5 cursor-pointer transition-colors"
									>
										<Trash2 className="w-3.5 h-3.5" />
										<span>Xóa video</span>
									</button>
								)}
							</div>
							<p className="text-[11px] text-brand-muted leading-tight max-w-[280px]">
								Định dạng MP4, tối đa 50MB. Video giúp người mua xem chi tiết chất lượng sản phẩm trực quan.
							</p>
						</div>
					</div>
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

			{/* Review Modal xem ảnh chi tiết (Shopee/TikTok-style) */}
			<ProductImageModal
				isOpen={previewImageIndex !== null}
				onClose={() => setPreviewImageIndex(null)}
				images={modalImages}
				initialIndex={previewImageIndex ?? 0}
				productTitle={name || "Xem ảnh sản phẩm"}
			/>
		</div>
	);
};
