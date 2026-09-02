import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (reason: string) => void;
	cancelReason?: string;
	setCancelReason?: (reason: string) => void;
	isPending: boolean;
}

export function CancelOrderModal({
	isOpen,
	onClose,
	onSubmit,
	cancelReason: externalCancelReason,
	setCancelReason: externalSetCancelReason,
	isPending
}: CancelOrderModalProps) {
	const [internalReason, setInternalReason] = useState("");

	useEffect(() => {
		if (isOpen) {
			setInternalReason(externalCancelReason || "");
		}
	}, [isOpen, externalCancelReason]);

	if (!isOpen) return null;

	const currentReason = externalCancelReason !== undefined ? externalCancelReason : internalReason;
	const handleReasonChange = (val: string) => {
		if (externalSetCancelReason) {
			externalSetCancelReason(val);
		} else {
			setInternalReason(val);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white border border-brand-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-left font-sans">
				<div className="p-4 border-b border-brand-border bg-red-50 text-red-900 font-bold flex items-center gap-2">
					<AlertTriangle className="w-5 h-5 text-red-600" />
					Hủy đơn hàng con
				</div>
				<div className="p-4 space-y-3.5">
					<p className="text-xs text-brand-muted leading-relaxed">
						Vui lòng nhập lý do từ chối/hủy đơn hàng này để thông báo cho khách hàng:
					</p>
					<textarea
						rows={3}
						placeholder="Ví dụ: Sản phẩm hết hàng đột xuất, gặp sự cố kho..."
						value={currentReason}
						onChange={(e) => handleReasonChange(e.target.value)}
						className="w-full p-2.5 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary"
					/>
				</div>
				<div className="p-4 bg-brand-light-soft/50 border-t border-brand-border flex justify-end gap-2.5">
					<button
						onClick={onClose}
						className="px-3.5 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
					>
						Đóng
					</button>
					<button
						onClick={() => onSubmit(currentReason)}
						disabled={isPending}
						className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
					>
						{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						Xác nhận hủy
					</button>
				</div>
			</div>
		</div>
	);
}
