import React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

interface DiscardChangesModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
	isOpen,
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
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg border-none bg-transparent cursor-pointer"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="flex items-center gap-3 text-red-600">
					<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
						<AlertCircle className="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h3 className="text-base font-bold text-brand-dark">
							Hủy bỏ các thay đổi?
						</h3>
						<span className="text-xs text-brand-muted">
							Bạn có những thay đổi chưa được lưu
						</span>
					</div>
				</div>

				<div className="p-3.5 bg-red-50/60 border border-red-200/80 rounded-xl text-xs text-red-950 leading-relaxed space-y-1.5">
					<p>
						Hệ thống phát hiện có thông tin đã được chỉnh sửa nhưng chưa lưu.
					</p>
					<p className="font-semibold text-red-800">
						Nếu tiếp tục rời khỏi trang, toàn bộ thông tin thay đổi ở tất cả các tab sẽ bị mất. Bạn có chắc chắn muốn hủy bỏ?
					</p>
				</div>

				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer border-none"
					>
						Tiếp tục chỉnh sửa
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer border-none shadow-xs"
					>
						Hủy bỏ & Rời đi
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};
