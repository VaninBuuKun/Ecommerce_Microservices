import { createPortal } from "react-dom";
import { Loader2, Package, Sparkles, Scale, Box } from "lucide-react";
import { Badge } from "@/shared/components";

interface PackageReadyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: () => void;
	weight: number;
	setWeight: (w: number) => void;
	length: number;
	setLength: (l: number) => void;
	width: number;
	setWidth: (w: number) => void;
	height: number;
	setHeight: (h: number) => void;
	isPending: boolean;
}

export function PackageReadyModal({
	isOpen,
	onClose,
	onSubmit,
	weight,
	setWeight,
	length,
	setLength,
	width,
	setWidth,
	height,
	setHeight,
	isPending,
}: PackageReadyModalProps) {
	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
			<div className="bg-white border border-brand-border rounded-md shadow-2xl w-full max-w-md overflow-hidden text-left font-sans">
				{/* Header */}
				<div className="p-4 border-b border-brand-border bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-md bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
							<Package className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-black text-brand-dark">Xác Nhận Đóng Gói Đơn Hàng</h3>
							<p className="text-[11px] font-semibold text-brand-muted">Chuẩn bị kiện hàng sẵn sàng giao cho ĐVVC</p>
						</div>
					</div>
				</div>

				{/* Body */}
				<div className="p-5 space-y-4">

					<div className="grid grid-cols-2 gap-3.5 text-xs">
						<div className="space-y-1.5">
							<label className="flex items-center gap-1.5 font-bold text-brand-dark">
								<Scale className="w-3.5 h-3.5 text-purple-600" />
								Cân nặng (grams) <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="number"
									min={1}
									value={weight}
									onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
									className="w-full h-9 px-3 pr-10 border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted">
									g
								</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="flex items-center gap-1.5 font-bold text-brand-dark">
								<Box className="w-3.5 h-3.5 text-purple-600" />
								Chiều dài (cm) <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="number"
									min={1}
									value={length}
									onChange={(e) => setLength(Math.max(1, Number(e.target.value)))}
									className="w-full h-9 px-3 pr-10 border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted">
									cm
								</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="flex items-center gap-1.5 font-bold text-brand-dark">
								<Box className="w-3.5 h-3.5 text-purple-600" />
								Chiều rộng (cm) <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="number"
									min={1}
									value={width}
									onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
									className="w-full h-9 px-3 pr-10 border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted">
									cm
								</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="flex items-center gap-1.5 font-bold text-brand-dark">
								<Box className="w-3.5 h-3.5 text-purple-600" />
								Chiều cao (cm) <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="number"
									min={1}
									value={height}
									onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
									className="w-full h-9 px-3 pr-10 border border-brand-border rounded-md text-xs font-bold text-brand-dark focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted">
									cm
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 bg-brand-light-soft/40 border-t border-brand-border flex items-center justify-end gap-2.5">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
					>
						Hủy bỏ
					</button>
					<button
						type="button"
						onClick={onSubmit}
						disabled={isPending}
						className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-md text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-purple-200"
					>
						{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						Xác nhận đóng gói xong
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
}
export default PackageReadyModal;
