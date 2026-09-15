import { useState, useEffect, useMemo, useRef } from "react";
import {
	Globe,
	Layers,
	Store,
	Package,
	Search,
	Check,
	Calendar,
	X,
} from "lucide-react";

export type AdminAnalyticsMode = "platform" | "category" | "shop" | "product";
export type PresetFilter = "today" | "3d" | "week" | "custom";

export interface ParentCategoryItem {
	id: number | string;
	name: string;
}

export interface AdminAnalyticsFilterBarProps {
	mode: AdminAnalyticsMode;
	onModeChange: (mode: AdminAnalyticsMode) => void;
	preset: PresetFilter;
	selectedMonth: number;
	selectedYear: number;
	// Category Mode: Selected Parent Category
	selectedParentCategoryId: number | string;
	categories: ParentCategoryItem[];
	// Shop Mode: Search Shop ID
	activeShopId?: string | number | null;
	// Product Mode: Search Product ID or URL
	activeProductId?: string | number | null;
	// Nút Áp Dụng Duy Nhất Áp Dụng Cho Tất Cả Các Chế Độ
	onApply: (params: {
		mode: AdminAnalyticsMode;
		categoryId?: number | string;
		shopId?: string;
		productId?: string;
		preset: PresetFilter;
		month: number;
		year: number;
	}) => void;
}

