import { useState, useEffect, useMemo, useRef } from "react";
import {
	Store,
	Package,
	Search,
	Check,
	Calendar,
	X,
} from "lucide-react";

export type PresetFilter = "today" | "3d" | "week" | "custom";
export type SellerAnalyticsMode = "shop" | "product";

export interface FilterProductItem {
	id: string;
	name: string;
	thumbnailUrl?: string;
	revenue: number;
	soldQuantity: number;
	parentCategoryId?: number;
}

export interface SearchProductResult {
	id: string;
	name: string;
	thumbnailUrl?: string;
	sold?: number;
}

export interface AnalyticsFilterBarProps {
	mode: SellerAnalyticsMode;
	onModeChange: (mode: SellerAnalyticsMode) => void;
	preset: PresetFilter;
	selectedMonth: number;
	selectedYear: number;
	activeProductId?: string;
	onApply: (params: {
		mode: SellerAnalyticsMode;
		productId?: string;
		preset: PresetFilter;
		month: number;
		year: number;
	}) => void;
	shopId?: string | number | null;
}

export function AnalyticsFilterBar({
	mode,
	onModeChange,
	preset,
	selectedMonth,
	selectedYear,
	activeProductId,
	onApply,
}: AnalyticsFilterBarProps) {
	const currentYear = new Date().getFullYear();

	// Draft states: chỉ khi nhấn nút "Áp dụng" mới cập nhật ra ngoài
	const [draftPreset, setDraftPreset] = useState<PresetFilter>(preset);
	const [draftMonth, setDraftMonth] = useState<number>(selectedMonth);
	const [draftYear, setDraftYear] = useState<number>(selectedYear);
	const [rawProductInput, setRawProductInput] = useState(activeProductId || "");

	// Quản lý trạng thái bấm nút Áp Dụng / Phân Tích:
	// - Khi đổi filter, đổi tab: isApplied = false
	// - Ngay sau khi bấm: isApplied = true
	const [isApplied, setIsApplied] = useState(false);

	const lastAppliedProductIdRef = useRef<string | undefined>(activeProductId || undefined);

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
		const nextVal = activeProductId || "";
		setRawProductInput(nextVal);
		if (nextVal !== (lastAppliedProductIdRef.current || "")) {
			setIsApplied(false);
		}
	}, [activeProductId]);

	// Khi chuyển tab (mode thay đổi), lập tức reset lại nút
	useEffect(() => {
		setIsApplied(false);
	}, [mode]);

	// Helpers cập nhật filter và kích hoạt lại nút bấm
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

	const handleProductInputChange = (val: string) => {
		setRawProductInput(val);
		setIsApplied(false);
	};

	const handleModeSwitch = (newMode: SellerAnalyticsMode) => {
		setIsApplied(false);
		onModeChange(newMode);
	};

	// HÀM ÁP DỤNG DUY NHẤT CHO SELLER (Áp dụng chung mốc thời gian và ID sản phẩm)
	const handleApply = () => {
		if (isApplied) return;
		if (mode === "product" && !rawProductInput.trim()) return;

		let extractedProductId: string | undefined = undefined;
		if (mode === "product") {
			const trimmed = rawProductInput.trim();
			if (trimmed) {
				const match = trimmed.match(/(?:products?\/|id=)?(\d+)/i);
				extractedProductId = match ? match[1] : trimmed.replace(/\D/g, "");
			}
		}

		lastAppliedProductIdRef.current = extractedProductId;
		setIsApplied(true);

		onApply({
			mode,
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
			{/* HÀNG 1: BỘ CHUYỂN CHẾ ĐỘ PHÂN TÍCH (CỬA HÀNG / MỘT SẢN PHẨM) */}
			<div className="p-3 sm:p-4 border-b border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
				<div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-md border border-brand-border self-start sm:self-auto">
					<button
						type="button"
						onClick={() => handleModeSwitch("shop")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none ${mode === "shop"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Store className="w-3.5 h-3.5 text-purple-600" />
						<span>Phân tích cửa hàng</span>
					</button>

					<button
						type="button"
						onClick={() => handleModeSwitch("product")}
						className={`px-3 py-1.5 text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer border-none ${mode === "product"
								? "bg-white text-brand-dark shadow-xs"
								: "text-slate-600 hover:text-brand-dark bg-transparent"
							}`}
					>
						<Package className="w-3.5 h-3.5 text-amber-600" />
						<span>Phân tích một sản phẩm</span>
					</button>
				</div>

				<span className="text-[11px] text-brand-muted font-bold self-start sm:self-auto">
					{mode === "shop"
						? "Báo cáo doanh số và hiệu suất của toàn bộ cửa hàng"
						: "Soi chuyên sâu doanh thu và số lượng bán của từng sản phẩm"}
				</span>
			</div>

			{/* HÀNG 2: THAM SỐ CHẾ ĐỘ (KHI CHỌN PHÂN TÍCH MỘT SẢN PHẨM) */}
			<div className="p-3 sm:p-4 bg-slate-50/50 space-y-4">
				{mode === "product" && (
					<div className="space-y-2 animate-in fade-in duration-200">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
							<span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
								Nhập mã ID hoặc dán link sản phẩm của bạn:
							</span>
							{activeProductId && (
								<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
									<span>Đang phân tích sản phẩm: #{activeProductId}</span>
									<button
										type="button"
										onClick={() => {
											setRawProductInput("");
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
								placeholder="Nhập mã ID sản phẩm từ cửa hàng (ví dụ: 12, 105) hoặc dán link và nhấn Áp dụng..."
								value={rawProductInput}
								onChange={(e) => handleProductInputChange(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full pl-9 pr-3 py-2 bg-white border border-brand-border rounded-md text-xs font-bold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
							/>
						</div>
					</div>
				)}

				{/* HÀNG 3: MỐC THỜI GIAN HIỂN THỊ THẲNG + NÚT "ÁP DỤNG" DUY NHẤT Ở GÓC PHẢI CÙNG */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-1.5 text-xs font-black text-slate-700 shrink-0">
							<Calendar className="w-3.5 h-3.5 text-brand-muted shrink-0" />
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
									name="sellerPresetTimeRadio"
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
									name="sellerPresetTimeRadio"
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
									name="sellerPresetTimeRadio"
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
									name="sellerPresetTimeRadio"
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
									Tự chỉnh
								</span>
							</label>
						</div>

						{/* Khi chọn "Tự chỉnh": Hiển thị trực tiếp dropdown Tháng / Năm ngay cạnh dòng thời gian */}
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

					{/* NÚT HÀNH ĐỘNG CĂN PHẢI THEO CHẾ ĐỘ SELLER */}
					<div className="flex items-center justify-end">
						{mode === "shop" ? (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${isApplied
										? "bg-slate-200/80 text-slate-400 border-slate-300 cursor-not-allowed shadow-none"
										: "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark cursor-pointer border-transparent ring-2 ring-brand-primary/20"
									}`}
							>
								<Check className={`w-3.5 h-3.5 ${isApplied ? "text-slate-400 stroke-[2]" : "stroke-[3]"}`} />
								<span>{isApplied ? "Đã áp dụng" : "Áp dụng"}</span>
							</button>
						) : (
							<button
								type="button"
								onClick={handleApply}
								disabled={isApplied || !rawProductInput.trim()}
								className={`px-5 py-2 font-black text-xs rounded-md shadow-xs transition-all border flex items-center gap-1.5 select-none ${isApplied
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

export default AnalyticsFilterBar;
