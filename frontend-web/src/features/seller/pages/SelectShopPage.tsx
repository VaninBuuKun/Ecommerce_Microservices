import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import { useSellerStore } from "../stores";
import type { Shop } from "../types";
import {
	KycUnverifiedState,
	KycSubmittedState,
	KycForm,
	KycVerifiedNoShopState,
	ShopSelectList,
} from "../components";
import { useSellerProfileQuery } from "../hooks";
import { useRegisterKycMutation } from "../hooks";
import { useWithdrawKycMutation } from "../hooks";

export default function SelectShopPage() {
	const navigate = useNavigate();
	const { data: profile, isLoading } = useSellerProfileQuery();
	const registerKycMutation = useRegisterKycMutation();
	const withdrawKycMutation = useWithdrawKycMutation();

	const { setActiveShop } = useSellerStore();
	const shops = profile?.shops ?? [];
	const kyc = profile?.kyc ?? null;

	const [showKycForm, setShowKycForm] = useState(false);
	const [identityNumber, setIdentityNumber] = useState("");
	const [identityFront, setIdentityFront] = useState("");
	const [identityBack, setIdentityBack] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);

	useEffect(() => {
		if (kyc) {
			if (kyc.identityCardNumber)
				setIdentityNumber(kyc.identityCardNumber);
			if (kyc.identityCardFrontUrl)
				setIdentityFront(kyc.identityCardFrontUrl);
			if (kyc.identityCardBackUrl)
				setIdentityBack(kyc.identityCardBackUrl);
			if (kyc.status === "Draft" || kyc.status === "Rejected") {
				setShowKycForm(true);
			} else {
				setShowKycForm(false);
			}
		}
	}, [kyc]);

	const handleSelectShop = (shop: Shop) => {
		if (setActiveShop) setActiveShop(shop);
		navigate(`/seller/${shop.id}/dashboard`);
	};

	const validateForm = () => {
		if (!identityNumber.trim()) {
			alert("Vui lòng nhập số CMND/CCCD!");
			return false;
		}
		if (!identityFront || !identityBack) {
			alert("Vui lòng tải lên đầy đủ ảnh mặt trước và mặt sau CCCD!");
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
			alert("Đã cập nhật bản nháp KYC thành công!");
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi lưu bản nháp KYC.");
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
			setShowKycForm(false);
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi gửi hồ sơ KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmWithdraw = async () => {
		setShowWithdrawModal(false);
		setIsSubmitting(true);
		try {
			await withdrawKycMutation.mutateAsync();
			setShowKycForm(true);
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi rút hồ sơ KYC.");
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
							{/* THƯỜNG HỢP 1: CHƯA KYC & CHƯA MỞ FORM */}
							{!kyc && !showKycForm && (
								<KycUnverifiedState
									onBack={() => navigate("/")}
									onProceed={() => setShowKycForm(true)}
								/>
							)}

							{/* THƯỜNG HỢP 2: ĐÃ GỬI (SUBMITTED / PENDING) */}
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

							{/* THƯỜNG HỢP 3: FORM NHẬP KYC */}
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

							{/* THƯỜNG HỢP 4: ĐÃ VERIFIED - CHƯA CÓ SHOP */}
							{kycStatus === "Verified" && shops.length === 0 && (
								<KycVerifiedNoShopState
									onBack={() => navigate("/")}
									onRegisterShop={() =>
										navigate("/seller/register")
									}
								/>
							)}

							{/* THƯỜNG HỢP 5: ĐÃ VERIFIED - ĐÃ CÓ SHOP */}
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

			{/* MODAL XÁC NHẬN SUBMIT KYC */}
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

			{/* MODAL XÁC NHẬN RÚT HỒ SƠ KYC */}
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
