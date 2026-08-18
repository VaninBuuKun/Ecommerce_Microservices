import { useState } from "react";
import { Plus, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
	useAddressesQuery,
	useSetDefaultAddressMutation,
	useDeleteAddressMutation,
} from "../../../order/hooks/useCheckoutQueries";
import {
	useProvincesQuery,
	useDistrictsQuery,
	useWardsQuery,
} from "../../../catalog/hooks/useLocationQueries";
import { NewAddressModal } from "../../../order/components/NewAddressModal";
import type { UserAddress } from "../../../order/types";

function AddressItem({
	addr,
	onDelete,
	onSetDefault,
}: {
	addr: UserAddress;
	onDelete: (id: string) => void;
	onSetDefault: (id: string) => void;
}) {
	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery(addr.provinceId);
	const { data: wards } = useWardsQuery(addr.districtId);

	const getProvinceName = (id: number) => provinces?.find((p) => p.id === id)?.displayName || `Tỉnh #${id}`;
	const getDistrictName = (id: number) => districts?.find((d) => d.id === id)?.displayName || `Huyện #${id}`;
	const getWardName = (id: number) => wards?.find((w) => w.id === id)?.displayName || `Xã #${id}`;

	return (
		<div
			className={`border rounded-2xl p-4 bg-white shadow-sm flex justify-between items-start gap-4 transition-all hover:shadow-md ${
				addr.isDefault ? "border-brand-primary bg-brand-light-soft/10" : "border-brand-border"
			}`}
		>
			<div className="space-y-2 flex-1 min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-extrabold text-xs uppercase tracking-wide text-brand-dark">
						{addr.recipientName}
					</span>
					<span className="text-[10px] text-brand-muted font-bold">
						| {addr.phone}
					</span>
					{addr.isDefault && (
						<span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
							<ShieldCheck className="w-3 h-3" />
							Mặc định
						</span>
					)}
				</div>
				<p className="text-xs text-brand-muted font-semibold leading-relaxed">
					{addr.addressLine}, {getWardName(addr.wardId)}, {getDistrictName(addr.districtId)}, {getProvinceName(addr.provinceId)}
				</p>
				<div className="flex items-center gap-3 pt-1">
					{!addr.isDefault && (
						<button
							onClick={() => onSetDefault(addr.id)}
							className="text-[10px] font-black text-brand-primary-deep hover:underline cursor-pointer border-none bg-transparent"
						>
							Thiết lập mặc định
						</button>
					)}
				</div>
			</div>
			<div className="shrink-0 flex items-center">
				<button
					onClick={() => onDelete(addr.id)}
					className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-brand-muted transition-all border-none bg-transparent cursor-pointer"
					title="Xóa địa chỉ"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

export function ShippingAddressTab() {
	const { data: addresses, isLoading, refetch } = useAddressesQuery();
	const deleteAddressMutation = useDeleteAddressMutation();
	const setDefaultAddressMutation = useSetDefaultAddressMutation();

	const [showNewAddressModal, setShowNewAddressModal] = useState(false);

	const handleDeleteAddress = (addressId: string) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
			deleteAddressMutation.mutate(addressId, {
				onSuccess: () => {
					toast.success("Xóa địa chỉ thành công!");
					refetch();
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Xóa địa chỉ thất bại!");
				},
			});
		}
	};

	const handleSetDefault = (addressId: string) => {
		setDefaultAddressMutation.mutate(addressId, {
			onSuccess: () => {
				toast.success("Đã đặt làm địa chỉ mặc định!");
				refetch();
			},
			onError: (err: any) => {
				toast.error(err?.response?.data || "Không thể đặt làm địa chỉ mặc định!");
			},
		});
	};

	return (
		<div className="space-y-6 text-left font-sans text-brand-dark animate-in fade-in duration-200">
			<div className="pb-3 border-b border-brand-border flex justify-between items-center">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Địa chỉ nhận hàng
					</h2>
					<p className="text-xs text-brand-muted mt-0.5">
						Quản lý địa chỉ giao hàng nhận hàng của bạn khi đặt hàng trên hệ thống.
					</p>
				</div>
				<button
					onClick={() => setShowNewAddressModal(true)}
					className="h-8 px-3.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
				>
					<Plus className="w-4 h-4" />
					Thêm địa chỉ
				</button>
			</div>

			{isLoading ? (
				<div className="flex flex-col items-center py-20 text-brand-muted text-xs gap-3">
					<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
					Đang tải danh sách địa chỉ nhận hàng...
				</div>
			) : !addresses || addresses.length === 0 ? (
				<div className="text-center py-16 border border-dashed border-brand-border rounded-2xl text-brand-muted font-bold text-xs bg-brand-light-soft/10">
					Bạn chưa lưu địa chỉ nhận hàng nào. Nhấn "Thêm địa chỉ" ở trên để tạo mới.
				</div>
			) : (
				<div className="space-y-4">
					{addresses.map((addr: UserAddress) => (
						<AddressItem
							key={addr.id}
							addr={addr}
							onDelete={handleDeleteAddress}
							onSetDefault={handleSetDefault}
						/>
					))}
				</div>
			)}

			<NewAddressModal
				isOpen={showNewAddressModal}
				onClose={() => setShowNewAddressModal(false)}
				onSuccess={() => {
					refetch();
				}}
			/>
		</div>
	);
}
