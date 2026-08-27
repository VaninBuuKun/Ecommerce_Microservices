import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Save,
	Loader2,
	Landmark,
	ShieldCheck,
	AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { UploadImage } from "@/shared";
import {
	useSellerProfileQuery,
	useUpdateShopMutation,
	useShopDetailQuery,
	useSellerStore,
} from "@/domains/seller";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/shipping";

const phoneRegex = /^(03|05|07|08|09|843|845|847|848|849)[0-9]{8}$/;

const shopSettingsSchema = z.object({
	name: z.string().min(2, "Tên cửa hàng phải có ít nhất 2 ký tự"),
	description: z.string().optional(),
	logoUrl: z.string().optional(),
	recipientName: z
		.string()
		.min(2, "Vui lòng nhập tên người liên hệ lấy hàng (tối thiểu 2 ký tự)"),
	phone: z
		.string()
		.regex(
			phoneRegex,
			"Số điện thoại lấy hàng không hợp lệ (ví dụ: 0912345678)",
		),
	provinceId: z.coerce
		.number({ invalid_type_error: "Vui lòng chọn Tỉnh/Thành phố" })
		.min(1, "Vui lòng chọn Tỉnh/Thành phố"),
	districtId: z.coerce
		.number({ invalid_type_error: "Vui lòng chọn Quận/Huyện" })
		.min(1, "Vui lòng chọn Quận/Huyện"),
	wardId: z.coerce
		.number({ invalid_type_error: "Vui lòng chọn Phường/Xã" })
		.min(1, "Vui lòng chọn Phường/Xã"),
	addressLine: z.string().min(5, "Địa chỉ chi tiết phải có ít nhất 5 ký tự"),
});

type ShopSettingsFormValues = z.infer<typeof shopSettingsSchema>;

