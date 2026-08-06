import React from "react";
import { Clock, ArrowLeft, Edit3 } from "lucide-react";

interface Props {
	kyc: any;
	isSubmitting: boolean;
	onBack: () => void;
	onWithdraw: () => void;
}

export const KycSubmittedState: React.FC<Props> = ({
	kyc,
	isSubmitting,
	onBack,
	onWithdraw,
}) => {
	return (
		<div className="text-center py-4">
			<div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
				<Clock className="w-6 h-6 text-blue-500 animate-pulse" />
			</div>
			<div className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full mb-3">
				Đang chờ xét duyệt
			</div>
			<h2 className="text-base font-bold text-brand-dark mb-2">
				Hồ sơ KYC đã được gửi
			</h2>
			<p className="text-xs text-brand-muted mb-6 leading-relaxed bg-blue-50/60 border border-blue-100 p-3 rounded-lg text-left">
				Bạn đã gửi thông tin định danh cho admin. Admin xác nhận bạn sẽ
				trở thành người bán trên BuuStore.
			</p>

			{/* Tóm tắt thông tin đã gửi */}
			<div className="bg-brand-light-soft p-3 rounded-lg border border-brand-border text-left mb-6 text-xs space-y-2">
				<div className="flex justify-between">
					<span className="text-brand-muted">Số CMND/CCCD:</span>
					<span className="font-semibold text-brand-dark">
						{kyc?.identityCardNumber}
					</span>
				</div>
				<div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-border">
					<div>
						<span className="block text-[10px] text-brand-muted mb-1">
							Mặt trước:
						</span>
						{kyc?.identityCardFrontUrl && (
							<img
								src={kyc.identityCardFrontUrl}
								alt="Front"
								className="w-full h-20 object-cover rounded border border-brand-border"
							/>
						)}
					</div>
					<div>
						<span className="block text-[10px] text-brand-muted mb-1">
							Mặt sau:
						</span>
						{kyc?.identityCardBackUrl && (
							<img
								src={kyc.identityCardBackUrl}
								alt="Back"
								className="w-full h-20 object-cover rounded border border-brand-border"
							/>
						)}
					</div>
				</div>
			</div>

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
					onClick={onWithdraw}
					disabled={isSubmitting}
					className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
				>
					<Edit3 className="w-3.5 h-3.5" />
					Chỉnh sửa / Rút lại
				</button>
			</div>
		</div>
	);
};
