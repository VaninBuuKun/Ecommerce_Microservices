import { useState } from "react";
import { useParams } from "react-router-dom";
import {
	Plus,
	Search,
	Loader2,
	Edit,
	Trash2,
	Calendar,
	Percent,
	DollarSign,
	Ticket,
	X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
	useSellerStore,
	useSellerProfileQuery,
	useSellerVouchersQuery,
	useCreateVoucherMutation,
	useUpdateVoucherMutation,
	useDeleteVoucherMutation,
} from "@/domains/seller";

export default function CouponsView() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();

	const resolvedShop =
		activeShop ??
		profile?.shops?.find((shop: any) => String(shop.id) === shopId) ??
		profile?.shops?.[0] ??
		null;

	const currentShopId = resolvedShop?.id ? Number(resolvedShop.id) : 0;

	// State filter & search & pagination
	const [page, setPage] = useState(1);
	const [pageSize] = useState(8);
	const [codeSearch, setCodeSearch] = useState("");
	const [selectedDiscountType, setSelectedDiscountType] = useState<number | undefined>(undefined);
	const [selectedIsActive, setSelectedIsActive] = useState<boolean | undefined>(undefined);

	// Fetch query
	const { data, isLoading } = useSellerVouchersQuery({
		shopId: currentShopId,
		page,
		pageSize,
		code: codeSearch || undefined,
		discountType: selectedDiscountType,
		isActive: selectedIsActive,
	});

	// Mutations
	const createVoucherMutation = useCreateVoucherMutation();
	const updateVoucherMutation = useUpdateVoucherMutation();
	const deleteVoucherMutation = useDeleteVoucherMutation();

	// Modal states
	const [showAddEditModal, setShowAddEditModal] = useState(false);
	const [editingVoucher, setEditingVoucher] = useState<any>(null);

	// Form states
	const [formCode, setFormCode] = useState("");
	const [formName, setFormName] = useState("");
	const [formDiscountType, setFormDiscountType] = useState<number>(0);
	const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
	const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number | "">("");
	const [formMinOrderValue, setFormMinOrderValue] = useState<number | "">("");
	const [formStartDate, setFormStartDate] = useState("");
	const [formEndDate, setFormEndDate] = useState("");
	const [formUsageLimit, setFormUsageLimit] = useState<number | "">("");
	const [formIsActive, setFormIsActive] = useState(true);

	const handleOpenAdd = () => {
		setEditingVoucher(null);
		setFormCode("");
		setFormName("");
		setFormDiscountType(0);
		setFormDiscountValue(0);
		setFormMaxDiscountAmount("");
		setFormMinOrderValue("");
		setFormStartDate("");
		setFormEndDate("");
		setFormUsageLimit("");
		setFormIsActive(true);
		setShowAddEditModal(true);
	};

	const handleOpenEdit = (voucher: any) => {
		setEditingVoucher(voucher);
		setFormCode(voucher.code || "");
		setFormName(voucher.name ?? "");
		setFormDiscountType(voucher.discountType ?? 0);
		setFormDiscountValue(voucher.discountValue ?? 0);
		setFormMaxDiscountAmount(voucher.maxDiscountAmount ?? "");
		setFormMinOrderValue(voucher.minOrderValue ?? "");
		setFormStartDate(voucher.startDate ? voucher.startDate.slice(0, 16) : "");
		setFormEndDate(voucher.endDate ? voucher.endDate.slice(0, 16) : "");
		setFormUsageLimit(voucher.maxUsageCount ?? "");
		setFormIsActive(voucher.isActive ?? true);
		setShowAddEditModal(true);
	};

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formCode || formDiscountValue <= 0 || !formStartDate || !formEndDate) {
			toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
			return;
		}

		if (new Date(formStartDate) >= new Date(formEndDate)) {
			toast.error("Ngày bắt đầu phải trước ngày kết thúc!");
			return;
		}

		const basePayload = {
			code: formCode.trim().toUpperCase(),
			name: formName.trim(),
			discountType: Number(formDiscountType),
			discountValue: Number(formDiscountValue),
			maxDiscountAmount: formMaxDiscountAmount !== "" ? Number(formMaxDiscountAmount) : null,
			minOrderValue: formMinOrderValue !== "" ? Number(formMinOrderValue) : null,
			startDate: new Date(formStartDate).toISOString(),
			endDate: new Date(formEndDate).toISOString(),
			maxUsageCount: formUsageLimit !== "" ? Number(formUsageLimit) : null,
			isActive: formIsActive,
			shopId: currentShopId,
		};

		if (editingVoucher) {
			updateVoucherMutation.mutate(
				{ id: editingVoucher.id, payload: basePayload },
				{
					onSuccess: () => {
						toast.success("Cập nhật voucher thành công!");
						setShowAddEditModal(false);
					},
					onError: (err: any) => {
						toast.error(
							err?.response?.data?.message ||
								err?.response?.data ||
								"Cập nhật voucher thất bại!",
						);
					},
				},
			);
		} else {
			createVoucherMutation.mutate(basePayload, {
				onSuccess: () => {
					toast.success("Tạo voucher thành công!");
					setShowAddEditModal(false);
				},
				onError: (err: any) => {
					toast.error(
						err?.response?.data?.message ||
							err?.response?.data ||
							"Tạo voucher thất bại!",
					);
				},
			});
		}
	};

	const handleDelete = (voucherId: string) => {
		if (window.confirm("Bạn có chắc chắn muốn ngừng kích hoạt (Xóa) mã voucher này?")) {
			deleteVoucherMutation.mutate(voucherId, {
				onSuccess: () => {
					toast.success("Đã ngưng hoạt động voucher thành công!");
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Thao tác thất bại!");
				},
			});
		}
	};

	// Pagination Calculations
	const isDataArray = Array.isArray(data);
	const itemsList = isDataArray ? data : data?.items || [];
	const totalItems = isDataArray ? data.length : data?.totalCount || 0;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Standardized Header */}
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
						<Ticket className="w-4 h-4 text-brand-primary" />
						Quản lý khuyến mãi & mã giảm giá
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Tạo và quản lý các voucher khuyến mãi riêng của cửa hàng để kích cầu mua sắm
					</p>
				</div>
				<button
					onClick={handleOpenAdd}
					className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none"
				>
					<Plus className="w-4 h-4" />
					Tạo Voucher Mới
				</button>
			</div>

			{/* Filters / Search box */}
			<div className="bg-white border border-brand-border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-end">
				<div className="flex-1 w-full space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Tìm theo mã voucher
					</label>
					<div className="relative">
						<input
							type="text"
							placeholder="Nhập mã voucher (ví dụ: SHOP50K)..."
							value={codeSearch}
							onChange={(e) => {
								setCodeSearch(e.target.value);
								setPage(1);
							}}
							className="w-full h-8 pl-8 pr-3 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
						/>
						<Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-brand-muted" />
					</div>
				</div>

				<div className="w-full md:w-40 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Loại giảm giá
					</label>
					<select
						value={selectedDiscountType ?? ""}
						onChange={(e) => {
							const val = e.target.value;
							setSelectedDiscountType(val !== "" ? Number(val) : undefined);
							setPage(1);
						}}
						className="w-full h-8 px-2.5 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
					>
						<option value="">Tất cả loại</option>
						<option value="0">Giảm tiền mặt (Fixed)</option>
						<option value="1">Giảm theo % (Percentage)</option>
					</select>
				</div>

				<div className="w-full md:w-40 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">
						Trạng thái
					</label>
					<select
						value={selectedIsActive === undefined ? "" : String(selectedIsActive)}
						onChange={(e) => {
							const val = e.target.value;
							setSelectedIsActive(val !== "" ? val === "true" : undefined);
							setPage(1);
						}}
						className="w-full h-8 px-2.5 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
					>
						<option value="">Tất cả</option>
						<option value="true">Đang kích hoạt</option>
						<option value="false">Tạm ngưng</option>
					</select>
				</div>
			</div>

			{/* Voucher Table List */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-16 text-brand-muted text-xs gap-2">
					<Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
					Đang tải danh sách voucher...
				</div>
			) : itemsList && itemsList.length > 0 ? (
				<div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-brand-dark border-collapse">
							<thead className="bg-brand-light-soft/40 border-b border-brand-border text-[10px] font-extrabold uppercase text-brand-muted">
								<tr>
									<th className="p-3 text-left w-24">Mã Code</th>
									<th className="p-3 text-left min-w-[130px]">Tên Voucher</th>
									<th className="p-3 text-center w-28">Loại Giảm</th>
									<th className="p-3 text-left min-w-[130px]">Giá Trị Giảm</th>
									<th className="p-3 text-left w-28">Đơn Tối Thiểu</th>
									<th className="p-3 text-left min-w-[130px]">Thời Hạn</th>
									<th className="p-3 text-center w-28">Đã Dùng / Tối Đa</th>
									<th className="p-3 text-center w-24">Trạng Thái</th>
									<th className="p-3 text-center w-16">Thao Tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border/60 font-semibold text-xs">
								{itemsList.map((voucher: any) => (
									<tr key={voucher.id} className="hover:bg-brand-light-soft/10 transition-colors">
										<td className="p-3 font-mono font-black text-brand-dark uppercase">
											{voucher.code}
										</td>
										<td className="p-3 text-brand-dark font-bold whitespace-normal break-words max-w-[160px] leading-tight">
											{voucher.name || "—"}
										</td>
										<td className="p-3 text-center">
											{voucher.discountType === 1 || voucher.discountType === "Percentage" ? (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-200">
													<Percent className="w-3 h-3" /> Phần trăm
												</span>
											) : (
												<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200">
													<DollarSign className="w-3 h-3" /> Cố định
												</span>
											)}
										</td>
										<td className="p-3 text-brand-dark font-extrabold whitespace-normal break-words max-w-[140px] leading-tight">
											{voucher.discountType === 1 || voucher.discountType === "Percentage"
												? `${voucher.discountValue}% (Tối đa ${(voucher.maxDiscountAmount || 0).toLocaleString("vi-VN")}đ)`
												: `${voucher.discountValue.toLocaleString("vi-VN")}đ`}
										</td>
										<td className="p-3 text-brand-muted font-bold whitespace-nowrap">
											{(voucher.minOrderValue || 0).toLocaleString("vi-VN")}đ
										</td>
										<td className="p-3">
											<div className="flex items-center gap-1 text-[10px] text-brand-muted font-bold whitespace-normal leading-tight">
												<Calendar className="w-3.5 h-3.5 shrink-0 text-brand-muted/70" />
												<div className="flex flex-col">
													<span>{new Date(voucher.startDate).toLocaleDateString("vi-VN")}</span>
													<span className="text-[9px] font-normal text-brand-muted/80">
														- {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
													</span>
												</div>
											</div>
										</td>
										<td className="p-3 text-center font-black text-brand-dark">
											{voucher.maxUsageCount
												? `${voucher.usageCount || 0} / ${voucher.maxUsageCount}`
												: `${voucher.usageCount || 0} (Không H.Hạn)`}
										</td>
										<td className="p-3 text-center">
											<span
												className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
													voucher.isActive
														? "text-emerald-700 bg-emerald-50 border border-emerald-200"
														: "text-rose-600 bg-rose-50 border border-rose-200"
												}`}
											>
												{voucher.isActive ? "Kích Hoạt" : "Tạm Ngưng"}
											</span>
										</td>
										<td className="p-3 text-center">
											<div className="flex items-center justify-center gap-1">
												<button
													onClick={() => handleOpenEdit(voucher)}
													className="p-1 border border-brand-border hover:border-brand-primary hover:bg-brand-primary/10 rounded text-brand-muted hover:text-brand-dark cursor-pointer bg-white transition-all"
													title="Chỉnh sửa"
												>
													<Edit className="w-3.5 h-3.5" />
												</button>
												{voucher.isActive && (
													<button
														onClick={() => handleDelete(voucher.id)}
														className="p-1 border border-brand-border hover:border-red-500 hover:bg-red-50 rounded text-brand-muted hover:text-red-500 cursor-pointer bg-white transition-all"
														title="Ngưng hoạt động"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="px-4 py-2.5 border-t border-brand-border flex justify-between items-center bg-brand-light-soft/20 text-xs">
						<span className="font-bold text-brand-muted">
							Tổng cộng: {totalItems} voucher
						</span>
						<div className="flex gap-1.5">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="h-7 px-2.5 border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								Trước
							</button>
							<div className="h-7 flex items-center px-2.5 border border-brand-border rounded-lg bg-brand-primary/10 text-brand-dark font-black text-xs">
								{page} / {totalPages}
							</div>
							<button
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="h-7 px-2.5 border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								Sau
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="border border-brand-border border-dashed rounded-xl p-12 text-center text-brand-muted space-y-3">
					<Ticket className="w-10 h-10 mx-auto text-brand-muted/60" />
					<div className="space-y-1">
						<h3 className="text-xs font-bold text-brand-dark">Không tìm thấy voucher nào</h3>
						<p className="text-[11px]">Bấm nút Tạo Voucher Mới để khởi tạo chương trình khuyến mãi cho shop.</p>
					</div>
				</div>
			)}

			{/* Add/Edit Modal */}
			{showAddEditModal && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="bg-white border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setShowAddEditModal(false)}
							className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-base font-black text-brand-dark border-b border-brand-border pb-3 flex items-center gap-2">
							<Ticket className="w-5 h-5 text-brand-primary" />
							{editingVoucher ? "Chỉnh sửa Voucher Shop" : "Tạo Voucher Shop Mới"}
						</h2>

						<form onSubmit={handleSave} className="space-y-3.5 text-xs text-brand-dark font-bold">
							<div className="space-y-1">
								<label className="font-bold text-brand-muted">
									Mã Voucher <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ví dụ: SHOP50K"
									value={formCode}
									disabled={!!editingVoucher}
									onChange={(e) => setFormCode(e.target.value)}
									className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold uppercase disabled:bg-slate-50"
								/>
							</div>

							<div className="space-y-1">
								<label className="font-bold text-brand-muted">
									Tên Voucher <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ví dụ: Ưu đãi độc quyền từ Shop"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Loại giảm giá</label>
									<div className="flex gap-2 h-9">
										<button
											type="button"
											onClick={() => {
												setFormDiscountType(0);
												setFormMaxDiscountAmount("");
											}}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${
												formDiscountType === 0
													? "bg-brand-primary border-brand-primary text-brand-dark shadow-xs"
													: "bg-white border-brand-border text-brand-muted hover:bg-slate-50"
											}`}
										>
											Tiền mặt (Fixed)
										</button>
										<button
											type="button"
											onClick={() => setFormDiscountType(1)}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${
												formDiscountType === 1
													? "bg-brand-primary border-brand-primary text-brand-dark shadow-xs"
													: "bg-white border-brand-border text-brand-muted hover:bg-slate-50"
											}`}
										>
											Phần trăm (%)
										</button>
									</div>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">
										Giá trị giảm <span className="text-red-500">*</span>
									</label>
									<input
										type="number"
										placeholder={formDiscountType === 1 ? "Nhập % (1-100)" : "Nhập số tiền..."}
										value={formDiscountValue || ""}
										onChange={(e) => setFormDiscountValue(Number(e.target.value))}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Đơn tối thiểu (đ)</label>
									<input
										type="number"
										placeholder="Ví dụ: 100000"
										value={formMinOrderValue}
										onChange={(e) =>
											setFormMinOrderValue(e.target.value ? Number(e.target.value) : "")
										}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Giảm tối đa (đ)</label>
									<input
										type="number"
										placeholder={formDiscountType === 0 ? "Bỏ qua (Tiền cố định)" : "Ví dụ: 50000"}
										disabled={formDiscountType === 0}
										value={formMaxDiscountAmount}
										onChange={(e) =>
											setFormMaxDiscountAmount(e.target.value ? Number(e.target.value) : "")
										}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">
										Ngày bắt đầu <span className="text-red-500">*</span>
									</label>
									<input
										type="datetime-local"
										value={formStartDate}
										onChange={(e) => setFormStartDate(e.target.value)}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
										required
									/>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">
										Ngày kết thúc <span className="text-red-500">*</span>
									</label>
									<input
										type="datetime-local"
										value={formEndDate}
										onChange={(e) => setFormEndDate(e.target.value)}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Lượt sử dụng tối đa</label>
									<input
										type="number"
										placeholder="Bỏ trống nếu không giới hạn"
										value={formUsageLimit}
										onChange={(e) =>
											setFormUsageLimit(e.target.value ? Number(e.target.value) : "")
										}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								<div className="space-y-1 flex flex-col justify-end">
									<label className="flex items-center gap-2 py-2 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={formIsActive}
											onChange={(e) => setFormIsActive(e.target.checked)}
											className="accent-brand-primary w-4 h-4"
										/>
										<span className="text-xs text-brand-dark font-bold">
											Kích hoạt ngay lập tức
										</span>
									</label>
								</div>
							</div>

							<div className="flex gap-3 pt-3 border-t border-brand-border/60">
								<button
									type="button"
									onClick={() => setShowAddEditModal(false)}
									className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-lg transition-colors cursor-pointer bg-white"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={createVoucherMutation.isPending || updateVoucherMutation.isPending}
									className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
								>
									{(createVoucherMutation.isPending || updateVoucherMutation.isPending) && (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									)}
									{editingVoucher ? "Lưu thay đổi" : "Lưu lại"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
