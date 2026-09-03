import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
	bannerApi, 
	type BannerDto, 
	type CreateBannerRequest, 
	type UpdateBannerRequest 
} from "../api/bannerApi";
import { 
	Plus, 
	Pencil, 
	Trash2, 
	RefreshCw, 
	Loader2, 
	Eye, 
	CheckCircle2, 
	XCircle, 
	ArrowRight, 
	ExternalLink,
	X,
	Image as ImageIcon,
	Sparkles,
	GripVertical,
	ArrowUpDown,
	ListOrdered,
	LayoutGrid
} from "lucide-react";
import { UploadImage } from "@/shared";
import { toast } from "react-toastify";

// Danh sách các gam màu Tailwind cơ bản để phối
const TAILWIND_COLORS = [
	{ name: "Blue", bg: "bg-blue-600", from: "from-blue-600", via: "via-blue-600", to: "to-blue-600" },
	{ name: "Indigo", bg: "bg-indigo-600", from: "from-indigo-600", via: "via-indigo-600", to: "to-indigo-600" },
	{ name: "Sky", bg: "bg-sky-500", from: "from-sky-500", via: "via-sky-500", to: "to-sky-500" },
	{ name: "Cyan", bg: "bg-cyan-600", from: "from-cyan-600", via: "via-cyan-600", to: "to-cyan-600" },
	{ name: "Teal", bg: "bg-teal-600", from: "from-teal-600", via: "via-teal-600", to: "to-teal-600" },
	{ name: "Emerald", bg: "bg-emerald-600", from: "from-emerald-600", via: "via-emerald-600", to: "to-emerald-600" },
	{ name: "Green", bg: "bg-green-600", from: "from-green-600", via: "via-green-600", to: "to-green-600" },
	{ name: "Amber", bg: "bg-amber-500", from: "from-amber-500", via: "via-amber-500", to: "to-amber-500" },
	{ name: "Orange", bg: "bg-orange-500", from: "from-orange-500", via: "via-orange-500", to: "to-orange-500" },
	{ name: "Red", bg: "bg-red-600", from: "from-red-600", via: "via-red-600", to: "to-red-600" },
	{ name: "Rose", bg: "bg-rose-500", from: "from-rose-500", via: "via-rose-500", to: "to-rose-500" },
	{ name: "Pink", bg: "bg-pink-500", from: "from-pink-500", via: "via-pink-500", to: "to-pink-500" },
	{ name: "Purple", bg: "bg-purple-600", from: "from-purple-600", via: "via-purple-600", to: "to-purple-600" },
	{ name: "Violet", bg: "bg-violet-600", from: "from-violet-600", via: "via-violet-600", to: "to-violet-600" },
	{ name: "Slate", bg: "bg-slate-900", from: "from-slate-900", via: "via-slate-800", to: "to-slate-900" },
	{ name: "Zinc", bg: "bg-zinc-800", from: "from-zinc-800", via: "via-zinc-700", to: "to-zinc-900" },
];

// Danh sách Preset gradient đẹp mẫu
const GRADIENT_PRESETS = [
	{
		label: "Xanh BuuStore (Blue - Indigo - Blue)",
		direction: "bg-gradient-to-r",
		from: "from-blue-600",
		via: "via-indigo-600",
		to: "to-blue-700",
		className: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"
	},
	{
		label: "Hồng Nắng Mai (Pink - Rose - Amber)",
		direction: "bg-gradient-to-r",
		from: "from-pink-500",
		via: "via-rose-500",
		to: "to-amber-500",
		className: "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"
	},
	{
		label: "Tím Huyền Ảo (Purple - Violet - Indigo)",
		direction: "bg-gradient-to-r",
		from: "from-purple-600",
		via: "via-violet-600",
		to: "to-indigo-700",
		className: "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700"
	},
	{
		label: "Xanh Sinh Thái (Emerald - Teal - Cyan)",
		direction: "bg-gradient-to-r",
		from: "from-emerald-600",
		via: "via-teal-600",
		to: "to-cyan-700",
		className: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700"
	},
	{
		label: "Cam Siêu Sale (Orange - Amber - Red)",
		direction: "bg-gradient-to-r",
		from: "from-orange-500",
		via: "via-amber-500",
		to: "to-red-600",
		className: "bg-gradient-to-r from-orange-500 via-amber-500 to-red-600"
	},
	{
		label: "Đỏ Quyền Lực (Red - Rose - Pink)",
		direction: "bg-gradient-to-r",
		from: "from-red-600",
		via: "via-rose-600",
		to: "to-pink-600",
		className: "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600"
	},
	{
		label: "Đêm Huyền Bí (Slate - Zinc - Neutral)",
		direction: "bg-gradient-to-r",
		from: "from-slate-900",
		via: "via-zinc-800",
		to: "to-neutral-900",
		className: "bg-gradient-to-r from-slate-900 via-zinc-800 to-neutral-900"
	}
];

