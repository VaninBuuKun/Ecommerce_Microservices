import { Loader2, Package } from "lucide-react";

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
	isPending
}: PackageReadyModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white border border-brand-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-left font-sans">
				<div className="p-4 border-b border-brand-border bg-purple-50 text-purple-900 font-bold flex items-center gap-2">
					<Package className="w-5 h-5 text-purple-600" />
					Thông số đóng gói hàng
				</div>
				<div className="p-4 space-y-4">
					<p className="text-xs text-brand-muted leading-relaxed">
						Nhập các thông số kích thước, cân nặng thực tế của gói hàng để bàn giao cho hãng vận chuyển:
					</p>
					<div className="grid grid-cols-2 gap-3 text-xs">
						<div>
							<label className="block font-bold text-brand-dark mb-1">Cân nặng (grams)</label>
							<input
								type="number"
								value={weight}
								onChange={(e) => setWeight(Number(e.target.value))}
								className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs focus:outline-none"
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">Chiều dài (cm)</label>
							<input
								type="number"
								value={length}
								onChange={(e) => setLength(Number(e.target.value))}
								className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs focus:outline-none"
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">Chiều rộng (cm)</label>
							<input
								type="number"
								value={width}
								onChange={(e) => setWidth(Number(e.target.value))}
								className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs focus:outline-none"
							/>
						</div>
						<div>
							<label className="block font-bold text-brand-dark mb-1">Chiều cao (cm)</label>
							<input
								type="number"
								value={height}
								onChange={(e) => setHeight(Number(e.target.value))}
								className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs focus:outline-none"
							/>
						</div>
					</div>
				</div>
				<div className="p-4 bg-brand-light-soft/50 border-t border-brand-border flex justify-end gap-2.5">
					<button
						onClick={onClose}
						className="px-3.5 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
					>
						Đóng
					</button>
					<button
						onClick={onSubmit}
						disabled={isPending}
						className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
					>
						{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						Xác nhận đóng gói
					</button>
				</div>
			</div>
		</div>
	);
}
