import { useState, useMemo } from "react";
import { MapPin, Plus, Trash2, Edit2, Loader2, Check } from "lucide-react";
import { toast } from "react-toastify";
import {
	useAddressesQuery,
	useSetDefaultAddressMutation,
	useDeleteAddressMutation,
} from "@/domains/order";
import { useResolveLocationsQuery } from "@/domains/shipping";
import { NewAddressModal } from "./NewAddressModal";

export function ShippingAddressTab() {
	const [showModal, setShowModal] = useState(false);
	const [editingAddress, setEditingAddress] = useState<any | null>(null);

	const { data: addresses, isLoading, refetch } = useAddressesQuery();
	const setDefaultAddressMutation = useSetDefaultAddressMutation();
	const deleteAddressMutation = useDeleteAddressMutation();

	// Lấy toàn bộ danh sách wardId để resolve tên địa phương chính xác 100% từ Shippings service
	const wardIds = useMemo(() => {
		if (!addresses || !Array.isArray(addresses)) return [];
		return addresses
			.map((a: any) => Number(a.wardId))
			.filter((id: number) => id > 0);
	}, [addresses]);

	const { data: resolvedLocations } = useResolveLocationsQuery(wardIds);

	const locationMap = useMemo(() => {
		const map = new Map<number, { provinceName: string; districtName: string; wardName: string }>();
		if (resolvedLocations) {
			for (const loc of resolvedLocations) {
				map.set(Number(loc.wardId), {
					provinceName: loc.provinceName,
					districtName: loc.districtName,
					wardName: loc.wardName,
				});
			}
		}
		return map;
	}, [resolvedLocations]);

	const formatFullAddress = (addr: any) => {
		const loc = locationMap.get(Number(addr.wardId));
		if (loc) {
			return `${addr.addressLine || ""}, ${loc.wardName}, ${loc.districtName}, ${loc.provinceName}`;
		}
		return addr.addressLine || "";
	};

	const handleOpenAdd = () => {
		setEditingAddress(null);
		setShowModal(true);
	};

	const handleOpenEdit = (addr: any) => {
		setEditingAddress(addr);
		setShowModal(true);
	};

	const handleSetDefault = (addrId: number) => {
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

	const handleDelete = (addrId: number) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này?")) {
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
		<div className="space-y-4 text-left font-sans">
			{/* TOP HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wider">
						Địa chỉ nhận hàng
					</h2>
					<p className="text-[11px] text-brand-muted font-medium mt-0.5">
						Quản lý danh sách địa chỉ nhận hàng của bạn để thanh toán nhanh chóng.
					</p>
				</div>
				<button
					onClick={handleOpenAdd}
					className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border-none shrink-0 self-start sm:self-auto"
				>
					<Plus className="w-3.5 h-3.5" />
					Thêm địa chỉ mới
				</button>
			</div>

			{/* CONTENT LIST */}
			{isLoading ? (
				<div className="flex justify-center items-center py-16 text-xs text-brand-muted gap-2">
					<Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Đang tải danh sách địa chỉ...
				</div>
			) : !addresses || addresses.length === 0 ? (
				<div className="text-center py-16 text-brand-muted font-bold text-xs space-y-2">
					<MapPin className="w-8 h-8 text-brand-muted mx-auto opacity-40" />
					<p>Bạn chưa có địa chỉ nhận hàng nào được lưu.</p>
				</div>
			) : (
				<div className="divide-y divide-brand-border border-y border-brand-border/60">
					{addresses.map((addr: any) => (
						<div
							key={addr.id}
							className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-brand-light-soft/30 transition-colors -mx-2 px-2 rounded"
						>
							{/* Address Info */}
							<div className="space-y-1 flex-1 min-w-0">
								<div className="flex items-center gap-2.5 flex-wrap">
									<span className="font-bold text-xs text-brand-dark">
										{addr.recipientName}
									</span>
									<span className="text-brand-border font-light">|</span>
									<span className="text-xs font-medium text-brand-muted">
										{addr.phone}
									</span>
									{addr.isDefault && (
										<span className="text-[9px] font-black text-brand-primary-deep bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
											Mặc định
										</span>
									)}
								</div>
								<p className="text-xs text-brand-muted leading-relaxed truncate sm:whitespace-normal font-medium">
									{formatFullAddress(addr)}
								</p>
							</div>

							{/* Actions Buttons */}
							<div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
								<button
									onClick={() => handleOpenEdit(addr)}
									className="px-2.5 py-1 text-brand-dark hover:text-brand-primary-deep text-xs font-bold transition-colors cursor-pointer border border-brand-border hover:bg-white rounded flex items-center gap-1 bg-brand-light-soft/50 shadow-2xs"
								>
									<Edit2 className="w-3 h-3 text-brand-muted" />
									<span>Cập nhật</span>
								</button>

								{!addr.isDefault && (
									<button
										onClick={() => handleSetDefault(addr.id)}
										disabled={setDefaultAddressMutation.isPending}
										className="px-2.5 py-1 border border-brand-border hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark rounded text-xs font-bold transition-colors cursor-pointer bg-white"
									>
										Thiết lập mặc định
									</button>
								)}

								<button
									onClick={() => handleDelete(addr.id)}
									disabled={deleteAddressMutation.isPending}
									className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer border border-transparent hover:border-red-100"
									title="Xóa địa chỉ"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<NewAddressModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				onSuccess={() => refetch()}
				initialData={editingAddress}
			/>
		</div>
	);
}
