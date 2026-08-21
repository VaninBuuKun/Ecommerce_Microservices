import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Save, Loader2, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { UploadImage } from "../../../shared";
import { useSellerProfileQuery, useUpdateShopMutation, useShopDetailQuery } from "../hooks";
import { useSellerStore } from "../stores";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "../../catalog/hooks";

export function ShopSettingsPage() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const currentShopId = shopId || activeShop?.id?.toString();
	const { data: shopDetail, isLoading: isShopLoading } = useShopDetailQuery(currentShopId);
	const { data: profile, isLoading: isProfileLoading } = useSellerProfileQuery();
	const updateShopMutation = useUpdateShopMutation();

	const resolvedShop = shopDetail || activeShop || profile?.shops.find((shop) => String(shop.id) === shopId);
	const kyc = profile?.kyc;

	// UI States
	const [activeTab, setActiveTab] = useState<"info" | "kyc">("info");

	// Card 1: Shop Info States
	const [shopName, setShopName] = useState("");
	const [description, setDescription] = useState("");
	const [logoUrl, setLogoUrl] = useState("");

	// Card 2: Pickup Address States
	const [recipientName, setRecipientName] = useState("");
	const [phone, setPhone] = useState("");
	const [selectedProvinceId, setSelectedProvinceId] = useState<number | undefined>();
	const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>();
	const [selectedWardId, setSelectedWardId] = useState<number | undefined>();
	const [addressline, setAddressline] = useState("");

	// Location Queries
	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery(selectedProvinceId);
	const { data: wards } = useWardsQuery(selectedDistrictId);

	// Load settings from database
	useEffect(() => {
		if (resolvedShop) {
			setShopName(resolvedShop.name);
			setDescription(resolvedShop.description || "");
			setLogoUrl(resolvedShop.logoUrl || "");

			if ("recipientName" in resolvedShop && resolvedShop.recipientName) {
				setRecipientName(resolvedShop.recipientName || "");
				setPhone(resolvedShop.phone || "");
				setSelectedProvinceId(resolvedShop.provinceId || undefined);
				setSelectedDistrictId(resolvedShop.districtId || undefined);
				setSelectedWardId(resolvedShop.wardId || undefined);
				setAddressline(resolvedShop.addressLine || "");
			} else if (resolvedShop.pickUpAddress) {
				setRecipientName(resolvedShop.pickUpAddress.recipientName || "");
				setPhone(resolvedShop.pickUpAddress.phone || "");
				setSelectedProvinceId(resolvedShop.pickUpAddress.provinceId || undefined);
				setSelectedDistrictId(resolvedShop.pickUpAddress.districtId || undefined);
				setSelectedWardId(resolvedShop.pickUpAddress.wardId || undefined);
				setAddressline(resolvedShop.pickUpAddress.addressLine || "");
			} else {
				// Try to load custom local settings first
				const localDataStr = localStorage.getItem(`shop_settings_${resolvedShop.id}`);
				if (localDataStr) {
					try {
						const localData = JSON.parse(localDataStr);
						setRecipientName(localData.recipientName || "");
						setPhone(localData.phone || "");
						setSelectedProvinceId(localData.selectedProvinceId);
						setSelectedDistrictId(localData.selectedDistrictId);
						setSelectedWardId(localData.selectedWardId);
						setAddressline(localData.addressline || "");
					} catch (e) {
						console.error("Error loading local settings", e);
					}
				}
			}
		}
	}, [resolvedShop]);

	const handleSave = async () => {
		if (!resolvedShop) return;

		if (!shopName.trim()) {
			toast.error("Vui lòng nhập tên shop.");
			return;
		}

		if (!recipientName.trim() || !phone.trim() || !selectedProvinceId || !selectedDistrictId || !selectedWardId || !addressline.trim()) {
			toast.error("Vui lòng nhập đầy đủ thông tin địa chỉ lấy hàng.");
			return;
		}

		const phoneRegex = /^(03|05|07|08|09|843|845|847|848|849)[0-9]{8}$/;
		if (!phoneRegex.test(phone)) {
			toast.error("Số điện thoại lấy hàng không hợp lệ. Vui lòng nhập số di động Việt Nam (ví dụ: 0912345678 hoặc 84912345678).");
			return;
		}

		try {
			await updateShopMutation.mutateAsync({
				id: resolvedShop.id,
				payload: {
					name: shopName.trim(),
					description: description.trim(),
					logoUrl: logoUrl || undefined,
					recipientName: recipientName.trim(),
					phone: phone.trim(),
					addressLine: addressline.trim(),
					provinceId: selectedProvinceId,
					districtId: selectedDistrictId,
					wardId: selectedWardId,
				},
			});

			// Save to localstorage as fallback cache
			const payload = {
				shopName: shopName.trim(),
				description: description.trim(),
				logoUrl,
				recipientName: recipientName.trim(),
				phone: phone.trim(),
				selectedProvinceId,
				selectedDistrictId,
				selectedWardId,
				addressline: addressline.trim(),
			};
			localStorage.setItem(`shop_settings_${resolvedShop.id}`, JSON.stringify(payload));

			toast.success("Cập nhật thông tin shop thành công!");
		} catch (err: any) {
			toast.error(`Cập nhật thất bại: ${err?.message || "Lỗi kết nối API"}`);
		}
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const cleaned = e.target.value.replace(/[^0-9]/g, "");
		if (cleaned.startsWith("84")) {
			setPhone(cleaned.slice(0, 11));
		} else {
			setPhone(cleaned.slice(0, 10));
		}
	};

	const isSaving = updateShopMutation.isPending;

	if (isProfileLoading || isShopLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-brand-muted text-xs gap-3 font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin cấu hình shop...
			</div>
		);
	}

	return (
		<div className="space-y-6 text-left relative font-sans text-xs pb-16">
			{/* Header */}
			<div className="border-b border-brand-border pb-3 flex justify-between items-center">
				<div>
					<h2 className="text-sm font-bold text-brand-dark">Cài đặt thông tin Shop</h2>
					<p className="text-[11px] text-brand-muted">
						Quản lý thông tin hồ sơ cửa hàng, địa chỉ lấy hàng và định danh người bán.
					</p>
				</div>
			</div>

			{/* Custom Tabs */}
			<div className="border-b border-brand-border flex gap-6 relative">
				<button
					onClick={() => setActiveTab("info")}
					className={`pb-3 font-bold cursor-pointer relative transition-colors ${
						activeTab === "info" ? "text-brand-primary-deep" : "text-brand-muted hover:text-brand-dark"
					}`}
				>
					Thông tin shop
					{activeTab === "info" && (
						<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full transition-all duration-300" />
					)}
				</button>
				<button
					onClick={() => setActiveTab("kyc")}
					className={`pb-3 font-bold cursor-pointer relative transition-colors ${
						activeTab === "kyc" ? "text-brand-primary-deep" : "text-brand-muted hover:text-brand-dark"
					}`}
				>
					Thông tin định danh (KYC)
					{activeTab === "kyc" && (
						<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full transition-all duration-300" />
					)}
				</button>
			</div>

			{/* Tab Contents */}
			<div className="space-y-6">
				{activeTab === "info" ? (
					<>
						{/* Card 1: Shop Info */}
						<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
							<h3 className="font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
								Hồ sơ cửa hàng
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-1">
									<label className="block font-bold text-brand-dark mb-1.5">Ảnh logo cửa hàng</label>
									<UploadImage value={logoUrl} onChange={setLogoUrl} className="w-28 h-28 rounded-lg" />
								</div>

								<div className="md:col-span-2 space-y-3.5">
									<div>
										<label className="block font-bold text-brand-dark mb-1">Tên cửa hàng</label>
										<input
											type="text"
											value={shopName}
											onChange={(e) => setShopName(e.target.value)}
											placeholder="Nhập tên shop của bạn..."
											className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary"
										/>
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">Mô tả cửa hàng</label>
										<textarea
											rows={4}
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											placeholder="Mô tả ngành hàng, sản phẩm hoặc lời chào của shop..."
											className="w-full p-2.5 border border-brand-border rounded-lg text-xs focus:outline-none focus:border-brand-primary"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Card 2: Pickup/Origin Address */}
						<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
							<h3 className="font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
								Địa chỉ lấy hàng
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Column 1 */}
								<div className="space-y-3">
									<div>
										<label className="block font-bold text-brand-dark mb-1">Tên người liên hệ</label>
										<input
											type="text"
											value={recipientName}
											onChange={(e) => setRecipientName(e.target.value)}
											placeholder="Tên người nhận liên hệ lấy hàng..."
											className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none"
										/>
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">Số điện thoại lấy hàng</label>
										<input
											type="text"
											value={phone}
											onChange={handlePhoneChange}
											placeholder="Số điện thoại liên hệ..."
											className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none"
										/>
									</div>
								</div>

								{/* Column 2 */}
								<div className="space-y-3">
									<div>
										<label className="block font-bold text-brand-dark mb-1">Tỉnh / Thành phố</label>
										<select
											value={selectedProvinceId || ""}
											onChange={(e) => {
												setSelectedProvinceId(e.target.value ? Number(e.target.value) : undefined);
												setSelectedDistrictId(undefined);
												setSelectedWardId(undefined);
											}}
											className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none"
										>
											<option value="">Chọn Tỉnh/Thành phố</option>
											{provinces?.map((p) => (
												<option key={p.id} value={p.id}>
													{p.displayName || p.name}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">Quận / Huyện</label>
										<select
											value={selectedDistrictId || ""}
											onChange={(e) => {
												setSelectedDistrictId(e.target.value ? Number(e.target.value) : undefined);
												setSelectedWardId(undefined);
											}}
											disabled={!selectedProvinceId}
											className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-50"
										>
											<option value="">Chọn Quận/Huyện</option>
											{districts?.map((d) => (
												<option key={d.id} value={d.id}>
													{d.displayName || d.name}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">Phường / Xã</label>
										<select
											value={selectedWardId || ""}
											onChange={(e) => setSelectedWardId(e.target.value ? Number(e.target.value) : undefined)}
											disabled={!selectedDistrictId}
											className="w-full h-8 px-2 border border-brand-border rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-50"
										>
											<option value="">Chọn Phường/Xã</option>
											{wards?.map((w) => (
												<option key={w.id} value={w.id}>
													{w.displayName || w.name}
												</option>
											))}
										</select>
									</div>
								</div>
							</div>

							<div className="pt-2">
								<label className="block font-bold text-brand-dark mb-1">Địa chỉ chi tiết (Số nhà, tên đường...)</label>
								<input
									type="text"
									value={addressline}
									onChange={(e) => setAddressline(e.target.value)}
									placeholder="Nhập số nhà, tên đường, ngõ hẻm..."
									className="w-full h-8 px-3 border border-brand-border rounded-lg text-xs focus:outline-none"
								/>
							</div>
						</div>
					</>
				) : (
					/* Tab 2: KYC */
					<div className="space-y-6">
						{!kyc ? (
							<div className="p-8 border border-dashed border-brand-border rounded-xl text-center space-y-3 bg-white">
								<Landmark className="w-10 h-10 text-brand-muted mx-auto" />
								<div>
									<h4 className="font-bold text-brand-dark">Chưa thiết lập KYC</h4>
									<p className="text-[11px] text-brand-muted mt-1 max-w-sm mx-auto">
										Cửa hàng của bạn chưa hoàn tất định danh KYC để có thể rút tiền và mở khóa doanh thu đầy đủ.
									</p>
								</div>
							</div>
						) : (
							<>
								{/* Card 1: KYC Info */}
								<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
									<h3 className="font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border flex items-center gap-1.5">
										<ShieldCheck className="w-4 h-4 text-green-600" />
										Định danh người dùng
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block font-bold text-brand-dark mb-1">Số Căn cước công dân (CCCD)</label>
											<input
												type="text"
												value={kyc.identityCardNumber}
												readOnly
												className="w-full h-8 px-3 border border-brand-border bg-gray-50 rounded-lg text-xs focus:outline-none text-brand-muted cursor-not-allowed font-medium"
											/>
										</div>

										<div>
											<label className="block font-bold text-brand-dark mb-1">Trạng thái xác thực</label>
											<div className="pt-1">
												<span
													className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border ${
														kyc.status === "Verified"
															? "bg-green-50 text-green-700 border-green-200"
															: kyc.status === "Submitted"
															? "bg-blue-50 text-blue-700 border-blue-200"
															: "bg-amber-50 text-amber-700 border-amber-200"
													}`}
												>
													{kyc.status === "Verified"
														? "Đã xác thực"
														: kyc.status === "Submitted"
														? "Đang chờ duyệt"
														: "Bản nháp / Chưa xác thực"}
												</span>
											</div>
										</div>

										{kyc.rejectReason && (
											<div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
												<strong>Lý do từ chối:</strong> {kyc.rejectReason}
											</div>
										)}
									</div>
								</div>

								{/* Card 2: Document Photos */}
								<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
									<h3 className="font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
										Ảnh chụp giấy tờ tùy thân
									</h3>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<span className="block font-bold text-brand-dark mb-2">Mặt trước CCCD</span>
											<div className="border border-brand-border rounded-lg overflow-hidden bg-gray-50 aspect-video max-w-sm flex items-center justify-center">
												{kyc.identityCardFrontUrl ? (
													<img
														src={kyc.identityCardFrontUrl}
														alt="Front side"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-gray-400">Không có ảnh</span>
												)}
											</div>
										</div>

										<div>
											<span className="block font-bold text-brand-dark mb-2">Mặt sau CCCD</span>
											<div className="border border-brand-border rounded-lg overflow-hidden bg-gray-50 aspect-video max-w-sm flex items-center justify-center">
												{kyc.identityCardBackUrl ? (
													<img
														src={kyc.identityCardBackUrl}
														alt="Back side"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-gray-400">Không có ảnh</span>
												)}
											</div>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Sticky footer controls */}
			{activeTab === "info" && resolvedShop && (
				<div className="fixed bottom-0 right-0 left-0 bg-white/90 backdrop-blur-md border-t border-brand-border p-3 flex justify-end z-40 pr-6 pl-6 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="h-8 px-4 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-65 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
					>
						{isSaving ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5" />
						)}
						Lưu thông tin
					</button>
				</div>
			)}
		</div>
	);
}
export default ShopSettingsPage;