const DIRECTIONS = [
	{ label: "Ngang (Trái ➔ Phải)", value: "bg-gradient-to-r" },
	{ label: "Dọc (Trên ➔ Dưới)", value: "bg-gradient-to-b" },
	{ label: "Chéo (Góc trên trái ➔ Dưới phải)", value: "bg-gradient-to-br" },
	{ label: "Chéo (Góc dưới trái ➔ Trên phải)", value: "bg-gradient-to-tr" },
];

export function AdminBannersView() {
	const [activeTab, setActiveTab] = useState<"list" | "reorder">("list");
	const [banners, setBanners] = useState<BannerDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	// Modals
	const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
	const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
	const [deleteBannerId, setDeleteBannerId] = useState<number | null>(null);
	
	// Modal Bật Hiển Thị & Nhập Vị Trí
	const [activeModalBanner, setActiveModalBanner] = useState<BannerDto | null>(null);
	const [insertPositionInput, setInsertPositionInput] = useState<string>("");

	// Drag & Drop State for Reordering
	const [reorderList, setReorderList] = useState<BannerDto[]>([]);
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [isReordering, setIsReordering] = useState(false);

	// Form States (Bỏ IsActive và DisplayOrder khi nhập)
	const [title, setTitle] = useState("");
	const [subtitle, setSubtitle] = useState("");
	const [badge, setBadge] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [buttonText, setButtonText] = useState("Mua ngay");
	const [targetUrl, setTargetUrl] = useState("/products");

	// Interactive Gradient Selector States
	const [gradientDirection, setGradientDirection] = useState("bg-gradient-to-r");
	const [fromColor, setFromColor] = useState("from-blue-600");
	const [viaColor, setViaColor] = useState("via-indigo-600");
	const [toColor, setToColor] = useState("to-blue-700");
	const [hasViaColor, setHasViaColor] = useState(true);

	// Tự động sinh chuỗi class Tailwind CSS từ các nút chọn
	const computedGradientClass = `${gradientDirection} ${fromColor} ${hasViaColor ? viaColor + " " : ""}${toColor}`.trim();

	const fetchBanners = async () => {
		setIsLoading(true);
		try {
			const data = await bannerApi.getAdminBanners();
			setBanners(data);
			setReorderList(data.filter(b => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder));
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Không thể tải danh sách banner");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchBanners();
	}, []);

	// Áp dụng Preset khi click nút Preset
	const applyPreset = (preset: typeof GRADIENT_PRESETS[0]) => {
		setGradientDirection(preset.direction);
		setFromColor(preset.from);
		setViaColor(preset.via);
		setToColor(preset.to);
		setHasViaColor(Boolean(preset.via));
	};

	const openCreateModal = () => {
		setModalMode("create");
		setEditingBanner(null);
		setTitle("");
		setSubtitle("");
		setBadge("");
		setImageUrl("");
		setButtonText("Mua ngay");
		setTargetUrl("/products");
		applyPreset(GRADIENT_PRESETS[0]);
	};

	const openEditModal = (b: BannerDto) => {
		setModalMode("edit");
		setEditingBanner(b);
		setTitle(b.title);
		setSubtitle(b.subtitle || "");
		setBadge(b.badge || "");
		setImageUrl(b.imageUrl);
		setButtonText(b.buttonText);
		setTargetUrl(b.targetUrl);
		
		// Parse chuỗi gradient đã lưu nếu có thể
		const rawGradient = b.themeGradient || "";
		const matchedPreset = GRADIENT_PRESETS.find(p => p.className === rawGradient);
		if (matchedPreset) {
			applyPreset(matchedPreset);
		} else {
			const parts = rawGradient.split(" ").map(p => p.trim()).filter(Boolean);
			const dir = parts.find(p => p.startsWith("bg-gradient-to-")) || "bg-gradient-to-r";
			const from = parts.find(p => p.startsWith("from-")) || "from-blue-600";
			const via = parts.find(p => p.startsWith("via-"));
			const to = parts.find(p => p.startsWith("to-")) || "to-blue-700";

			setGradientDirection(dir);
			setFromColor(from);
			if (via) {
				setViaColor(via);
				setHasViaColor(true);
			} else {
				setHasViaColor(false);
			}
			setToColor(to);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("Vui lòng nhập tiêu đề banner!");
			return;
		}
		if (!imageUrl.trim()) {
			toast.error("Vui lòng tải lên ảnh hoặc nhập URL ảnh banner!");
			return;
		}

		setIsSubmitting(true);
		try {
			if (modalMode === "create") {
				const payload: CreateBannerRequest = {
					title: title.trim(),
					subtitle: subtitle.trim() || undefined,
					badge: badge.trim() || undefined,
					imageUrl: imageUrl.trim(),
					buttonText: buttonText.trim() || "Mua ngay",
					targetUrl: targetUrl.trim() || "/products",
					themeGradient: computedGradientClass,
				};
				await bannerApi.createBanner(payload);
				toast.success("Tạo banner mới thành công (Mặc định ở trạng thái Ẩn)!");
			} else if (modalMode === "edit" && editingBanner) {
				const payload: UpdateBannerRequest = {
					title: title.trim(),
					subtitle: subtitle.trim() || undefined,
					badge: badge.trim() || undefined,
					imageUrl: imageUrl.trim(),
					buttonText: buttonText.trim() || "Mua ngay",
					targetUrl: targetUrl.trim() || "/products",
					themeGradient: computedGradientClass,
				};
				await bannerApi.updateBanner(editingBanner.id, payload);
				toast.success("Cập nhật banner thành công!");
			}
			setModalMode(null);
			fetchBanners();
		} catch (err: any) {
			toast.error(err.response?.data?.message || err.response?.data || "Đã xảy ra lỗi khi lưu banner");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Xử lý khi nhấn nút Trạng thái
	const handleStatusClick = (b: BannerDto) => {
		if (b.isActive) {
			// Đang bật -> Tắt ngay lập tức (không cần nhập số)
			handleToggleStatus(b.id);
		} else {
			// Đang ẩn -> Mở modal cho nhập vị trí cần chèn
			const activeBannersCount = banners.filter(x => x.isActive).length;
			setInsertPositionInput((activeBannersCount + 1).toString());
			setActiveModalBanner(b);
		}
	};

	const handleToggleStatus = async (id: number, customOrder?: number) => {
		try {
			await bannerApi.toggleBannerStatus(id, customOrder);
			toast.success("Đã cập nhật trạng thái banner!");
			setActiveModalBanner(null);
			fetchBanners();
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái");
		}
	};

	const handleConfirmActivate = () => {
		if (!activeModalBanner) return;
		const parsed = parseInt(insertPositionInput, 10);
		// Nếu không hợp lệ hoặc <= 0, truyền undefined để BE tự động lấy lớn nhất (xếp cuối)
		const validPosition = !isNaN(parsed) && parsed > 0 ? parsed : undefined;
		handleToggleStatus(activeModalBanner.id, validPosition);
	};

	const handleDelete = async () => {
		if (!deleteBannerId) return;
		try {
			await bannerApi.deleteBanner(deleteBannerId);
			toast.success("Đã xóa banner thành công!");
			setDeleteBannerId(null);
			fetchBanners();
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Không thể xóa banner");
		}
	};

	// Drag & Drop Handlers for Reordering
	const handleDragStart = (index: number) => {
		setDraggedIndex(index);
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		const updated = [...reorderList];
		const [draggedItem] = updated.splice(draggedIndex, 1);
		updated.splice(index, 0, draggedItem);

		setDraggedIndex(index);
		setReorderList(updated);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
	};

	const handleSaveReorder = async () => {
		setIsReordering(true);
		try {
			const ids = reorderList.map(b => b.id);
			await bannerApi.reorderBanners(ids);
			toast.success("Đã cập nhật thứ tự hiển thị banner thành công!");
			fetchBanners();
		} catch (err: any) {
			toast.error(err.response?.data?.message || "Không thể lưu thứ tự banner");
		} finally {
			setIsReordering(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* TOP HEADER BAR */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-sm font-black text-brand-dark uppercase tracking-wider">
						Quản lý Banner Trang chủ
					</h1>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Tùy chỉnh các chiến dịch Banner động, phối màu Tailwind Gradient và sắp xếp thứ tự hiển thị
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={fetchBanners}
						disabled={isLoading}
						className="px-3 py-1.5 border border-brand-border bg-white hover:bg-brand-light-soft text-brand-dark rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Làm mới
					</button>
					<button
						onClick={openCreateModal}
						className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
					>
						<Plus className="w-3.5 h-3.5" />
						Thêm Banner Mới
					</button>
				</div>
			</div>

			{/* NAVIGATION TABS (Danh sách Banner / Thứ tự Kéo thả) */}
			<div className="flex items-center gap-1 border-b border-brand-border">
				<button
					onClick={() => setActiveTab("list")}
					className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
						activeTab === "list"
							? "border-brand-primary text-brand-primary bg-brand-primary/5"
							: "border-transparent text-brand-muted hover:text-brand-dark"
					}`}
				>
					<LayoutGrid className="w-3.5 h-3.5" />
					Danh sách Banner ({banners.length})
				</button>
				<button
					onClick={() => setActiveTab("reorder")}
					className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
						activeTab === "reorder"
							? "border-brand-primary text-brand-primary bg-brand-primary/5"
							: "border-transparent text-brand-muted hover:text-brand-dark"
					}`}
				>
					<ListOrdered className="w-3.5 h-3.5" />
					Thứ tự hiển thị ({banners.filter(b => b.isActive).length} đang bật)
				</button>
			</div>

			{/* TAB 1: DANH SÁCH BANNER */}
			{activeTab === "list" && (
				<div className="bg-white border border-brand-border rounded overflow-hidden shadow-2xs">
					{isLoading ? (
						<div className="py-20 flex flex-col items-center justify-center text-brand-muted gap-2">
							<Loader2 className="w-7 h-7 animate-spin text-brand-primary" />
							<span className="text-xs font-medium">Đang tải danh sách banner...</span>
						</div>
					) : banners.length === 0 ? (
						<div className="py-16 text-center text-brand-muted space-y-2">
							<p className="text-xs font-bold text-brand-dark">Chưa có banner nào được tạo</p>
							<p className="text-[11px] max-w-sm mx-auto">
								Hãy bấm nút "Thêm Banner Mới" ở trên để tạo các chiến dịch khuyến mãi hoặc sự kiện hấp dẫn cho trang chủ.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-brand-border bg-brand-light-soft/60 text-brand-muted font-bold uppercase tracking-wider text-[11px]">
										<th className="py-2.5 px-4 w-12 text-center">#</th>
										<th className="py-2.5 px-4 w-36">Ảnh nền</th>
										<th className="py-2.5 px-4">Thông tin Banner</th>
										<th className="py-2.5 px-4 w-44">Màu Theme Tailwind</th>
										<th className="py-2.5 px-4 w-32">Nút & Link</th>
										<th className="py-2.5 px-4 w-20 text-center">Thứ tự</th>
										<th className="py-2.5 px-4 w-28 text-center">Trạng thái</th>
										<th className="py-2.5 px-4 w-24 text-right">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border">
									{banners.map((b, idx) => (
										<tr key={b.id} className="hover:bg-brand-light-soft/30 transition-colors">
											<td className="py-2.5 px-4 text-center font-bold text-brand-muted">
												{idx + 1}
											</td>
											<td className="py-2.5 px-4">
												<div className="w-28 h-13 rounded overflow-hidden bg-slate-100 border border-brand-border relative">
													<img
														src={b.imageUrl}
														alt={b.title}
														className="w-full h-full object-cover"
														onError={(e) => {
															(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=300";
														}}
													/>
												</div>
											</td>
											<td className="py-2.5 px-4 space-y-0.5 max-w-xs">
												{b.badge && (
													<span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-black uppercase tracking-wider">
														{b.badge}
													</span>
												)}
												<p className="font-bold text-brand-dark text-xs line-clamp-1">
													{b.title}
												</p>
												{b.subtitle && (
													<p className="text-[11px] text-brand-muted line-clamp-1">
														{b.subtitle}
													</p>
												)}
											</td>
											<td className="py-2.5 px-4">
												<div className="flex items-center gap-2">
													<div className={`w-5 h-5 rounded shrink-0 border border-white shadow-2xs ${b.themeGradient}`} />
													<span className="text-[10px] text-brand-muted font-mono truncate max-w-32" title={b.themeGradient}>
														{b.themeGradient}
													</span>
												</div>
											</td>
											<td className="py-2.5 px-4 space-y-0.5">
												<span className="font-bold text-brand-dark text-[11px] block">
													{b.buttonText}
												</span>
												<span className="text-[10px] text-blue-600 font-mono flex items-center gap-0.5 truncate max-w-28" title={b.targetUrl}>
													<ExternalLink className="w-2.5 h-2.5 shrink-0" />
													{b.targetUrl}
												</span>
											</td>
											<td className="py-2.5 px-4 text-center font-bold text-brand-dark">
												{b.isActive && b.displayOrder > 0 ? (
													<span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold">
														#{b.displayOrder}
													</span>
												) : null}
											</td>
											<td className="py-2.5 px-4 text-center">
												<button
													onClick={() => handleStatusClick(b)}
													className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-colors cursor-pointer inline-block ${
														b.isActive
															? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
															: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
													}`}
													title="Nhấn để đổi trạng thái Hiển thị / Ẩn"
												>
													{b.isActive ? "Hiển thị" : "Đã ẩn"}
												</button>
											</td>
											<td className="py-2.5 px-4 text-right">
												<div className="flex items-center justify-end gap-1">
													<button
														onClick={() => openEditModal(b)}
														className="p-1.5 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer border-none bg-transparent"
														title="Chỉnh sửa banner"
													>
														<Pencil className="w-3.5 h-3.5" />
													</button>
													<button
														onClick={() => setDeleteBannerId(b.id)}
														className="p-1.5 text-brand-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer border-none bg-transparent"
														title="Xóa banner"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* TAB 2: SẮP XẾP THỨ TỰ KÉO THẢ (SORTED LIST) */}
			{activeTab === "reorder" && (
				<div className="bg-white border border-brand-border rounded p-5 space-y-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
								<ArrowUpDown className="w-4 h-4 text-brand-primary" />
								Kéo thả để sắp xếp thứ tự hiển thị Banner trên Trang chủ
							</h3>
							<p className="text-[11px] text-brand-muted mt-0.5">
								Banner ở vị trí đầu tiên (#1) sẽ xuất hiện đầu tiên khi người dùng truy cập trang web.
							</p>
						</div>
						<button
							onClick={handleSaveReorder}
							disabled={isReordering || reorderList.length === 0}
							className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
						>
							{isReordering ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									Đang lưu...
								</>
							) : (
								"Lưu thứ tự mới"
							)}
						</button>
					</div>

					{reorderList.length === 0 ? (
						<div className="py-12 text-center text-brand-muted text-xs">
							Không có banner nào đang ở trạng thái hiển thị để sắp xếp.
						</div>
					) : (
						<div className="space-y-2 max-w-2xl">
							{reorderList.map((b, idx) => (
								<div
									key={b.id}
									draggable
									onDragStart={() => handleDragStart(idx)}
									onDragOver={(e) => handleDragOver(e, idx)}
									onDragEnd={handleDragEnd}
									className={`flex items-center justify-between p-3 border rounded bg-white transition-all cursor-move ${
										draggedIndex === idx 
											? "border-brand-primary bg-brand-primary/5 shadow-md scale-[1.01]" 
											: "border-brand-border hover:border-brand-primary/50"
									}`}
								>
									<div className="flex items-center gap-3">
										<GripVertical className="w-4 h-4 text-brand-muted shrink-0" />
										<span className="w-6 h-6 rounded-full bg-brand-light-soft font-black text-xs text-brand-dark flex items-center justify-center border border-brand-border">
											{idx + 1}
										</span>
										<div className="w-16 h-8 rounded overflow-hidden bg-slate-100 border border-brand-border shrink-0">
											<img
												src={b.imageUrl}
												alt={b.title}
												className="w-full h-full object-cover"
											/>
										</div>
										<div className="overflow-hidden max-w-sm">
											<p className="font-bold text-brand-dark text-xs truncate">
												{b.title}
											</p>
											<p className="text-[10px] text-brand-muted truncate">
												{b.badge || b.subtitle || b.targetUrl}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<div className={`w-4 h-4 rounded-full ${b.themeGradient}`} />
										<span className="text-[10px] text-brand-muted font-mono">
											Vị trí #{idx + 1}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* MODAL CREATE / EDIT BANNER (Đồng bộ theo style Admin đã tinh chỉnh: Icon trước tiêu đề, Bố cục thông tin cũ lên trên, Chọn màu xuống dưới, không có displayOrder/isActive) */}
			{modalMode && createPortal(
				<div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
						{/* MODAL HEADER: Icon trước tiêu đề, padding vừa vặn */}
						<div className="px-5 pt-2 pb-2 border-b border-brand-border flex items-center justify-between bg-white shrink-0">
							<h3 className="text-[16px] font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
								{modalMode === "create" ? (
									<>
										<Plus className="w-4 h-4 text-brand-primary" />
										Thêm banner trang chủ mới
									</>
								) : (
									<>
										<Pencil className="w-4 h-4 text-brand-primary" />
										Cập nhật banner
									</>
								)}
							</h3>
							<button
								onClick={() => setModalMode(null)}
								className="p-1 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
								title="Đóng modal"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* MODAL BODY */}
						<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
							{/* 1. LIVE PREVIEW BANNER */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-[11px] font-black text-brand-dark uppercase tracking-wider flex items-center gap-1">
										<Eye className="w-3.5 h-3.5 text-brand-primary" />
										Xem trước Banner thực tế (Live Preview)
									</label>
									<span className="text-[10px] text-brand-muted font-mono">
										{computedGradientClass}
									</span>
								</div>

								{/* Preview Container */}
								<div className="w-full h-[200px] rounded-lg overflow-hidden shadow-xs border border-brand-border relative">
									<div className={`w-full h-full relative p-5 flex flex-col justify-between transition-all duration-300 ${computedGradientClass}`}>
										{/* Ảnh mờ nền */}
										{imageUrl && (
											<div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
												<img
													src={imageUrl}
													alt="Banner Preview"
													className="w-full h-full object-cover"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = "none";
													}}
												/>
											</div>
										)}

										{/* Text content */}
										<div className="relative z-10 space-y-1 max-w-lg text-left text-white">
											{badge && (
												<span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/30">
													{badge}
												</span>
											)}
											<h2 className="text-base md:text-lg font-black leading-tight tracking-tight drop-shadow-md">
												{title || "TIÊU ĐỀ BANNER CỦA BẠN"}
											</h2>
											<p className="text-[11px] text-white/90 font-medium leading-relaxed">
												{subtitle || "Mô tả phụ hoặc ưu đãi hấp dẫn kèm theo của banner..."}
											</p>
										</div>

										{/* Nút bấm */}
										<div className="relative z-10 flex items-center justify-between">
											<div className="px-3 py-1.5 bg-white text-brand-dark font-black text-xs rounded shadow-xs flex items-center gap-1.5">
												{buttonText || "Mua ngay"}
												<ArrowRight className="w-3.5 h-3.5" />
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* 2. KHU VỰC NHẬP THÔNG TIN BANNER (LÊN TRÊN - GIỮ NGUYÊN NỘI DUNG CHUẨN) */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
								{/* Tiêu đề */}
								<div className="space-y-1 md:col-span-2">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Tiêu đề Banner <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										placeholder="VD: MỌT SÁCH BUU STORE - THÊM TRI THỨC TỪNG NGÀY"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white"
									/>
								</div>

								{/* Mô tả phụ */}
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Mô tả phụ / Thông điệp khuyến mãi
									</label>
									<input
										type="text"
										placeholder="VD: Mở từng trang sách | Ưu đãi đến 30% | Giao nhanh 2H*"
										value={subtitle}
										onChange={(e) => setSubtitle(e.target.value)}
										className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white"
									/>
								</div>

								{/* Badge nổi bật */}
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Nhãn Badge nổi bật
									</label>
									<input
										type="text"
										placeholder="VD: SÁCH MỚI BUU STORE hoặc HOT SALE THÁNG 8"
										value={badge}
										onChange={(e) => setBadge(e.target.value)}
										className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white"
									/>
								</div>

								{/* Chữ trên nút */}
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Chữ trên nút bấm (CTA Button Text)
									</label>
									<input
										type="text"
										placeholder="VD: Mua ngay, Xem ngay, Sắm ngay..."
										value={buttonText}
										onChange={(e) => setButtonText(e.target.value)}
										className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white"
									/>
								</div>

								{/* Target URL */}
								<div className="space-y-1">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Đường dẫn điều hướng (Target URL khi click nút)
									</label>
									<input
										type="text"
										placeholder="VD: /products, /products?categoryId=2, /deals..."
										value={targetUrl}
										onChange={(e) => setTargetUrl(e.target.value)}
										className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white font-mono"
									/>
								</div>

								{/* Upload / URL Ảnh nền */}
								<div className="space-y-1 md:col-span-2">
									<label className="text-[11px] font-bold text-brand-muted uppercase">
										Ảnh nền Banner <span className="text-red-500">*</span>
									</label>
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
										<div className="shrink-0">
											<UploadImage
												value={imageUrl}
												onChange={(url) => setImageUrl(url || "")}
											/>
										</div>
										<div className="flex-1 w-full space-y-1">
											<input
												type="url"
												placeholder="Hoặc dán trực tiếp đường dẫn URL ảnh (https://...)"
												value={imageUrl}
												onChange={(e) => setImageUrl(e.target.value)}
												className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white font-mono"
											/>
											<p className="text-[10px] text-brand-muted">
												Khuyến nghị ảnh tỉ lệ ngang rộng (1200x500px trở lên) để hiển thị sắc nét nhất.
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* 3. BỘ CHỌN & PHỐI MÀU TAILWIND (ĐƯA XUỐNG DƯỚI) */}
							<div className="bg-brand-light-soft/50 border border-brand-border rounded-lg p-3.5 space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-[11px] font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
										<Sparkles className="w-3.5 h-3.5 text-brand-primary" />
										Tùy chỉnh phối màu Theme Gradient (Tailwind CSS)
									</span>
									<span className="text-[10px] text-brand-muted">
										Click nút để phối màu
									</span>
								</div>

								{/* A. Chọn Preset nhanh */}
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-brand-muted uppercase">
										1. Chọn mẫu sẵn (Preset)
									</label>
									<div className="flex flex-wrap gap-1.5">
										{GRADIENT_PRESETS.map((preset, idx) => (
											<button
												key={idx}
												type="button"
												onClick={() => applyPreset(preset)}
												className={`px-2.5 py-1 rounded text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer bg-white ${
													computedGradientClass === preset.className
														? "border-brand-primary text-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
														: "border-brand-border text-brand-dark hover:border-brand-primary/50"
												}`}
											>
												<span className={`w-3 h-3 rounded-full ${preset.className} shrink-0`} />
												<span>{preset.label.split("(")[0]}</span>
											</button>
										))}
									</div>
								</div>

								{/* B. Chọn Hướng Gradient */}
								<div className="space-y-1 pt-1 border-t border-brand-border/60">
									<label className="text-[10px] font-bold text-brand-muted uppercase">
										2. Hướng Gradient
									</label>
									<div className="flex flex-wrap gap-1.5">
										{DIRECTIONS.map((dir) => (
											<button
												key={dir.value}
												type="button"
												onClick={() => setGradientDirection(dir.value)}
												className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
													gradientDirection === dir.value
														? "bg-brand-primary text-white border-brand-primary shadow-2xs"
														: "bg-white text-brand-dark border-brand-border hover:bg-brand-light-soft"
												}`}
											>
												{dir.label}
											</button>
										))}
									</div>
								</div>

								{/* C. Chọn Bảng Màu Điểm Bắt Đầu (From Color) */}
								<div className="space-y-1 pt-1 border-t border-brand-border/60">
									<label className="text-[10px] font-bold text-brand-muted uppercase">
										3. Màu Bắt Đầu (From Color): <span className="text-brand-dark font-mono font-bold lowercase">{fromColor}</span>
									</label>
									<div className="flex flex-wrap gap-1.5">
										{TAILWIND_COLORS.map((c) => (
											<button
												key={c.name}
												type="button"
												onClick={() => setFromColor(c.from)}
												className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer bg-white ${
													fromColor === c.from
														? "border-brand-primary ring-1 ring-brand-primary text-brand-dark font-black shadow-2xs"
														: "border-brand-border text-brand-muted hover:text-brand-dark"
												}`}
											>
												<span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
												{c.name}
											</button>
										))}
									</div>
								</div>

								{/* D. Chọn Bảng Màu Điểm Giữa (Via Color) */}
								<div className="space-y-1 pt-1 border-t border-brand-border/60">
									<div className="flex items-center justify-between">
										<label className="text-[10px] font-bold text-brand-muted uppercase flex items-center gap-1.5">
											4. Màu Chuyển Giữa (Via Color): 
											{hasViaColor ? (
												<span className="text-brand-dark font-mono font-bold lowercase">{viaColor}</span>
											) : (
												<span className="text-gray-400 font-normal">Không sử dụng</span>
											)}
										</label>
										<button
											type="button"
											onClick={() => setHasViaColor(!hasViaColor)}
											className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer border-none bg-transparent"
										>
											{hasViaColor ? "Tắt màu giữa" : "Bật màu giữa"}
										</button>
									</div>
									{hasViaColor && (
										<div className="flex flex-wrap gap-1.5 animate-in fade-in duration-150">
											{TAILWIND_COLORS.map((c) => (
												<button
													key={c.name}
													type="button"
													onClick={() => setViaColor(c.via)}
													className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer bg-white ${
														viaColor === c.via
															? "border-brand-primary ring-1 ring-brand-primary text-brand-dark font-black shadow-2xs"
															: "border-brand-border text-brand-muted hover:text-brand-dark"
													}`}
												>
													<span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
													{c.name}
												</button>
											))}
										</div>
									)}
								</div>

								{/* E. Chọn Bảng Màu Điểm Kết Thúc (To Color) */}
								<div className="space-y-1 pt-1 border-t border-brand-border/60">
									<label className="text-[10px] font-bold text-brand-muted uppercase">
										5. Màu Kết Thúc (To Color): <span className="text-brand-dark font-mono font-bold lowercase">{toColor}</span>
									</label>
									<div className="flex flex-wrap gap-1.5">
										{TAILWIND_COLORS.map((c) => (
											<button
												key={c.name}
												type="button"
												onClick={() => setToColor(c.to)}
												className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer bg-white ${
													toColor === c.to
														? "border-brand-primary ring-1 ring-brand-primary text-brand-dark font-black shadow-2xs"
														: "border-brand-border text-brand-muted hover:text-brand-dark"
												}`}
											>
												<span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
												{c.name}
											</button>
										))}
									</div>
								</div>
							</div>

							{/* MODAL FOOTER */}
							<div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => setModalMode(null)}
									disabled={isSubmitting}
									className="px-4 py-2 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded text-xs font-bold transition-all cursor-pointer"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
											Đang lưu...
										</>
									) : (
										modalMode === "create" ? "Tạo Banner" : "Lưu Thay Đổi"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>,
				document.body
			)}

			{/* MODAL CHỌN VỊ TRÍ HIỂN THỊ KHI BẬT BANNER */}
			{activeModalBanner && createPortal(
				<div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-lg shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-200 text-left">
						<div className="border-b border-brand-border pb-2.5 flex items-center justify-between">
							<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
								<CheckCircle2 className="w-4 h-4 text-emerald-600" />
								Kích hoạt hiển thị Banner
							</h3>
							<button
								onClick={() => setActiveModalBanner(null)}
								className="p-1 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-3 text-xs">
							<p className="text-brand-muted">
								Bạn đang kích hoạt banner <span className="font-bold text-brand-dark">"{activeModalBanner.title}"</span> lên trang chủ.
							</p>

							<div className="space-y-1">
								<label className="block text-[11px] font-bold text-brand-dark uppercase">
									Vị trí thứ tự hiển thị (Số &gt; 0)
								</label>
								<input
									type="number"
									min={1}
									value={insertPositionInput}
									onChange={(e) => setInsertPositionInput(e.target.value)}
									placeholder="VD: 1, 2, 3..."
									className="w-full px-3 py-2 border border-brand-border rounded text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary bg-white"
								/>
								<p className="text-[10px] text-brand-muted">
									* Nếu để trống hoặc nhập số không hợp lệ, hệ thống sẽ tự động xếp banner vào vị trí cuối cùng.
								</p>
							</div>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/60">
							<button
								onClick={() => setActiveModalBanner(null)}
								className="px-4 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded text-xs font-bold transition-all cursor-pointer"
							>
								Hủy
							</button>
							<button
								onClick={handleConfirmActivate}
								className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
							>
								Xác nhận Bật
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}

			{/* MODAL CONFIRM DELETE */}
			{deleteBannerId && createPortal(
				<div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="bg-white border border-brand-border rounded-lg shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-200">
						<div className="border-b border-brand-border pb-2.5 flex items-center justify-between">
							<h3 className="text-xs font-black text-red-600 uppercase tracking-wide flex items-center gap-1.5">
								<Trash2 className="w-4 h-4 text-red-600" />
								Xác nhận xóa Banner
							</h3>
							<button
								onClick={() => setDeleteBannerId(null)}
								className="p-1 text-brand-muted hover:text-brand-dark rounded hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
						<p className="text-xs text-brand-muted leading-relaxed">
							Bạn có chắc chắn muốn xóa banner này không? Hành động này không thể hoàn tác và banner sẽ ngay lập tức biến mất khỏi trang chủ.
						</p>
						<div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/60">
							<button
								onClick={() => setDeleteBannerId(null)}
								className="px-4 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded text-xs font-bold transition-all cursor-pointer"
							>
								Hủy
							</button>
							<button
								onClick={handleDelete}
								className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
							>
								Xóa ngay
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