export function AdminAnalyticsFilterBar({
	mode,
	onModeChange,
	preset,
	selectedMonth,
	selectedYear,
	selectedParentCategoryId,
	categories,
	activeShopId,
	activeProductId,
	onApply,
}: AdminAnalyticsFilterBarProps) {
	const currentYear = new Date().getFullYear();

	// Draft state: chỉ khi bấm nút "Áp dụng" mới đẩy dữ liệu ra ngoài
	const [draftCategory, setDraftCategory] = useState<number | string>(selectedParentCategoryId);
	const [draftPreset, setDraftPreset] = useState<PresetFilter>(preset);
	const [draftMonth, setDraftMonth] = useState<number>(selectedMonth);
	const [draftYear, setDraftYear] = useState<number>(selectedYear);

	const [rawShopInput, setRawShopInput] = useState(activeShopId ? String(activeShopId) : "");
	const [rawProductInput, setRawProductInput] = useState(
		activeProductId ? String(activeProductId) : ""
	);

	// Trạng thái đã bấm Áp Dụng / Phân Tích:
	// - Khi mới vào, khi đổi filter, đổi tab: isApplied = false (nút sáng màu, bấm được)
	// - Sau khi bấm nút: isApplied = true (nút xám đi, disabled, đổi text thành "Đã áp dụng" / "Đã phân tích")
	const [isApplied, setIsApplied] = useState(false);

	// Ghi nhận giá trị vừa bấm Áp dụng để không reset nhầm khi prop từ ngoài đồng bộ ngược lại
	const lastAppliedShopIdRef = useRef<string | undefined>(activeShopId ? String(activeShopId) : undefined);
	const lastAppliedProductIdRef = useRef<string | undefined>(activeProductId ? String(activeProductId) : undefined);

	// Đồng bộ khi props bên ngoài thay đổi (ví dụ điều hướng URL hoặc click phân tích shop từ bảng)
	useEffect(() => {
		setDraftCategory(selectedParentCategoryId);
		setIsApplied(false);
	}, [selectedParentCategoryId]);

	useEffect(() => {
		setDraftPreset(preset);
	}, [preset]);

	useEffect(() => {
		setDraftMonth(selectedMonth);
	}, [selectedMonth]);

	useEffect(() => {
		setDraftYear(selectedYear);
	}, [selectedYear]);

	useEffect(() => {
		const nextVal = activeShopId ? String(activeShopId) : "";
		setRawShopInput(nextVal);
		// Nếu shopId từ props khác với shopId vừa bấm apply (hoặc được truyền shop mới từ bên ngoài)
		if (nextVal !== (lastAppliedShopIdRef.current || "")) {
			setIsApplied(false);
		}
	}, [activeShopId]);

	useEffect(() => {
		const nextVal = activeProductId ? String(activeProductId) : "";
		setRawProductInput(nextVal);
		if (nextVal !== (lastAppliedProductIdRef.current || "")) {
			setIsApplied(false);
		}
	}, [activeProductId]);

	// Khi chuyển tab (mode thay đổi), lập tức reset lại nút về trạng thái bấm được bình thường
	useEffect(() => {
		setIsApplied(false);
	}, [mode]);

	// Helpers cập nhật filter và kích hoạt lại nút bấm
	const handleCategoryChange = (catId: number | string) => {
		setDraftCategory(catId);
		setIsApplied(false);
	};

	const handlePresetChange = (newPreset: PresetFilter) => {
		setDraftPreset(newPreset);
		setIsApplied(false);
	};

	const handleMonthChange = (m: number) => {
		setDraftMonth(m);
		setIsApplied(false);
	};

	const handleYearChange = (y: number) => {
		setDraftYear(y);
		setIsApplied(false);
	};

	const handleShopInputChange = (val: string) => {
		setRawShopInput(val);
		setIsApplied(false);
	};

	const handleProductInputChange = (val: string) => {
		setRawProductInput(val);
		setIsApplied(false);
	};

	const handleModeSwitch = (newMode: AdminAnalyticsMode) => {
		setIsApplied(false);
		onModeChange(newMode);
	};

	// HÀM ÁP DỤNG DUY NHẤT: Áp dụng chung cho cả Mode, Category/ShopId/ProductId VÀ Mốc thời gian
	const handleApply = () => {
		if (isApplied) return;

		// Kiểm tra tính hợp lệ cơ bản của input
		if (mode === "shop" && !rawShopInput.trim()) {
			return;
		}
		if (mode === "product" && !rawProductInput.trim()) {
			return;
		}

		let extractedProductId: string | undefined = undefined;
		if (mode === "product") {
			const trimmed = rawProductInput.trim();
			if (trimmed) {
				const match = trimmed.match(/(?:products?\/|id=)?(\d+)/i);
				extractedProductId = match ? match[1] : trimmed.replace(/\D/g, "");
			}
		}

		const cleanShopId = mode === "shop" ? rawShopInput.trim().replace(/\D/g, "") : undefined;

		lastAppliedShopIdRef.current = cleanShopId;
		lastAppliedProductIdRef.current = extractedProductId;
		setIsApplied(true);

		onApply({
			mode,
			categoryId: mode === "category" ? draftCategory : undefined,
			shopId: cleanShopId,
			productId: extractedProductId,
			preset: draftPreset,
			month: draftMonth,
			year: draftYear,
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !isApplied) {
			e.preventDefault();
			handleApply();
		}
	};

	return (
		<div className="bg-white border border-brand-border rounded-md shadow-xs overflow-hidden">
			{/* HÀNG 1: BỘ CHUYỂN 4 CHẾ ĐỘ PHÂN TÍCH */}
			<div className="p-3 sm:p-4 border-b border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
				<div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-md border border-brand-border self-start sm:self-auto overflow-x-auto max-w-full">
					<button
						type="button"
						onClick={() => handleModeSwitch("platform")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none shrink-0 ${mode === "platform"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Globe className="w-3.5 h-3.5 text-blue-600" />
						<span>Phân tích sàn</span>
					</button>

					<button
						type="button"
						onClick={() => handleModeSwitch("category")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none shrink-0 ${mode === "category"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Layers className="w-3.5 h-3.5 text-emerald-600" />
						<span>Phân tích ngành hàng</span>
					</button>

					<button
						type="button"
						onClick={() => handleModeSwitch("shop")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none shrink-0 ${mode === "shop"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Store className="w-3.5 h-3.5 text-purple-600" />
						<span>Phân tích một shop</span>
					</button>

					<button
						type="button"
						onClick={() => handleModeSwitch("product")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none shrink-0 ${mode === "product"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Package className="w-3.5 h-3.5 text-amber-600" />
						<span>Phân tích một sản phẩm</span>
					</button>
				</div>
			</div>

			{/* HÀNG 2: THAM SỐ CỦA TỪNG CHẾ ĐỘ */}
			<div className="p-3 sm:p-4 bg-slate-50/50 space-y-4">
				{/* 1. KHI CHỌN PHÂN TÍCH NGÀNH HÀNG: DÃY RADIO CHECK CHỌN DANH MỤC CHA */}
				{mode === "category" && (
					<div className="space-y-2 animate-in fade-in duration-200">
						<div className="flex items-center justify-between gap-2">
							<span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
								Chọn ngành hàng cần phân tích:
							</span>
						</div>

						{/* [KHU VỰC TÙY CHỈNH RADIO DANH MỤC]: Giao diện Radio viền đen, nhấn vào tô màu xanh */}
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
							{categories.map((cat) => {
								const isSelected =
									String(draftCategory) === String(cat.id) ||
									(draftCategory === "all" && cat.id === "all");

								return (
									<label
										key={cat.id}
										onClick={() => handleCategoryChange(cat.id)}
										className="inline-flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer select-none group hover:bg-slate-100/80 transition-colors"
									>
										<input
											type="radio"
											name="adminCategoryFilterRadio"
											checked={isSelected}
											onChange={() => handleCategoryChange(cat.id)}
											className="sr-only"
										/>
										{/* VÒNG TRÒN RADIO: Viền đen bên ngoài, nhấn vào tô màu xanh */}
										<div
											className={`w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-emerald-600" : "bg-white"
												}`}
										>
											{isSelected && (
												<div className="w-1.5 h-1.5 rounded-full bg-white" />
											)}
										</div>

										{/* TÊN DANH MỤC: Cố định font-semibold text-slate-800 để không nhảy chữ */}
										<span className="text-xs font-semibold text-slate-800 transition-colors">
											{cat.name}
										</span>
									</label>
								);
							})}
						</div>
					</div>
				)}

				{/* 2. KHI CHỌN PHÂN TÍCH MỘT SHOP: Ô NHẬP SHOP ID (KHÔNG CÓ NÚT RIÊNG) */}
				{mode === "shop" && (
					<div className="space-y-2 animate-in fade-in duration-200">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
								Nhập mã cửa hàng (Shop ID):
							</span>
							{activeShopId && (
								<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold">
									<span>Đang xem Shop ID: #{activeShopId}</span>
									<button
										type="button"
										onClick={() => {
											handleShopInputChange("");
											setIsApplied(false);
											onApply({
												mode: "shop",
												shopId: "",
												preset: draftPreset,
												month: draftMonth,
												year: draftYear,
											});
										}}
										className="p-0.5 hover:bg-purple-200 rounded cursor-pointer border-none"
									>
										<X className="w-3 h-3 text-purple-700" />
									</button>
								</div>
							)}
						</div>

						<div className="relative max-w-2xl">
							<Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
							<input
								type="text"
								placeholder="Nhập mã định danh cửa hàng (ví dụ: 1, 4, 15) và nhấn Áp dụng bên dưới..."
								value={rawShopInput}
								onChange={(e) => handleShopInputChange(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full pl-9 pr-3 py-2 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs"
							/>
						</div>
					</div>
				)}

				{/* 3. KHI CHỌN PHÂN TÍCH MỘT SẢN PHẨM: Ô NHẬP LINK URL/ID (KHÔNG CÓ NÚT RIÊNG) */}
				{mode === "product" && (
					<div className="space-y-2 animate-in fade-in duration-200">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
								Nhập ID hoặc dán link sản phẩm:
							</span>
							{activeProductId && (
								<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
									<span>Đang soi sản phẩm: #{activeProductId}</span>
									<button
										type="button"
										onClick={() => {
											handleProductInputChange("");
											setIsApplied(false);
											onApply({
												mode: "product",
												productId: "",
												preset: draftPreset,
												month: draftMonth,
												year: draftYear,
											});
										}}
										className="p-0.5 hover:bg-amber-200 rounded cursor-pointer border-none"
									>
										<X className="w-3 h-3 text-amber-700" />
									</button>
								</div>
							)}
						</div>

						<div className="relative max-w-2xl">
							<Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
							<input
								type="text"
								placeholder="Dán link sản phẩm hoặc nhập ID: 123... và nhấn Áp dụng bên dưới"
								value={rawProductInput}
								onChange={(e) => handleProductInputChange(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full pl-9 pr-3 py-2 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
							/>
						</div>
					</div>
				)}

				{/* DÒNG 2.2: BỘ CHỌN MỐC THỜI GIAN (DÙNG CHUNG CHO TẤT CẢ CÁC CHẾ ĐỘ) */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-brand-border/60">
					<div className="flex flex-wrap items-center gap-3 text-xs">
						<div className="flex items-center gap-1.5 text-slate-500 font-black uppercase tracking-wider text-[10px]">
							<Calendar className="w-3.5 h-3.5 text-slate-500" />
							<span>Mốc thời gian:</span>
						</div>

						{/* Tùy chọn Preset dạng Radio check viền đen tô xanh */}
						<div className="flex flex-wrap items-center gap-4 text-xs">
							<label
								onClick={() => handlePresetChange("today")}
								className="inline-flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<input
									type="radio"
									name="adminPresetTimeRadio"
									checked={draftPreset === "today"}
									onChange={() => handlePresetChange("today")}
									className="sr-only"
								/>
								<div
									className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors shrink-0 ${draftPreset === "today" ? "bg-blue-600" : "bg-white"
										}`}
								>
									{draftPreset === "today" && (
										<div className="w-1.5 h-1.5 rounded-full bg-white" />
									)}
								</div>
								<span
									className={`font-semibold transition-colors ${draftPreset === "today"
											? "text-brand-dark"
											: "text-slate-600 group-hover:text-brand-dark"
										}`}
								>
									Hôm nay
								</span>
							</label>

							<label
								onClick={() => handlePresetChange("3d")}
								className="inline-flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<input
									type="radio"
									name="adminPresetTimeRadio"
									checked={draftPreset === "3d"}
									onChange={() => handlePresetChange("3d")}
									className="sr-only"
								/>
								<div
									className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors shrink-0 ${draftPreset === "3d" ? "bg-blue-600" : "bg-white"
										}`}
								>
									{draftPreset === "3d" && (
										<div className="w-1.5 h-1.5 rounded-full bg-white" />
									)}
								</div>
								<span
									className={`font-semibold transition-colors ${draftPreset === "3d"
											? "text-brand-dark"
											: "text-slate-600 group-hover:text-brand-dark"
										}`}
								>
									3 ngày qua
								</span>
							</label>

							<label
								onClick={() => handlePresetChange("week")}
								className="inline-flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<input
									type="radio"
									name="adminPresetTimeRadio"
									checked={draftPreset === "week"}
									onChange={() => handlePresetChange("week")}
									className="sr-only"
								/>
								<div
									className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors shrink-0 ${draftPreset === "week" ? "bg-blue-600" : "bg-white"
										}`}
								>
									{draftPreset === "week" && (
										<div className="w-1.5 h-1.5 rounded-full bg-white" />
									)}
								</div>
								<span
									className={`font-semibold transition-colors ${draftPreset === "week"
											? "text-brand-dark"
											: "text-slate-600 group-hover:text-brand-dark"
										}`}
								>
									7 ngày qua
								</span>
							</label>

							<label
								onClick={() => handlePresetChange("custom")}
								className="inline-flex items-center gap-1.5 cursor-pointer select-none group"
							>
								<input
									type="radio"
									name="adminPresetTimeRadio"
									checked={draftPreset === "custom"}
									onChange={() => handlePresetChange("custom")}
									className="sr-only"
								/>
								<div
									className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors shrink-0 ${draftPreset === "custom" ? "bg-blue-600" : "bg-white"
										}`}
								>
									{draftPreset === "custom" && (
										<div className="w-1.5 h-1.5 rounded-full bg-white" />
									)}
								</div>
								<span
									className={`font-semibold transition-colors ${draftPreset === "custom"
											? "text-brand-dark"
											: "text-slate-600 group-hover:text-brand-dark"
										}`}
								>
									Tùy chỉnh
								</span>
							</label>
						</div>

						{/* Khi chọn Tùy chỉnh: Dropdown chọn tháng/năm */}
						{draftPreset === "custom" && (
							<div className="flex items-center gap-2 pl-2 border-l border-slate-200 animate-in fade-in duration-150">
								<div className="flex items-center gap-1 text-xs font-bold text-slate-700">
									<span className="text-slate-500">Tháng:</span>
									<select
										value={draftMonth}
										onChange={(e) => handleMonthChange(Number(e.target.value))}
										className="px-2 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
									>
										{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
											<option key={m} value={m}>
												Tháng {m}
											</option>
										))}
									</select>
								</div>

								<div className="flex items-center gap-1 text-xs font-bold text-slate-700">
									<span className="text-slate-500">Năm:</span>
									<select
										value={draftYear}
										onChange={(e) => handleYearChange(Number(e.target.value))}
										className="px-2 py-1 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
									>
										<option value={currentYear}>{currentYear}</option>
										<option value={currentYear - 1}>{currentYear - 1}</option>
										<option value={currentYear - 2}>{currentYear - 2}</option>
									</select>
								</div>
							</div>
						)}
					</div>

					{/* NÚT HÀNH ĐỘNG CĂN PHẢI: HIỂN THỊ TRẠNG THÁI VÀ MÀU SẮC THEO TỪNG CHẾ ĐỘ */}
					<div className="flex items-center justify-end">
						{mode === "platform" && (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${
									isApplied
										? "bg-slate-200/80 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
										: "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark cursor-pointer border-transparent ring-2 ring-brand-primary/20"
								}`}
							>
								<Check className={`w-3.5 h-3.5 ${isApplied ? "text-slate-400 stroke-[2]" : "stroke-[3]"}`} />
								<span>{isApplied ? "Đã áp dụng" : "Áp dụng"}</span>
							</button>
						)}
						{mode === "category" && (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${
									isApplied
										? "bg-slate-200/80 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
										: "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-transparent ring-2 ring-emerald-500/20"
								}`}
							>
								<Check className={`w-3.5 h-3.5 ${isApplied ? "text-slate-400 stroke-[2]" : "stroke-[3]"}`} />
								<span>{isApplied ? "Đã áp dụng" : "Áp dụng"}</span>
							</button>
						)}
						{mode === "shop" && (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied || !rawShopInput.trim()}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${
									isApplied
										? "bg-slate-200/80 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
										: !rawShopInput.trim()
										? "bg-purple-300 text-white cursor-not-allowed border-transparent opacity-60"
										: "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer border-transparent ring-2 ring-purple-500/20"
								}`}
							>
								{isApplied ? (
									<Check className="w-3.5 h-3.5 stroke-[2] text-slate-400" />
								) : (
									<Store className="w-3.5 h-3.5 stroke-[2.5]" />
								)}
								<span>{isApplied ? "Đã phân tích" : "Phân tích shop"}</span>
							</button>
						)}
						{mode === "product" && (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied || !rawProductInput.trim()}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${
									isApplied
										? "bg-slate-200/80 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
										: !rawProductInput.trim()
										? "bg-amber-300 text-white cursor-not-allowed border-transparent opacity-60"
										: "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-transparent ring-2 ring-amber-500/20"
								}`}
							>
								{isApplied ? (
									<Check className="w-3.5 h-3.5 stroke-[2] text-slate-400" />
								) : (
									<Package className="w-3.5 h-3.5 stroke-[2.5]" />
								)}
								<span>{isApplied ? "Đã phân tích" : "Phân tích sản phẩm"}</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default AdminAnalyticsFilterBar;
