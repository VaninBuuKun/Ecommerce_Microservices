import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface VariantSwitchWarningModalProps {
	isOpen: boolean;
	targetIsMultiple: boolean;
	onConfirm: (dontShowAgain: boolean) => void;
	onCancel: () => void;
}

export const VariantSwitchWarningModal: React.FC<VariantSwitchWarningModalProps> = ({
	isOpen,
	targetIsMultiple,
	onConfirm,
	onCancel,
}) => {
	const [dontShowAgain, setDontShowAgain] = useState(false);

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

				<div className="flex items-center gap-3 text-amber-600">
					<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
						<AlertTriangle className="w-5 h-5 text-amber-600" />
					</div>
					<div>
						<h3 className="text-base font-bold text-brand-dark">
							Xác nhận thay đổi mô hình biến thể
						</h3>
						<span className="text-xs text-brand-muted">
							Vui lòng kiểm tra kỹ trước khi cập nhật
						</span>
					</div>
				</div>

				<div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-950 leading-relaxed">
					{targetIsMultiple ? (
						<p>
							Bạn đang chuyển từ <strong>sản phẩm đơn lẻ</strong> sang <strong>sản phẩm có nhiều phân loại (biến thể)</strong>. Toàn bộ đơn giá và kho hàng đơn lẻ ban đầu sẽ được thay thế bằng danh sách biến thể mới.
						</p>
					) : (
						<p>
							Bạn đang chuyển từ <strong>nhiều phân loại</strong> về lại <strong>sản phẩm đơn lẻ</strong>. Toàn bộ danh sách phân loại và biến thể chi tiết trước đó sẽ bị gỡ bỏ để áp dụng đơn giá và kho hàng duy nhất.
						</p>
					)}
				</div>

				{/* Checkbox "Không hiển thị lại" */}
				<div className="flex items-center gap-2 pt-1">
					<input
						type="checkbox"
						id="dont-show-variant-switch"
						checked={dontShowAgain}
						onChange={(e) => setDontShowAgain(e.target.checked)}
						className="w-4 h-4 accent-brand-primary rounded cursor-pointer"
					/>
					<label
						htmlFor="dont-show-variant-switch"
						className="text-xs text-brand-muted select-none cursor-pointer"
					>
						Không hiển thị cảnh báo này lần sau
					</label>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
					>
						Hủy bỏ
					</button>
					<button
						type="button"
						onClick={() => onConfirm(dontShowAgain)}
						className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-xs border-none cursor-pointer"
					>
						Xác nhận lưu
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};
