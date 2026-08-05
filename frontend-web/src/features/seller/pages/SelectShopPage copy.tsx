import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header";
import {
	Store,
	Plus,
	ArrowLeft,
	ShieldAlert,
	Clock,
	CheckCircle2,
	AlertCircle,
	Edit3,
	Save,
	Send,
	AlertTriangle,
} from "lucide-react";
import { useSellerStore } from "../stores";
import type { Shop } from "../types";
import { UploadImage } from "../../../shared";

export default function SelectShopPage() {
	const navigate = useNavigate();

	const {
		shops,
		activeShop,
		setActiveShop,
		kyc,
		isLoadingProfile,
		fetchSellerProfile,
		saveKycDraft,
		submitKyc,
		withdrawKycDraft,
	} = useSellerStore();

	// State điều khiển mở/tắt form KYC
	const [showKycForm, setShowKycForm] = useState(false);

	// State lưu dữ liệu form KYC
	const [identityNumber, setIdentityNumber] = useState("");
	const [identityFront, setIdentityFront] = useState("");
	const [identityBack, setIdentityBack] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Modal States
	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);

	// Tải thông tin Seller Profile (KYC + Shops) khi mount
	useEffect(() => {
		fetchSellerProfile();
	}, [fetchSellerProfile]);

	// Điền sẵn thông tin nếu kyc đã tồn tại
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

	// Chọn cửa hàng
	const handleSelectShop = (shop: Shop) => {
		if (setActiveShop) setActiveShop(shop);
		navigate("/seller/dashboard");
	};

	// Đọc file ảnh preview (CCCD mặt trước/sau)
	const handleFileChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		setter: (val: string) => void,
	) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setter(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	// Validate form
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

	// Xử lý Cập nhật (Draft)
	const handleSaveDraft = async () => {
		if (!validateForm()) return;
		setIsSubmitting(true);
		try {
			await saveKycDraft({ identityNumber, identityFront, identityBack });
			alert("Đã cập nhật bản nháp KYC thành công!");
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi lưu bản nháp KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Mở modal xác nhận tiến hành gửi
	const handleOpenSubmitModal = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		setShowSubmitModal(true);
	};

	// Đồng ý Tiến hành gửi (Submitted)
	const handleConfirmSubmit = async () => {
		setShowSubmitModal(false);
		setIsSubmitting(true);
		try {
			await submitKyc({ identityNumber, identityFront, identityBack });
			setShowKycForm(false);
		} catch (err: any) {
			alert(err?.response?.data || "Có lỗi xảy ra khi gửi hồ sơ KYC.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Đồng ý Rút lại / Chỉnh sửa hồ sơ KYC
	const handleConfirmWithdraw = async () => {
		setShowWithdrawModal(false);
		setIsSubmitting(true);
		try {
			await withdrawKycDraft();
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
					{isLoadingProfile ? (
						<div className="py-12 text-center text-xs text-brand-muted flex flex-col items-center gap-2">
							<div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
							Đang tải thông tin xác minh...
						</div>
					) : (
						<>
							{/* ================= THƯỜNG HỢP 1: CHƯA KYC & CHƯA MỞ FORM ================= */}
							{!kyc && !showKycForm && (
								<div className="text-center py-4">
									<div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
										<ShieldAlert className="w-6 h-6 text-amber-500" />
									</div>
									<h2 className="text-base font-bold text-brand-dark mb-2">
										Xác minh định danh
									</h2>
									<p className="text-xs text-brand-muted mb-6 leading-relaxed">
										Nhập thông tin định danh để trở thành
										người bán trên BuuStore.
									</p>

									<div className="flex gap-3 justify-center">
										<button
											type="button"
											onClick={() => navigate("/")}
											className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
										>
											<ArrowLeft className="w-3.5 h-3.5" />
											Quay lại
										</button>
										<button
											type="button"
											onClick={() => setShowKycForm(true)}
											className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
										>
											Tiến hành
										</button>
									</div>
								</div>
							)}

							{/* ================= THƯỜNG HỢP 2: ĐÃ GỬI (SUBMITTED / PENDING) ================= */}
							{kycStatus === "Submitted" && !showKycForm && (
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
										Bạn đã gửi thông tin định danh cho
										admin. Admin xác nhận bạn sẽ trở thành
										người bán trên BuuStore.
									</p>

									{/* Tóm tắt thông tin đã gửi */}
									<div className="bg-brand-light-soft p-3 rounded-lg border border-brand-border text-left mb-6 text-xs space-y-2">
										<div className="flex justify-between">
											<span className="text-brand-muted">
												Số CMND/CCCD:
											</span>
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
														src={
															kyc.identityCardFrontUrl
														}
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
														src={
															kyc.identityCardBackUrl
														}
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
											onClick={() => navigate("/")}
											className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
										>
											<ArrowLeft className="w-3.5 h-3.5" />
											Quay lại
										</button>
										<button
											type="button"
											onClick={() =>
												setShowWithdrawModal(true)
											}
											disabled={isSubmitting}
											className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
										>
											<Edit3 className="w-3.5 h-3.5" />
											Chỉnh sửa / Rút lại
										</button>
									</div>
								</div>
							)}

							{/* ================= THƯỜNG HỢP 3: FORM NHẬP KYC (DRAFT HOẶC TẠO MỚI) ================= */}
							{showKycForm &&
								(kycStatus === "Draft" ||
									kycStatus === "Rejected" ||
									!kycStatus) && (
									<form
										onSubmit={handleOpenSubmitModal}
										className="space-y-4 text-left"
									>
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

										{kycStatus === "Rejected" &&
											kyc?.rejectReason && (
												<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
													<AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
													<div>
														<span className="font-bold">
															Lý do từ chối trước
															đó:
														</span>
														<p className="mt-0.5 text-[11px]">
															{kyc.rejectReason}
														</p>
													</div>
												</div>
											)}

										{/* Input Số CCCD */}
										<div>
											<label className="block text-xs font-bold text-brand-dark mb-1">
												Số CMND/CCCD{" "}
												<span className="text-red-500">
													*
												</span>
											</label>
											<input
												type="text"
												placeholder="Nhập số CMND/CCCD..."
												value={identityNumber}
												onChange={(e) =>
													setIdentityNumber(
														e.target.value,
													)
												}
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
												onClick={() => {
													if (kycStatus === "Draft") {
														setShowKycForm(false);
													} else {
														setShowKycForm(false);
													}
												}}
												className="px-3.5 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
											>
												<ArrowLeft className="w-3.5 h-3.5" />
												Quay lại
											</button>

											<div className="flex gap-2">
												<button
													type="button"
													onClick={handleSaveDraft}
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
									</form>
								)}

							{/* ================= THƯỜNG HỢP 4: ĐÃ VERIFIED - CHƯA CÓ SHOP ================= */}
							{kycStatus === "Verified" && shops.length === 0 && (
								<div className="text-center py-6">
									<div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
										<CheckCircle2 className="w-6 h-6 text-emerald-500" />
									</div>
									<h2 className="text-base font-bold text-brand-dark mb-1">
										Đã xác minh định danh
									</h2>
									<p className="text-xs text-emerald-600 font-medium mb-4">
										Tài khoản của bạn đã đủ điều kiện mở cửa
										hàng!
									</p>
									<p className="text-xs text-brand-muted mb-6 leading-relaxed">
										Hiện tại chưa có shop nào cả, hãy thực
										hiện thủ tục đăng ký shop để trở thành
										người bán.
									</p>

									<div className="flex gap-3 justify-center">
										<button
											type="button"
											onClick={() => navigate("/")}
											className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
										>
											<ArrowLeft className="w-3.5 h-3.5" />
											Quay lại
										</button>
										<button
											type="button"
											onClick={() =>
												navigate("/seller/register")
											}
											className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
										>
											Tiến hành đăng ký shop
										</button>
									</div>
								</div>
							)}

							{/* ================= THƯỜNG HỢP 5: ĐÃ VERIFIED - ĐÃ CÓ SHOP ================= */}
							{kycStatus === "Verified" && shops.length > 0 && (
								<div>
									<div className="flex justify-between items-center pb-4 border-b border-brand-border mb-4">
										<h2 className="text-sm font-bold text-brand-dark">
											Chọn cửa hàng bán hàng
										</h2>
										<button
											type="button"
											onClick={() =>
												navigate("/seller/register")
											}
											className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-primary-deep transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											Tạo shop mới
										</button>
									</div>

									<div className="space-y-3 max-h-80 overflow-y-auto pr-1">
										{shops.map((shop: Shop) => (
											<button
												key={shop.id || shop.name}
												type="button"
												onClick={() =>
													handleSelectShop(shop)
												}
												className="w-full flex items-center gap-3 p-3 border border-brand-border rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group cursor-pointer"
											>
												<img
													src={shop.avatarUrl}
													alt={shop.name}
													className="w-10 h-10 object-cover rounded-full border border-brand-border shrink-0"
													onError={(e) => {
														(
															e.target as HTMLImageElement
														).src =
															"https://cdn-icons-png.flaticon.com/512/3081/3081986.png";
													}}
												/>
												<div className="flex-1 min-w-0">
													<h4 className="text-xs font-bold text-brand-dark truncate group-hover:text-brand-primary-deep transition-colors">
														{shop.name}
													</h4>
													<p className="text-[10px] text-brand-muted truncate">
														{shop.description ||
															"Chưa có mô tả cửa hàng"}
													</p>
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</main>

			{/* ================= MODAL XÁC NHẬN TIẾN HÀNH GỬI ================= */}
			{showSubmitModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
					<div className="bg-white border border-brand-border rounded-xl shadow-xl p-5 max-w-sm w-full space-y-4">
						<div className="flex items-center gap-3 text-amber-600">
							<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
								<Clock className="w-5 h-5 text-amber-600" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-brand-dark">
									Xác nhận gửi thông tin KYC
								</h3>
								<p className="text-[11px] text-brand-muted">
									Xét duyệt định danh người bán
								</p>
							</div>
						</div>

						<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
							Khi gửi KYC bạn sẽ nhận được xác nhận hay từ chối
							trong vòng <strong>8-24 h</strong>, trong quá trình
							này bạn sẽ không được quyền chỉnh sửa thông tin, bạn
							có thể rút lại kyc.
						</div>

						<div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
							<button
								type="button"
								onClick={() => setShowSubmitModal(false)}
								className="px-3.5 py-1.5 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
							>
								Hủy
							</button>
							<button
								type="button"
								onClick={handleConfirmSubmit}
								disabled={isSubmitting}
								className="px-4 py-1.5 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer flex items-center gap-1"
							>
								Xác nhận gửi
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ================= MODAL XÁC NHẬN CHỈNH SỬA / RÚT HỒ SƠ ================= */}
			{showWithdrawModal && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
					<div className="bg-white border border-brand-border rounded-xl shadow-xl p-5 max-w-sm w-full space-y-4">
						<div className="flex items-center gap-3 text-red-600">
							<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-brand-dark">
									Rút lại hồ sơ để chỉnh sửa
								</h3>
								<p className="text-[11px] text-brand-muted">
									Dừng quá trình xét duyệt
								</p>
							</div>
						</div>

						<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed font-medium">
							Nếu bạn chỉnh sửa quá trình xét duyệt kyc sẽ dừng.
						</div>

						<div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
							<button
								type="button"
								onClick={() => setShowWithdrawModal(false)}
								className="px-3.5 py-1.5 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer"
							>
								Hủy
							</button>
							<button
								type="button"
								onClick={handleConfirmWithdraw}
								disabled={isSubmitting}
								className="px-4 py-1.5 bg-red-500 text-white font-bold text-xs rounded hover:bg-red-600 transition-colors cursor-pointer"
							>
								Xác nhận chỉnh sửa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
