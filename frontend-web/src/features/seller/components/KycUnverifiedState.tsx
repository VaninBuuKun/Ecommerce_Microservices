import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface Props {
	onBack: () => void;
	onProceed: () => void;
}

export const KycUnverifiedState: React.FC<Props> = ({ onBack, onProceed }) => {
	return (
		<div className="text-center py-4">
			<div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
				<ShieldAlert className="w-6 h-6 text-amber-500" />
			</div>
			<h2 className="text-base font-bold text-brand-dark mb-2">
				Xác minh định danh
			</h2>
			<p className="text-xs text-brand-muted mb-6 leading-relaxed">
				Nhập thông tin định danh để trở thành người bán trên BuuStore.
			</p>

			<div className="flex gap-3 justify-center">
				<button
					type="button"
					onClick={onBack}
					className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Quay lại
				</button>
				<button
					type="button"
					onClick={onProceed}
					className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
				>
					Tiến hành
				</button>
			</div>
		</div>
	);
};