export function ShopSettingsPage() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const currentShopId = shopId || activeShop?.id?.toString();
	const { data: shopDetail, isLoading: isShopLoading } = useShopDetailQuery(
		currentShopId || "",
	);
	const { data: profile, isLoading: isProfileLoading } =
		useSellerProfileQuery();
	const updateShopMutation = useUpdateShopMutation();

	const resolvedShop =
		shopDetail ||
		activeShop ||
		profile?.shops.find((shop: any) => String(shop.id) === shopId);
	const kyc = profile?.kyc as any;

	const [activeTab, setActiveTab] = useState<"info" | "kyc">("info");

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		control,
		formState: { errors },
	} = useForm<ShopSettingsFormValues>({
		resolver: zodResolver(shopSettingsSchema),
		defaultValues: {
			name: "",
			description: "",
			logoUrl: "",
			recipientName: "",
			phone: "",
			provinceId: undefined,
			districtId: undefined,
			wardId: undefined,
			addressLine: "",
		},
	});

	const selectedProvinceId = watch("provinceId");
	const selectedDistrictId = watch("districtId");

	// Location Queries
	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery(selectedProvinceId);
	const { data: wards } = useWardsQuery(selectedDistrictId);

	// Reset form values when shop data is loaded from API
	useEffect(() => {
		if (resolvedShop) {
			const provId = resolvedShop.provinceId ?? resolvedShop.pickUpAddress?.provinceId;
			const distId = resolvedShop.districtId ?? resolvedShop.pickUpAddress?.districtId;
			const wrdId = resolvedShop.wardId ?? resolvedShop.pickUpAddress?.wardId;

			reset({
				name: resolvedShop.name || "",
				description: resolvedShop.description || "",
				logoUrl: resolvedShop.logoUrl || "",
				recipientName: resolvedShop.recipientName || resolvedShop.pickUpAddress?.recipientName || "",
				phone: resolvedShop.phone || resolvedShop.pickUpAddress?.phone || "",
				provinceId: provId ? Number(provId) : undefined,
				districtId: distId ? Number(distId) : undefined,
				wardId: wrdId ? Number(wrdId) : undefined,
				addressLine: resolvedShop.addressLine || resolvedShop.pickUpAddress?.addressLine || "",
			});
		}
	}, [resolvedShop, reset]);

	// Sync provinceId when provinces query finishes loading
	useEffect(() => {
		if (resolvedShop && provinces && provinces.length > 0) {
			const targetProvId = resolvedShop.provinceId ?? resolvedShop.pickUpAddress?.provinceId;
			if (targetProvId && provinces.some((p: any) => p.id === Number(targetProvId))) {
				setValue("provinceId", Number(targetProvId));
			}
		}
	}, [resolvedShop, provinces, setValue]);

	// Keep district & ward values in sync ONLY for initial data load
	useEffect(() => {
		if (resolvedShop && districts && districts.length > 0 && selectedProvinceId === Number(resolvedShop.provinceId ?? resolvedShop.pickUpAddress?.provinceId)) {
			const targetDistId = resolvedShop.districtId ?? resolvedShop.pickUpAddress?.districtId;
			if (targetDistId && districts.some((d: any) => d.id === Number(targetDistId))) {
				setValue("districtId", Number(targetDistId));
			}
		}
	}, [resolvedShop, districts, selectedProvinceId, setValue]);

	useEffect(() => {
		if (resolvedShop && wards && wards.length > 0 && selectedDistrictId === Number(resolvedShop.districtId ?? resolvedShop.pickUpAddress?.districtId)) {
			const targetWardId = resolvedShop.wardId ?? resolvedShop.pickUpAddress?.wardId;
			if (targetWardId && wards.some((w: any) => w.id === Number(targetWardId))) {
				setValue("wardId", Number(targetWardId));
			}
		}
	}, [resolvedShop, wards, selectedDistrictId, setValue]);

	const onSubmit = async (values: ShopSettingsFormValues) => {
		if (!resolvedShop) return;

		try {
			await updateShopMutation.mutateAsync({
				id: resolvedShop.id,
				payload: {
					name: values.name.trim(),
					description: values.description?.trim(),
					logoUrl: values.logoUrl || undefined,
					recipientName: values.recipientName.trim(),
					phone: values.phone.trim(),
					addressLine: values.addressLine.trim(),
					provinceId: values.provinceId,
					districtId: values.districtId,
					wardId: values.wardId,
				},
			});

			toast.success("Cập nhật thông tin shop thành công!");
		} catch (err: any) {
			toast.error(
				`Cập nhật thất bại: ${err?.message || "Lỗi kết nối API"}`,
			);
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
					<h2 className="text-sm font-bold text-brand-dark">
						Cài đặt thông tin Shop
					</h2>
					<p className="text-[11px] text-brand-muted">
						Quản lý thông tin hồ sơ cửa hàng, địa chỉ lấy hàng và
						định danh người bán.
					</p>
				</div>
			</div>

			{/* Custom Tabs */}
			<div className="border-b border-brand-border flex gap-6 relative">
				<button
					onClick={() => setActiveTab("info")}
					className={`pb-3 font-bold cursor-pointer relative transition-colors border-none bg-transparent ${
						activeTab === "info"
							? "text-brand-primary-deep"
							: "text-brand-muted hover:text-brand-dark"
					}`}
				>
					Thông tin shop
					{activeTab === "info" && (
						<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full transition-all duration-300" />
					)}
				</button>
				<button
					onClick={() => setActiveTab("kyc")}
					className={`pb-3 font-bold cursor-pointer relative transition-colors border-none bg-transparent ${
						activeTab === "kyc"
							? "text-brand-primary-deep"
							: "text-brand-muted hover:text-brand-dark"
					}`}
				>
					Thông tin định danh (KYC)
					{activeTab === "kyc" && (
						<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full transition-all duration-300" />
					)}
				</button>
			</div>

			{/* Tab Contents */}
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{activeTab === "info" ? (
					<>
						{/* Card 1: Shop Info */}
						<div className="bg-white border border-brand-border rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
							<h3 className="font-bold text-brand-dark uppercase tracking-wider pb-2 border-b border-brand-border">
								Hồ sơ cửa hàng
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-1">
									<label className="block font-bold text-brand-dark mb-1.5">
										Ảnh logo cửa hàng
									</label>
									<Controller
										name="logoUrl"
										control={control}
										render={({ field }) => (
											<UploadImage
												value={field.value || ""}
												onChange={field.onChange}
												className="w-28 h-28 rounded-lg"
											/>
										)}
									/>
								</div>

								<div className="md:col-span-2 space-y-3.5">
									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Tên cửa hàng *
										</label>
										<input
											type="text"
											{...register("name")}
											placeholder="Nhập tên shop của bạn..."
											className={`w-full h-8 px-3 border rounded-lg text-xs focus:outline-none ${
												errors.name
													? "border-red-500 bg-red-50/20"
													: "border-brand-border focus:border-brand-primary"
											}`}
										/>
										{errors.name && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.name.message}
											</p>
										)}
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Mô tả cửa hàng
										</label>
										<textarea
											rows={4}
											{...register("description")}
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
										<label className="block font-bold text-brand-dark mb-1">
											Tên người liên hệ *
										</label>
										<input
											type="text"
											{...register("recipientName")}
											placeholder="Tên người nhận liên hệ lấy hàng..."
											className={`w-full h-8 px-3 border rounded-lg text-xs focus:outline-none ${
												errors.recipientName
													? "border-red-500 bg-red-50/20"
													: "border-brand-border focus:border-brand-primary"
											}`}
										/>
										{errors.recipientName && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.recipientName.message}
											</p>
										)}
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Số điện thoại lấy hàng *
										</label>
										<input
											type="text"
											{...register("phone")}
											placeholder="Ví dụ: 0912345678"
											className={`w-full h-8 px-3 border rounded-lg text-xs focus:outline-none ${
												errors.phone
													? "border-red-500 bg-red-50/20"
													: "border-brand-border focus:border-brand-primary"
											}`}
										/>
										{errors.phone && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.phone.message}
											</p>
										)}
									</div>
								</div>

								{/* Column 2 */}
								<div className="space-y-3">
									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Tỉnh / Thành phố *
										</label>
										<select
											{...register("provinceId", {
												onChange: (e) => {
													const val = e.target.value ? Number(e.target.value) : undefined;
													setValue("provinceId", val as any, { shouldValidate: true });
													setValue("districtId", undefined as any, { shouldValidate: true });
													setValue("wardId", undefined as any, { shouldValidate: true });
												},
											})}
											className={`w-full h-8 px-2 border rounded-lg text-xs bg-white focus:outline-none ${
												errors.provinceId
													? "border-red-500 bg-red-50/20"
													: "border-brand-border"
											}`}
										>
											<option value="">
												Chọn Tỉnh/Thành phố
											</option>
											{provinces?.map((p: any) => (
												<option key={p.id} value={p.id}>
													{p.displayName || p.name}
												</option>
											))}
										</select>
										{errors.provinceId && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.provinceId.message}
											</p>
										)}
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Quận / Huyện *
										</label>
										<select
											{...register("districtId", {
												onChange: (e) => {
													const val = e.target.value ? Number(e.target.value) : undefined;
													setValue("districtId", val as any, { shouldValidate: true });
													setValue("wardId", undefined as any, { shouldValidate: true });
												},
											})}
											disabled={!selectedProvinceId}
											className={`w-full h-8 px-2 border rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-50 ${
												errors.districtId
													? "border-red-500 bg-red-50/20"
													: "border-brand-border"
											}`}
										>
											<option value="">
												Chọn Quận/Huyện
											</option>
											{districts?.map((d: any) => (
												<option key={d.id} value={d.id}>
													{d.displayName || d.name}
												</option>
											))}
										</select>
										{errors.districtId && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.districtId.message}
											</p>
										)}
									</div>

									<div>
										<label className="block font-bold text-brand-dark mb-1">
											Phường / Xã *
										</label>
										<select
											{...register("wardId")}
											disabled={!selectedDistrictId}
											className={`w-full h-8 px-2 border rounded-lg text-xs bg-white focus:outline-none disabled:bg-gray-50 ${
												errors.wardId
													? "border-red-500 bg-red-50/20"
													: "border-brand-border"
											}`}
										>
											<option value="">
												Chọn Phường/Xã
											</option>
											{wards?.map((w: any) => (
												<option key={w.id} value={w.id}>
													{w.displayName || w.name}
												</option>
											))}
										</select>
										{errors.wardId && (
											<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
												{errors.wardId.message}
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="pt-2">
								<label className="block font-bold text-brand-dark mb-1">
									Địa chỉ chi tiết (Số nhà, tên đường...) *
								</label>
								<input
									type="text"
									{...register("addressLine")}
									placeholder="Nhập số nhà, tên đường, ngõ hẻm..."
									className={`w-full h-8 px-3 border rounded-lg text-xs focus:outline-none ${
										errors.addressLine
											? "border-red-500 bg-red-50/20"
											: "border-brand-border focus:border-brand-primary"
									}`}
								/>
								{errors.addressLine && (
									<p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
										<AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
										{errors.addressLine.message}
									</p>
								)}
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
									<h4 className="font-bold text-brand-dark">
										Chưa thiết lập KYC
									</h4>
									<p className="text-[11px] text-brand-muted mt-1 max-w-sm mx-auto">
										Cửa hàng của bạn chưa hoàn tất định danh
										KYC để có thể rút tiền và mở khóa doanh
										thu đầy đủ.
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
											<label className="block font-bold text-brand-dark mb-1">
												Số Căn cước công dân (CCCD)
											</label>
											<input
												type="text"
												value={kyc.identityCardNumber}
												readOnly
												className="w-full h-8 px-3 border border-brand-border bg-gray-50 rounded-lg text-xs focus:outline-none text-brand-muted cursor-not-allowed font-medium"
											/>
										</div>

										<div>
											<label className="block font-bold text-brand-dark mb-1">
												Trạng thái xác thực
											</label>
											<div className="pt-1">
												<span
													className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider border ${
														kyc.status ===
														"Verified"
															? "bg-green-50 text-green-700 border-green-200"
															: kyc.status ===
																  "Submitted"
																? "bg-blue-50 text-blue-700 border-blue-200"
																: "bg-amber-50 text-amber-700 border-amber-200"
													}`}
												>
													{kyc.status === "Verified"
														? "Đã xác thực"
														: kyc.status ===
															  "Submitted"
															? "Đang chờ duyệt"
															: "Bản nháp / Chưa xác thực"}
												</span>
											</div>
										</div>

										{kyc.rejectReason && (
											<div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
												<strong>Lý do từ chối:</strong>{" "}
												{kyc.rejectReason}
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
											<span className="block font-bold text-brand-dark mb-2">
												Mặt trước CCCD
											</span>
											<div className="border border-brand-border rounded-lg overflow-hidden bg-gray-50 aspect-video max-w-sm flex items-center justify-center">
												{kyc.identityCardFrontUrl ? (
													<img
														src={
															kyc.identityCardFrontUrl
														}
														alt="Front side"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-gray-400">
														Không có ảnh
													</span>
												)}
											</div>
										</div>

										<div>
											<span className="block font-bold text-brand-dark mb-2">
												Mặt sau CCCD
											</span>
											<div className="border border-brand-border rounded-lg overflow-hidden bg-gray-50 aspect-video max-w-sm flex items-center justify-center">
												{kyc.identityCardBackUrl ? (
													<img
														src={
															kyc.identityCardBackUrl
														}
														alt="Back side"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-gray-400">
														Không có ảnh
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				)}

				{/* Sticky footer controls */}
				{activeTab === "info" && resolvedShop && (
					<div className="fixed bottom-0 right-0 left-0 bg-white/90 backdrop-blur-md border-t border-brand-border p-3 flex justify-end z-40 pr-6 pl-6 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
						<button
							type="submit"
							disabled={isSaving}
							className="h-8 px-4 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-65 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-none"
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
			</form>
		</div>
	);
}
export default ShopSettingsPage;
