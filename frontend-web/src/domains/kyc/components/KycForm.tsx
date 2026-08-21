import React, { useState } from "react";
import { ShieldAlert, AlertCircle, ArrowLeft, Save, Send, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { UploadImage } from "@/shared";
import { useWalletQuery } from "@/domains/order";

const kycSchema = z.object({
	identityNumber: z
		.string()
		.nonempty("Vui lòng nhập số CMND/CCCD.")
		.regex(/^\d+$/, "Số CMND/CCCD phải bao gồm tất cả là các chữ số."),
	identityFront: z.string().nonempty("Vui lòng tải lên ảnh mặt trước CCCD."),
	identityBack: z.string().nonempty("Vui lòng tải lên ảnh mặt sau CCCD."),
});

type KycFormData = z.infer<typeof kycSchema>;

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
	const navigate = useNavigate();
	const { data: wallet, isLoading: walletLoading, error: walletError } = useWalletQuery();
	const [showWalletModal, setShowWalletModal] = useState(false);

	const hasWallet = !!wallet && !walletError;

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<KycFormData>({
		resolver: zodResolver(kycSchema),
		defaultValues: {
			identityNumber: identityNumber || "",
			identityFront: identityFront || "",
			identityBack: identityBack || "",
		},
	});

	const handleFormSubmit = (data: KycFormData, e?: React.BaseSyntheticEvent) => {
		if (!walletLoading && !hasWallet) {
			setShowWalletModal(true);
			return;
		}
		if (e) onSubmit(e);
	};

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left font-sans">
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
						<span className="font-bold">Lý do từ chối trước đó:</span>
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
					placeholder="Nhập số CMND/CCCD (chỉ gồm các chữ số)..."
					{...register("identityNumber", {
						onChange: (e) => setIdentityNumber(e.target.value),
					})}
					className={`w-full h-9 px-3 bg-brand-light-soft border rounded text-xs focus:outline-none text-brand-dark ${
						errors.identityNumber ? "border-red-500 focus:border-red-500" : "border-brand-border focus:border-brand-primary"
					}`}
				/>
				{errors.identityNumber && (
					<p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
						<AlertCircle className="w-3 h-3 shrink-0" />
						{errors.identityNumber.message}
					</p>
				)}
			</div>

			{/* Upload 2 mặt CCCD */}
			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="block text-[11px] font-bold text-brand-dark mb-1.5">
						Ảnh chụp mặt trước CCCD <span className="text-red-500">*</span>
					</label>
					<UploadImage
						value={identityFront}
						onChange={(val) => {
							setIdentityFront(val);
							setValue("identityFront", val, { shouldValidate: true });
						}}
					/>
					{errors.identityFront && (
						<p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
							<AlertCircle className="w-3 h-3 shrink-0" />
							{errors.identityFront.message}
						</p>
					)}
				</div>
				<div>
					<label className="block text-[11px] font-bold text-brand-dark mb-1.5">
						Ảnh chụp mặt sau CCCD <span className="text-red-500">*</span>
					</label>
					<UploadImage
						value={identityBack}
						onChange={(val) => {
							setIdentityBack(val);
							setValue("identityBack", val, { shouldValidate: true });
						}}
					/>
					{errors.identityBack && (
						<p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
							<AlertCircle className="w-3 h-3 shrink-0" />
							{errors.identityBack.message}
						</p>
					)}
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

			{/* Modal thông báo cần đăng ký ví trước khi gửi KYC */}
			{showWalletModal && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-left font-sans">
						<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
							<AlertCircle className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-sm font-black text-brand-dark uppercase tracking-wide">
								Yêu cầu kích hoạt ví điện tử
							</h3>
							<p className="text-xs text-brand-muted mt-1 leading-relaxed">
								Bạn chưa kích hoạt ví điện tử liên kết. Vui lòng hoàn tất kích hoạt ví điện tử trước khi nộp hồ sơ xác minh định danh (KYC).
							</p>
						</div>
						<div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
							<button
								type="button"
								onClick={() => setShowWalletModal(false)}
								className="px-3.5 py-2 border border-brand-border rounded-xl text-xs font-bold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
							>
								Đóng
							</button>
							<button
								type="button"
								onClick={() => navigate("/profile?tab=wallet")}
								className="px-4 py-2 bg-brand-dark text-white hover:bg-brand-primary hover:text-brand-dark font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
							>
								<CreditCard className="w-3.5 h-3.5" />
								Đến trang quản lý ví
							</button>
						</div>
					</div>
				</div>
			)}
		</form>
	);
};