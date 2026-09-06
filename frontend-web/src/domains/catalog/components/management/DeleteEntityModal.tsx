import React from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteEntityModalProps {
	isOpen: boolean;
	title: string;
	entityName: string;
	entityId?: string;
	warningNote?: string;
	isLoading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const DeleteEntityModal: React.FC<DeleteEntityModalProps> = ({
	isOpen,
	title,
	entityName,
	entityId,
	warningNote,
	isLoading = false,
	onConfirm,
	onCancel,
}) => {
	if (!isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-left animate-in fade-in duration-200">
			<div className="bg-white border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
				<button
					type="button"
					onClick={onCancel}
					disabled={isLoading}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg border-none bg-transparent cursor-pointer disabled:opacity-50"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="flex items-center gap-3 text-red-600">
					<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
						<Trash2 className="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h3 className="text-base font-bold text-brand-dark">{title}</h3>
						<span className="text-xs text-brand-muted">Thao tác này sẽ cập nhật dữ liệu trực tiếp trên hệ thống</span>
					</div>
				</div>

				<div className="space-y-3 text-xs">
					<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
						<div className="text-slate-600">
							Đối tượng: <strong className="text-brand-dark">{entityName}</strong>
						</div>
						{entityId && (
							<div className="text-[11px] text-brand-muted flex items-center gap-1.5 font-mono">
								ID: <span className="bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800">{entityId}</span>
							</div>
						)}
					</div>

					<div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-amber-900 leading-relaxed">
						<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
						<span>
							{warningNote || "Mục này đã được lưu trong cơ sở dữ liệu. Hệ thống sẽ kiểm tra các đơn hàng đang xử lý và ràng buộc dữ liệu liên quan trước khi xóa."}
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onCancel}
						disabled={isLoading}
						className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
					>
						Hủy bỏ
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isLoading}
						className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					>
						{isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						Xác nhận xóa
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};
