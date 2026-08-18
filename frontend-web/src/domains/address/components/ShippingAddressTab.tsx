import { useState } from "react";
import { MapPin, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
	useAddressesQuery,
	useSetDefaultAddressMutation,
	useDeleteAddressMutation,
} from "@/domains/order";
import { useProvincesQuery, useDistrictsQuery, useWardsQuery } from "@/domains/catalog";
import { NewAddressModal } from "./NewAddressModal";

export function ShippingAddressTab() {
	const [showNewAddressModal, setShowNewAddressModal] = useState(false);

	const { data: addresses, isLoading, refetch } = useAddressesQuery();
	const setDefaultAddressMutation = useSetDefaultAddressMutation();
	const deleteAddressMutation = useDeleteAddressMutation();

	const { data: provinces } = useProvincesQuery();
	const { data: districts } = useDistrictsQuery();
	const { data: wards } = useWardsQuery();

	const getProvinceName = (id: number) => provinces?.find((p) => p.id === id)?.displayName || `Tỉnh #${id}`;
	const getDistrictName = (id: number) => districts?.find((d) => d.id === id)?.displayName || `Huyện #${id}`;
	const getWardName = (id: number) => wards?.find((w) => w.id === id)?.displayName || `Xã #${id}`;

	const handleSetDefault = (addrId: string) => {
		setDefaultAddressMutation.mutate(addrId, {
			onSuccess: () => {
				toast.success("Đã thiết lập địa chỉ mặc định!");
				refetch();
			},
			onError: (err: any) => {
				toast.error(err?.response?.data || "Cài đặt mặc định thất bại!");
			},
		});
	};

	const handleDelete = (addrId: string) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
			deleteAddressMutation.mutate(addrId, {
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

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="flex justify-between items-center pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
						Địa chỉ nhận hàng
					</h2>
					<p className="text-xs text-brand-muted">
						Quản lý danh sách địa chỉ nhận hàng của bạn để thanh toán nhanh chóng.
					</p>
				</div>
				<button
					onClick={() => setShowNewAddressModal(true)}
					className="px-4 py-2 bg-brand-primary text-brand-dark hover:bg-brand-primary-deep rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border-none shadow-sm"
				>
					<Plus className="w-4 h-4" />
					Thêm địa chỉ mới
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center py-12 text-xs text-brand-muted gap-2">
					<Loader2 className="w-5 h-5 animate-spin text-brand-primary" /> Đang tải danh sách địa chỉ...
				</div>
			) : !addresses || addresses.length === 0 ? (
				<div className="text-center py-12 text-brand-muted font-bold text-xs space-y-2">
					<MapPin className="w-8 h-8 text-brand-muted mx-auto opacity-50" />
					<p>Bạn chưa có địa chỉ nhận hàng nào được lưu.</p>
				</div>
			) : (
				<div className="space-y-4">
					{addresses.map((addr: any) => (
						<div
							key={addr.id}
							className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
								addr.isDefault
									? "border-brand-primary bg-brand-primary/5"
									: "border-brand-border bg-white"
							}`}
						>
							<div className="space-y-1.5 flex-1 min-w-0">
								<div className="flex items-center gap-3">
									<span className="font-extrabold text-sm text-brand-dark">
										{addr.recipientName}
									</span>
									<span className="text-xs font-bold text-brand-muted">
										{addr.phone}
									</span>
									{addr.isDefault && (
										<span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
											Mặc định
										</span>
									)}
								</div>
								<p className="text-xs text-brand-dark font-medium leading-relaxed">
									{addr.addressLine}, {getWardName(addr.wardId)}, {getDistrictName(addr.districtId)}, {getProvinceName(addr.provinceId)}
								</p>
							</div>

							<div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
								{!addr.isDefault && (
									<button
										onClick={() => handleSetDefault(addr.id)}
										disabled={setDefaultAddressMutation.isPending}
										className="px-3 py-1.5 border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
									>
										Thiết lập mặc định
									</button>
								)}
								<button
									onClick={() => handleDelete(addr.id)}
									disabled={deleteAddressMutation.isPending}
									className="p-1.5 border border-brand-border hover:border-red-500 hover:bg-red-50 text-brand-muted hover:text-red-500 rounded-xl transition-all cursor-pointer bg-white"
									title="Xóa địa chỉ"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<NewAddressModal
				isOpen={showNewAddressModal}
				onClose={() => setShowNewAddressModal(false)}
				onSuccess={() => refetch()}
			/>
		</div>
	);
}
