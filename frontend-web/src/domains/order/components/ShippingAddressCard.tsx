import { MapPin, User, Phone } from "lucide-react";
import type { UserAddress } from "../types/order.types";

interface ShippingAddressCardProps {
	selectedAddress: UserAddress | null;
	onOpenModal: () => void;
	getWardName: (id: number) => string;
	getDistrictName: (id: number) => string;
	getProvinceName: (id: number) => string;
}

export function ShippingAddressCard({
	selectedAddress,
	onOpenModal,
	getWardName,
	getDistrictName,
	getProvinceName,
}: ShippingAddressCardProps) {
	return (
		<div className="bg-white border border-brand-border rounded-md p-4 relative shadow-xs text-left font-sans">
			<div className="flex items-center gap-2 text-xs font-bold text-red-500 mb-3 uppercase tracking-wider">
				<MapPin className="w-4 h-4" />
				Địa Chỉ Nhận Hàng
			</div>

			{selectedAddress ? (
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<span className="font-extrabold text-brand-dark text-xs flex items-center gap-1">
							<User className="w-3.5 h-3.5 text-brand-muted" />
							{selectedAddress.recipientName}
						</span>
						<span className="text-xs text-brand-muted font-bold flex items-center gap-1">
							<Phone className="w-3.5 h-3.5 text-brand-muted" />
							{selectedAddress.phone}
						</span>
						{selectedAddress.isDefault && (
							<span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1.5 py-0.2 rounded">
								Mặc định
							</span>
						)}
					</div>
					<div className="text-xs text-brand-dark leading-relaxed font-semibold">
						{[
							selectedAddress.addressLine,
							selectedAddress.wardId ? getWardName(selectedAddress.wardId) : null,
							selectedAddress.districtId ? getDistrictName(selectedAddress.districtId) : null,
							selectedAddress.provinceId ? getProvinceName(selectedAddress.provinceId) : null,
						]
							.filter(Boolean)
							.join(", ")}
					</div>
				</div>
			) : (
				<div className="text-xs text-brand-muted font-bold py-2">
					Bạn chưa có địa chỉ nhận hàng nào được cấu hình.
				</div>
			)}

			<div className="flex gap-3 mt-3 pt-3 border-t border-brand-border/60">
				<button
					onClick={onOpenModal}
					className="inline-flex items-center gap-1 px-2.5 py-1 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer bg-white"
				>
					Thay Đổi Địa Chỉ
				</button>
			</div>
		</div>
	);
}