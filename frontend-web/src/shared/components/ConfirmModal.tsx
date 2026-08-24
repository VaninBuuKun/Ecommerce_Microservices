import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isConfirming?: boolean;
	variant?: "info" | "warning" | "danger" | "success";
}


export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	confirmText = "Xác nhận",
	cancelText = "Hủy",
	onConfirm,
	onCancel,
	isConfirming = false,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop Overlay */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
				onClick={onCancel}
			/>

			{/* Modal Card */}
			<div className="relative bg-white border border-brand-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 flex flex-col text-left">
				{/* Header */}
				<div className="flex items-center justify-between p-4 pb-2 border-b border-brand-border/60">
					<div className="flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
						<h3 className="text-sm font-extrabold text-brand-dark">
							{title}
						</h3>
					</div>
					<button
						type="button"
						onClick={onCancel}
						className="p-1 hover:bg-gray-100 rounded-lg text-brand-muted hover:text-brand-dark transition-colors cursor-pointer border-none bg-transparent"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Content Body */}
				<div className="p-4 py-5 text-xs font-semibold text-brand-muted leading-relaxed">
					{message}
				</div>

				{/* Footer Actions */}
				<div className="flex items-center justify-end gap-2.5 p-3.5 bg-brand-light-soft/50 border-t border-brand-border/60">
					<button
						type="button"
						disabled={isConfirming}
						onClick={onCancel}
						className="px-3.5 h-8 border border-brand-border bg-white hover:bg-gray-50 text-brand-dark rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
					>
						{cancelText}
					</button>
					<button
						type="button"
						disabled={isConfirming}
						onClick={onConfirm}
						className="px-4 h-8 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
					>
						{isConfirming ? "Đang xử lý..." : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};
