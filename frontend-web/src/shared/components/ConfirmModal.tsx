import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isConfirming?: boolean;
	variant?: "warning" | "danger" | "info" | "success";
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
	variant = "warning",
}) => {
	if (!isOpen) return null;

	const getIcon = () => {
		switch (variant) {
			case "danger":
				return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
			case "info":
				return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
			case "success":
				return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
			default:
				return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
		}
	};

	const getConfirmBtnClass = () => {
		switch (variant) {
			case "danger":
				return "bg-rose-600 hover:bg-rose-700 text-white font-extrabold";
			case "info":
				return "bg-blue-600 hover:bg-blue-700 text-white font-extrabold";
			case "success":
				return "bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold";
			default:
				return "bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-extrabold";
		}
	};

	return createPortal(
		<div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
			{/* Backdrop Overlay */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
				onClick={onCancel}
			/>

			{/* Modal Card */}
			<div className="relative bg-white border border-brand-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-200 scale-100 flex flex-col text-left z-10 animate-in zoom-in-95">
				{/* Header */}
				<div className="flex items-center justify-between p-4 pb-2.5 border-b border-brand-border/60">
					<div className="flex items-center gap-2">
						{getIcon()}
						<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">
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
				<div className="p-4 py-4 text-xs font-medium text-brand-dark leading-relaxed">
					{message}
				</div>

				{/* Footer Actions */}
				<div className="flex items-center justify-end gap-2 p-3 bg-brand-light-soft/50 border-t border-brand-border/60">
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
						className={`px-4 h-8 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center ${getConfirmBtnClass()}`}
					>
						{isConfirming ? "Đang xử lý..." : confirmText}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
