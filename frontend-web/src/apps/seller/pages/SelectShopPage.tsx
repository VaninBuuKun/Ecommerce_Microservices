import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "@/components/Header";
import {
	KycUnverifiedState,
	KycSubmittedState,
	KycForm,
	KycVerifiedNoShopState,
	useSellerProfileQuery,
	useRegisterKycMutation,
	useWithdrawKycMutation,
} from "@/domains/kyc";
import { ShopSelectList, useSellerStore } from "@/domains/seller";

export default function SelectShopPage() {
	const navigate = useNavigate();
	const { data: profile, isLoading } = useSellerProfileQuery();
	const registerKycMutation = useRegisterKycMutation();
	const withdrawKycMutation = useWithdrawKycMutation();

	const { setActiveShop } = useSellerStore();
	const shops = profile?.shops ?? [];
	const kyc = (profile?.kyc as any) ?? null;

	const [showKycForm, setShowKycForm] = useState(false);
	const [identityNumber, setIdentityNumber] = useState("");
	const [identityFront, setIdentityFront] = useState("");
	const [identityBack, setIdentityBack] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);

	useEffect(() => {
		if (kyc) {
			const idNum = kyc.identityCardNumber || kyc.idCardNumber;
			const idFront = kyc.identityCardFrontUrl || kyc.idCardFrontUrl;
			const idBack = kyc.identityCardBackUrl || kyc.idCardBackUrl;

			if (idNum) setIdentityNumber(idNum);
			if (idFront) setIdentityFront(idFront);
			if (idBack) setIdentityBack(idBack);
		}
	}, [kyc]);

	useEffect(() => {
		if (kyc?.status === "Draft" || kyc?.status === "Rejected") {
			setShowKycForm(true);
		} else if (kyc?.status === "Submitted" || kyc?.status === "Verified") {
			setShowKycForm(false);
		}
	}, [kyc?.status]);

	const handleSelectShop = (shop: any) => {
		if (setActiveShop) setActiveShop(shop);
		navigate(`/seller/${shop.id}/dashboard`);
	};

	const validateForm = () => {
		if (!identityNumber.trim()) {
			toast.warning("Vui lòng nhập số CMND/CCCD!");
			return false;
		}
		if (!identityFront || !identityBack) {
			toast.warning("Vui lòng tải lên đầy đủ ảnh mặt trước và mặt sau CCCD!");
			return false;
		}
		return true;
	};

	const handleSaveDraft = async () => {
		if (!validateForm()) return;
		setIsSubmitting(true);
		try {
			await registerKycMutation.mutateAsync({
				identityCardNumber: identityNumber,
				identityCardFrontUrl: identityFront,
				identityCardBackUrl: identityBack,
				isDraft: true,
			});
			toast.success("Đã cập nhật bản nháp KYC thành công!");
		} catch (err: any) {
			toast.error(err?.response?.data || "Có lỗi xảy ra khi lưu bản nháp KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenSubmitModal = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		setShowSubmitModal(true);
	};

	const handleConfirmSubmit = async () => {
		setShowSubmitModal(false);
		setIsSubmitting(true);
		try {
			await registerKycMutation.mutateAsync({
				identityCardNumber: identityNumber,
				identityCardFrontUrl: identityFront,
				identityCardBackUrl: identityBack,
				isDraft: false,
			});
			toast.success("Đã gửi hồ sơ KYC thành công! Vui lòng chờ quản trị viên duyệt.");
			setShowKycForm(false);
		} catch (err: any) {
			toast.error(err?.response?.data || "Có lỗi xảy ra khi gửi hồ sơ KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmWithdraw = async () => {
		setShowWithdrawModal(false);
		setIsSubmitting(true);
		try {
			await withdrawKycMutation.mutateAsync();
			toast.info("Đã rút hồ sơ KYC thành công. Bạn có thể chỉnh sửa lại thông tin.");
			setShowKycForm(true);
		} catch (err: any) {
			toast.error(err?.response?.data || "Có lỗi xảy ra khi rút hồ sơ KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const kycStatus = kyc?.status;

	return (
		<div className="min-h-screen bg-brand-light-soft flex flex-col font-sans">
			<Header />

			<main className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-sm p-6 relative">
					{isLoading ? (
						<div className="py-12 text-center text-xs text-brand-muted flex flex-col items-center gap-2">
							<div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
							Đang tải thông tin xác minh...
						</div>
					) : (
						<>
							{!kyc && !showKycForm && (
								<KycUnverifiedState
									onBack={() => navigate("/")}
									onProceed={() => setShowKycForm(true)}
								/>
							)}

							{kycStatus === "Submitted" && !showKycForm && (
								<KycSubmittedState
									kyc={kyc}
									isSubmitting={isSubmitting}
									onBack={() => navigate("/")}
									onWithdraw={() =>
										setShowWithdrawModal(true)
									}
								/>
							)}

							{showKycForm &&
								(kycStatus === "Draft" ||
									kycStatus === "Rejected" ||
									!kycStatus) && (
									<KycForm
										kycStatus={kycStatus}
										rejectReason={kyc?.rejectReason}
										identityNumber={identityNumber}
										setIdentityNumber={setIdentityNumber}
										identityFront={identityFront}
										setIdentityFront={setIdentityFront}
										identityBack={identityBack}
										setIdentityBack={setIdentityBack}
										isSubmitting={isSubmitting}
										onBack={() => navigate("/")}
										onSaveDraft={handleSaveDraft}
										onSubmit={handleOpenSubmitModal}
									/>
								)}

							{kycStatus === "Verified" && shops.length === 0 && (
								<KycVerifiedNoShopState
									onBack={() => navigate("/")}
									onRegisterShop={() =>
										navigate("/seller/register")
									}
								/>
							)}

							{kycStatus === "Verified" && shops.length > 0 && (
								<ShopSelectList
									shops={shops}
									onSelectShop={handleSelectShop}
									onCreateShop={() =>
										navigate("/seller/register")
									}
								/>
							)}
						</>
					)}
				</div>
			</main>

			{showSubmitModal &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-black/50 flex items-center justify-center p-4">
						<div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl text-left">
							<h3 className="text-sm font-bold text-brand-dark">
								Xác nhận gửi hồ sơ KYC
							</h3>
							<p className="text-xs text-brand-muted leading-relaxed">
								Bạn có chắc chắn muốn gửi thông tin định danh
								này không? Hồ sơ sẽ được chuyển cho quản trị
								viên xét duyệt.
							</p>
							<div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setShowSubmitModal(false)}
									className="px-3 py-1.5 border border-brand-border rounded text-xs text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
								>
									Hủy
								</button>
								<button
									type="button"
									onClick={handleConfirmSubmit}
									disabled={isSubmitting}
									className="px-3.5 py-1.5 bg-brand-primary font-bold text-xs rounded text-brand-dark hover:bg-brand-primary-deep transition-colors cursor-pointer"
								>
									{isSubmitting
										? "Đang gửi..."
										: "Đồng ý gửi"}
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}

			{showWithdrawModal &&
				createPortal(
					<div className="fixed inset-0 z-10000 bg-black/50 flex items-center justify-center p-4">
						<div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl text-left">
							<h3 className="text-sm font-bold text-brand-dark">
								Xác nhận rút hồ sơ
							</h3>
							<p className="text-xs text-brand-muted leading-relaxed">
								Bạn có muốn rút lại hồ sơ đăng ký KYC để chỉnh
								sửa thông tin không?
							</p>
							<div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
								<button
									type="button"
									onClick={() => setShowWithdrawModal(false)}
									className="px-3 py-1.5 border border-brand-border rounded text-xs text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
								>
									Hủy
								</button>
								<button
									type="button"
									onClick={handleConfirmWithdraw}
									disabled={isSubmitting}
									className="px-3.5 py-1.5 bg-red-600 font-bold text-xs rounded text-white hover:bg-red-700 transition-colors cursor-pointer"
								>
									{isSubmitting
										? "Đang rút..."
										: "Xác nhận rút"}
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
