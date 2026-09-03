import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCreateAddressMutation, useUpdateAddressMutation } from "@/domains/order";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "@/domains/shipping";

interface NewAddressModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (newAddress: any) => void;
	initialData?: any; // Khi truyền vào -> Chế độ Edit
}

export function NewAddressModal({
	isOpen,
	onClose,
	onSuccess,
	initialData,
}: NewAddressModalProps) {
	const isEditMode = !!initialData?.id;

	const [newRecipientName, setNewRecipientName] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newAddressLine, setNewAddressLine] = useState("");
	const [isDefaultAddress, setIsDefaultAddress] = useState(false);

	const [selectedProvinceId, setSelectedProvinceId] = useState<number | undefined>();
	const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>();
	const [selectedWardId, setSelectedWardId] = useState<number | undefined>();

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setNewRecipientName(initialData.recipientName || "");
				setNewPhone(initialData.phone || "");
				setNewAddressLine(initialData.addressLine || "");
				setIsDefaultAddress(!!initialData.isDefault);
				setSelectedProvinceId(initialData.provinceId ? Number(initialData.provinceId) : undefined);
				setSelectedDistrictId(initialData.districtId ? Number(initialData.districtId) : undefined);
				setSelectedWardId(initialData.wardId ? Number(initialData.wardId) : undefined);
			} else {
				setNewRecipientName("");
				setNewPhone("");
				setNewAddressLine("");
				setIsDefaultAddress(false);
				setSelectedProvinceId(undefined);
				setSelectedDistrictId(undefined);
				setSelectedWardId(undefined);
			}
		}
	}, [isOpen, initialData]);

	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery(selectedProvinceId);
	const { data: wards } = useWardsQuery(selectedDistrictId);

	const createAddressMutation = useCreateAddressMutation();
	const updateAddressMutation = useUpdateAddressMutation();

	if (!isOpen) return null;

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const cleaned = e.target.value.replace(/[^0-9]/g, "");
		if (cleaned.startsWith("84")) {
			setNewPhone(cleaned.slice(0, 11));
		} else {
			setNewPhone(cleaned.slice(0, 10));
		}
	};

	const handleSaveAddress = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedProvinceId || !selectedDistrictId || !selectedWardId) {
			toast.error("Vui lòng chọn đầy đủ Tỉnh / Huyện / Xã");
			return;
		}

		const phoneRegex = /^(03|05|07|08|09|843|845|847|848|849)[0-9]{8}$/;
		if (!phoneRegex.test(newPhone)) {
			toast.error("Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam (ví dụ: 0912345678 hoặc 84912345678).");
			return;
		}

		const payload = {
			recipientName: newRecipientName,
			phone: newPhone,
			provinceId: selectedProvinceId,
			districtId: selectedDistrictId,
			wardId: selectedWardId,
			addressLine: newAddressLine,
			isDefault: isDefaultAddress,
		};

		if (isEditMode) {
			updateAddressMutation.mutate(
				{ id: Number(initialData.id), data: payload },
				{
					onSuccess: (updatedAddr: any) => {
						toast.success("Cập nhật địa chỉ nhận hàng thành công!");
						onSuccess?.(updatedAddr);
						onClose();
					},
					onError: (err: any) => {
						toast.error(err?.response?.data || "Không thể cập nhật địa chỉ");
					},
				}
			);
		} else {
			createAddressMutation.mutate(payload, {
				onSuccess: (createdAddr: any) => {
					toast.success("Thêm địa chỉ giao hàng mới thành công!");
					onSuccess?.(createdAddr);
					onClose();
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Không thể thêm địa chỉ mới");
				},
			});
		}
	};

	const isPending = createAddressMutation.isPending || updateAddressMutation.isPending;

	return createPortal(
		<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
			<div className="bg-white border border-brand-border rounded-md max-w-2xl w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200 font-sans">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
				>
					<X className="w-5 h-5" />
				</button>

				<h2 className="text-sm font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
					<MapPin className="w-5 h-5 text-brand-primary" />
					{isEditMode ? "Cập nhật địa chỉ nhận hàng" : "Thêm địa chỉ giao hàng mới"}
				</h2>

				<form onSubmit={handleSaveAddress} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-[11px] font-bold text-brand-dark mb-1">
								Họ và tên người nhận
							</label>
							<input
								type="text"
								required
								placeholder="Ví dụ: Nguyễn Văn A"
								value={newRecipientName}
								onChange={(e) => setNewRecipientName(e.target.value)}
								className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
							/>
						</div>
						<div>
							<label className="block text-[11px] font-bold text-brand-dark mb-1">
								Số điện thoại
							</label>
							<input
								type="text"
								required
								placeholder="Ví dụ: 0987654321"
								value={newPhone}
								onChange={handlePhoneChange}
								className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
							/>
						</div>
					</div>

					{/* Location Selectors */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="block text-[11px] font-bold text-brand-dark mb-1 truncate">
								Tỉnh / Thành phố
							</label>
							<select
								required
								value={selectedProvinceId || ""}
								onChange={(e) => {
									setSelectedProvinceId(Number(e.target.value));
									setSelectedDistrictId(undefined);
									setSelectedWardId(undefined);
								}}
								className="w-full h-9 px-2 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary cursor-pointer truncate font-bold text-brand-dark"
							>
								<option value="">-- Chọn Tỉnh / TP --</option>
								{provinces?.map((p: any) => (
									<option key={p.id} value={p.id} title={p.displayName || p.name}>
										{p.displayName || p.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-[11px] font-bold text-brand-dark mb-1 truncate">
								Quận / Huyện
							</label>
							<select
								required
								disabled={!selectedProvinceId}
								value={selectedDistrictId || ""}
								onChange={(e) => {
									setSelectedDistrictId(Number(e.target.value));
									setSelectedWardId(undefined);
								}}
								className="w-full h-9 px-2 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary cursor-pointer truncate disabled:bg-gray-50 disabled:cursor-not-allowed font-bold text-brand-dark"
							>
								<option value="">-- Chọn Quận / Huyện --</option>
								{districts?.map((d: any) => (
									<option key={d.id} value={d.id} title={d.displayName || d.name}>
										{d.displayName || d.name}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-[11px] font-bold text-brand-dark mb-1 truncate">
								Phường / Xã
							</label>
							<select
								required
								disabled={!selectedDistrictId}
								value={selectedWardId || ""}
								onChange={(e) => setSelectedWardId(Number(e.target.value))}
								className="w-full h-9 px-2 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary cursor-pointer truncate disabled:bg-gray-50 disabled:cursor-not-allowed font-bold text-brand-dark"
							>
								<option value="">-- Chọn Phường / Xã --</option>
								{wards?.map((w: any) => (
									<option key={w.id} value={w.id} title={w.displayName || w.name}>
										{w.displayName || w.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="block text-[11px] font-bold text-brand-dark mb-1">
							Số nhà, tên đường (Địa chỉ cụ thể)
						</label>
						<input
							type="text"
							required
							placeholder="Ví dụ: 123 Đường Lê Lợi"
							value={newAddressLine}
							onChange={(e) => setNewAddressLine(e.target.value)}
							className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-bold text-brand-dark"
						/>
					</div>

					<label className="flex items-center gap-2 py-1 select-none cursor-pointer">
						<input
							type="checkbox"
							checked={isDefaultAddress}
							onChange={(e) => setIsDefaultAddress(e.target.checked)}
							className="accent-brand-primary w-4 h-4 rounded-md cursor-pointer"
						/>
						<span className="text-xs text-brand-dark font-bold">
							Đặt làm địa chỉ mặc định
						</span>
					</label>

					<div className="flex gap-3 pt-3 border-t border-brand-border/60">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-md transition-colors cursor-pointer bg-white"
						>
							Hủy bỏ
						</button>
						<button
							type="submit"
							disabled={isPending}
							className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-white font-black text-xs rounded-md transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs"
						>
							{isPending && (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							)}
							{isEditMode ? "Lưu thay đổi" : "Lưu lại"}
						</button>
					</div>
				</form>
			</div>
		</div>,
		document.body
	);
}
