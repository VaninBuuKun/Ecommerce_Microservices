import React from "react";
import { ShieldAlert, AlertCircle, ArrowLeft, Save, Send } from "lucide-react";
import { UploadImage } from "../../../shared";

interface Props {
	kycStatus?: string;
	rejectReason?: string;
	identityNumber: string;
	setIdentityNumber: (val: string) => void;
	identityFront: string;
	setIdentityFront: (val: string) => void;
	identityBack: string;
	setIdentityBack: (val: string) => void;
	isSubmitting: boolean;
	onBack: () => void;
	onSaveDraft: () => void;
	onSubmit: (e: React.FormEvent) => void;
}

export const KycForm: React.FC<Props> = ({
	kycStatus,
	rejectReason,
	identityNumber,
	setIdentityNumber,
	identityFront,
	setIdentityFront,
	identityBack,
	setIdentityBack,
	isSubmitting,
	onBack,
	onSaveDraft,
	onSubmit,
}) => {
	return (
		<form onSubmit={onSubmit} className="space-y-4 text-left">
			<div className="flex items-center justify-between pb-3 border-b border-brand-border">
				<h2 className="text-sm font-bold text-brand-primary-deep flex items-center gap-1.5">
					<ShieldAlert className="w-4 h-4 text-brand-primary-deep" />
					Thông tin định danh người bán
				</h2>
				{kycStatus === "Draft" && (
					<span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
						Bản nháp
					</span>
				)}
			</div>

			{kycStatus === "Rejected" && rejectReason && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
					<AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
					<div>
						<span className="font-bold">
							Lý do từ chối trước đó:
						</span>
						<p className="mt-0.5 text-[11px]">{rejectReason}</p>
					</div>
				</div>
			)}

			{/* Input Số CCCD */}
			<div>
				<label className="block text-xs font-bold text-brand-dark mb-1">
					Số CMND/CCCD <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					placeholder="Nhập số CMND/CCCD..."
					value={identityNumber}
					onChange={(e) => setIdentityNumber(e.target.value)}
					className="w-full h-9 px-3 bg-brand-light-soft border border-brand-border rounded text-xs focus:outline-none focus:border-brand-primary text-brand-dark"
				/>
			</div>

			{/* Upload 2 mặt CCCD */}
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="block text-[11px] font-bold text-brand-dark mb-1.5">
						Ảnh chụp mặt trước CCCD
					</label>
					<UploadImage
						value={identityFront}
						onChange={setIdentityFront}
					/>
				</div>
				<div>
					<label className="block text-[11px] font-bold text-brand-dark mb-1.5">
						Ảnh chụp mặt sau CCCD
					</label>
					<UploadImage
						value={identityBack}
						onChange={setIdentityBack}
					/>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-between items-center border-t border-brand-border pt-4 mt-4">
				<button
					type="button"
					onClick={onBack}
					className="px-3.5 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					Quay lại
				</button>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={onSaveDraft}
						disabled={isSubmitting}
						className="px-3.5 py-2 border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs rounded hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
					>
						<Save className="w-3.5 h-3.5" />
						Cập nhật
					</button>

					{/* Đã gỡ onClick={onSubmit} ở đây */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer flex items-center gap-1"
					>
						<Send className="w-3.5 h-3.5" />
						Tiến hành gửi
					</button>
				</div>
			</div>
		</form>
	);
};
