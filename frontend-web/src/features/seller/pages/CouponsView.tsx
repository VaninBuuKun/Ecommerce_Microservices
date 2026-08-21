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
import { useSellerStore } from "../stores";
import {
	useSellerProfileQuery,
	useSellerVouchersQuery,
	useCreateVoucherMutation,
	useUpdateVoucherMutation,
	useDeleteVoucherMutation,
} from "../hooks";

export default function CouponsView() {
	const { shopId } = useParams<{ shopId?: string }>();
	const { activeShop } = useSellerStore();
	const { data: profile } = useSellerProfileQuery();

	const resolvedShop =
		activeShop ??
		profile?.shops.find((shop) => String(shop.id) === shopId) ??
		profile?.shops[0] ??
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
	const [formDiscountType, setFormDiscountType] = useState<number>(0); // 0: Fixed, 1: Percent
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

		// Chuẩn hóa dữ liệu gửi lên chung cho cả Create và Update
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
			const updatePayload = {
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

			updateVoucherMutation.mutate(
				{ id: editingVoucher.id, payload: updatePayload },
				{
					onSuccess: () => {
						toast.success("Cập nhật voucher thành công!");
						setShowAddEditModal(false);
					},
					onError: (err: any) => {
						toast.error(err?.response?.data?.message || err?.response?.data || "Cập nhật voucher thất bại!");
					},
				}
			);
		} else {
			createVoucherMutation.mutate(basePayload, {
				onSuccess: () => {
					toast.success("Tạo voucher thành công!");
					setShowAddEditModal(false);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data?.message || err?.response?.data || "Tạo voucher thất bại!");
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
	const itemsList = isDataArray ? data : (data?.items || []);
	const totalItems = isDataArray ? data.length : (data?.totalCount || 0);
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	return (
		<div className="space-y-6 text-left">
			{/* Title & Add Button */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-xl font-extrabold text-brand-dark mb-1 flex items-center gap-2">
						<Ticket className="w-6 h-6 text-brand-primary" />
						Quản lý Mã Giảm Giá
					</h1>
					<p className="text-xs text-brand-muted">
						Tạo và quản lý các voucher khuyến mãi của shop để tăng trưởng doanh số.
					</p>
				</div>
				<button
					onClick={handleOpenAdd}
					className="inline-flex items-center gap-1.5 h-10 px-4 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-xl shadow transition-all cursor-pointer border-none"
				>
					<Plus className="w-4 h-4" />
					Tạo Voucher Mới
				</button>
			</div>

			{/* Filters / Search box */}
			<div className="bg-white border border-brand-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
				<div className="flex-1 w-full space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">Tìm theo mã voucher</label>
					<div className="relative">
						<input
							type="text"
							placeholder="Nhập mã voucher (ví dụ: SHOP50K)..."
							value={codeSearch}
							onChange={(e) => {
								setCodeSearch(e.target.value);
								setPage(1);
							}}
							className="w-full h-9 pl-9 pr-3 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
						/>
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-muted" />
					</div>
				</div>

				<div className="w-full md:w-44 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">Loại giảm giá</label>
					<select
						value={selectedDiscountType ?? ""}
						onChange={(e) => {
							const val = e.target.value;
							setSelectedDiscountType(val !== "" ? Number(val) : undefined);
							setPage(1);
						}}
						className="w-full h-9 px-3 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
					>
						<option value="">Tất cả loại</option>
						<option value="0">Giảm tiền mặt (Fixed)</option>
						<option value="1">Giảm theo % (Percentage)</option>
					</select>
				</div>

				<div className="w-full md:w-44 space-y-1">
					<label className="text-[10px] font-bold text-brand-muted uppercase">Trạng thái</label>
					<select
						value={selectedIsActive === undefined ? "" : String(selectedIsActive)}
						onChange={(e) => {
							const val = e.target.value;
							setSelectedIsActive(val !== "" ? val === "true" : undefined);
							setPage(1);
						}}
						className="w-full h-9 px-3 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
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
					<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
					Đang tải danh sách voucher...
				</div>
			) : itemsList && itemsList.length > 0 ? (
				<div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-brand-dark">
							<thead className="bg-brand-light-soft/40 border-b border-brand-border text-[10px] font-bold uppercase text-brand-muted">
								<tr>
									<th className="px-5 py-3 text-left">Mã Code</th>
									<th className="px-5 py-3 text-left">Tên Voucher</th>
									<th className="px-5 py-3 text-left">Loại Giảm</th>
									<th className="px-5 py-3 text-left">Giá Trị Giảm</th>
									<th className="px-5 py-3 text-left">Đơn Hàng Tối Thiểu</th>
									<th className="px-5 py-3 text-left">Thời Hạn</th>
									<th className="px-5 py-3 text-center">Giới Hạn / Đã Dùng</th>
									<th className="px-5 py-3 text-center">Trạng Thái</th>
									<th className="px-5 py-3 text-center">Thao Tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border/60 font-semibold">
								{itemsList.map((voucher: any) => (
									<tr key={voucher.id} className="hover:bg-brand-light-soft/10">
										<td className="px-5 py-4 font-black text-brand-dark">{voucher.code}</td>
										<td className="px-5 py-4 text-brand-dark">{voucher.name || "—"}</td>
										<td className="px-5 py-4">
											{voucher.discountType === 0 || voucher.discountType === "Percentage" ? (
												<span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-150">
													<Percent className="w-3 h-3" /> Phần trăm
												</span>
											) : (
												<span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold text-green-600 bg-green-50 border border-green-150">
													<DollarSign className="w-3 h-3" /> Cố định
												</span>
											)}
										</td>
										<td className="px-5 py-4 text-brand-dark">
											{voucher.discountType === 0 || voucher.discountType === "Percentage"
												? `${voucher.discountValue}% (Tối đa ${(voucher.maxDiscountAmount || 0).toLocaleString("vi-VN")}đ)`
												: `${voucher.discountValue.toLocaleString("vi-VN")}đ`}
										</td>
										<td className="px-5 py-4 text-brand-muted">
											{(voucher.minOrderValue || 0).toLocaleString("vi-VN")}đ
										</td>
										<td className="px-5 py-4">
											<div className="flex items-center gap-1 text-[10px] text-brand-muted">
												<Calendar className="w-3.5 h-3.5" />
												<span>
													{new Date(voucher.startDate).toLocaleDateString("vi-VN")} - {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
												</span>
											</div>
										</td>
										<td className="px-5 py-4 text-center text-brand-dark">
											{voucher.maxUsageCount ? `${voucher.usageCount || 0} / ${voucher.maxUsageCount}` : `${voucher.usageCount || 0} (Không hạn chế)`}
										</td>
										<td className="px-5 py-4 text-center">
											<span
												className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${voucher.isActive
													? "text-green-600 bg-green-50 border border-green-200"
													: "text-red-500 bg-red-50 border border-red-200"
													}`}
											>
												{voucher.isActive ? "Kích Hoạt" : "Tạm Ngưng"}
											</span>
										</td>
										<td className="px-5 py-4 text-center">
											<div className="flex items-center justify-center gap-2">
												<button
													onClick={() => handleOpenEdit(voucher)}
													className="p-1.5 border border-brand-border hover:border-brand-primary hover:bg-brand-primary/10 rounded-lg text-brand-muted hover:text-brand-dark cursor-pointer bg-white transition-all"
													title="Chỉnh sửa"
												>
													<Edit className="w-3.5 h-3.5" />
												</button>
												{voucher.isActive && (
													<button
														onClick={() => handleDelete(voucher.id)}
														className="p-1.5 border border-brand-border hover:border-red-500 hover:bg-red-50 rounded-lg text-brand-muted hover:text-red-500 cursor-pointer bg-white transition-all"
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

					{/* Pagination Controls */}
					<div className="px-5 py-3 border-t border-brand-border flex justify-between items-center bg-brand-light-soft/20 text-xs">
						<span className="font-bold text-brand-muted">Tổng cộng: {totalItems} voucher</span>
						<div className="flex gap-2">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="h-8 px-3 border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								Trước
							</button>
							<div className="h-8 flex items-center px-3 border border-brand-border rounded-lg bg-brand-primary/10 text-brand-dark font-black">
								{page} / {totalPages}
							</div>
							<button
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="h-8 px-3 border border-brand-border rounded-lg bg-white hover:bg-brand-light-soft font-bold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
							>
								Sau
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="border border-brand-border border-dashed rounded-xl p-12 text-center text-brand-muted space-y-4">
					<Ticket className="w-12 h-12 mx-auto text-brand-muted/60" />
					<div className="space-y-1">
						<h3 className="text-sm font-bold text-brand-dark">Không tìm thấy voucher nào</h3>
						<p className="text-xs">Bấm nút Tạo Voucher Mới để khởi tạo chương trình khuyến mãi đầu tiên.</p>
					</div>
				</div>
			)}

			{/* Add/Edit Modal Overlay */}
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
							{editingVoucher ? "Chỉnh sửa Voucher" : "Tạo Voucher Mới"}
						</h2>

						<form onSubmit={handleSave} className="space-y-3.5 text-xs text-brand-dark">
							{/* Voucher Code */}
							<div className="space-y-1">
								<label className="font-bold text-brand-muted">Mã Voucher <span className="text-red-500">*</span></label>
								<input
									type="text"
									placeholder="Ví dụ: VOUCHER50K"
									value={formCode}
									onChange={(e) => setFormCode(e.target.value)}
									className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold uppercase"
								/>
							</div>

							{/* Voucher Name */}
							<div className="space-y-1">
								<label className="font-bold text-brand-muted">Tên Voucher <span className="text-red-500">*</span></label>
								<input
									type="text"
									placeholder="Ví dụ: Giảm giá ngày hè cực hot"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{/* Discount Type */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Loại giảm giá</label>
									<div className="flex gap-2 h-9">
										<button
											type="button"
											onClick={() => {
												setFormDiscountType(1);
												setFormMaxDiscountAmount("");
											}}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === 1
													? "bg-brand-primary border-brand-primary text-brand-dark shadow-sm"
													: "bg-brand-light-soft/20 border-brand-border text-brand-muted hover:bg-brand-light-soft/50"
												}`}
										>
											Cố định tiền mặt
										</button>
										<button
											type="button"
											onClick={() => setFormDiscountType(0)}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === 0
													? "bg-brand-primary border-brand-primary text-brand-dark shadow-sm"
													: "bg-brand-light-soft/20 border-brand-border text-brand-muted hover:bg-brand-light-soft/50"
												}`}
										>
											Theo phần trăm (%)
										</button>
									</div>
								</div>

								{/* Discount Value */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Giá trị giảm <span className="text-red-500">*</span></label>
									<input
										type="number"
										placeholder={formDiscountType === 0 ? "Ví dụ: 10 (%)" : "Ví dụ: 20000"}
										value={formDiscountValue}
										onChange={(e) => setFormDiscountValue(Number(e.target.value))}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold"
									/>
								</div>
							</div>

							<div className={formDiscountType === 0 ? "grid grid-cols-2 gap-4" : "block"}>
								{/* Max Discount Amount - Show only for Percentage type */}
								{formDiscountType === 0 && (
									<div className="space-y-1">
										<label className="font-bold text-brand-muted">Giảm tối đa (đối với %)</label>
										<input
											type="number"
											placeholder="Bỏ trống nếu không giới hạn"
											value={formMaxDiscountAmount}
											onChange={(e) => setFormMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
											className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
										/>
									</div>
								)}

								{/* Min Order Value */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Đơn tối thiểu áp dụng</label>
									<input
										type="number"
										placeholder="Bỏ trống nếu = 0đ"
										value={formMinOrderValue}
										onChange={(e) => setFormMinOrderValue(e.target.value === "" ? "" : Number(e.target.value))}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{/* Start Date */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Ngày bắt đầu <span className="text-red-500">*</span></label>
									<input
										type="datetime-local"
										value={formStartDate}
										onChange={(e) => setFormStartDate(e.target.value)}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								{/* End Date */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Ngày kết thúc <span className="text-red-500">*</span></label>
									<input
										type="datetime-local"
										value={formEndDate}
										onChange={(e) => setFormEndDate(e.target.value)}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 items-center">
								{/* Usage Limit */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Giới hạn số lượt dùng</label>
									<input
										type="number"
										placeholder="Ví dụ: 100 lượt"
										value={formUsageLimit}
										onChange={(e) => setFormUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								{/* IsActive status */}
								<div className="space-y-2.5 pt-4">
									<label className="flex items-center gap-2 font-bold text-brand-dark cursor-pointer">
										<input
											type="checkbox"
											checked={formIsActive}
											onChange={(e) => setFormIsActive(e.target.checked)}
											className="w-4 h-4 accent-brand-primary cursor-pointer"
										/>
										Kích hoạt voucher ngay lập tức
									</label>
								</div>
							</div>

							<div className="flex gap-3 pt-4 border-t border-brand-border/60">
								<button
									type="button"
									onClick={() => setShowAddEditModal(false)}
									className="flex-1 h-10 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold rounded-lg transition-colors cursor-pointer bg-white"
								>
									Hủy bỏ
								</button>
								<button
									type="submit"
									disabled={createVoucherMutation.isPending || updateVoucherMutation.isPending}
									className="flex-1 h-10 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
								>
									{(createVoucherMutation.isPending || updateVoucherMutation.isPending) && (
										<Loader2 className="w-4 h-4 animate-spin" />
									)}
									Lưu Lại
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}