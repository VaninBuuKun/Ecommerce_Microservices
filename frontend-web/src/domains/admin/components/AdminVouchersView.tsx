import { useState } from "react";
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
	useAdminVouchersQuery,
	useCreateAdminVoucherMutation,
	useUpdateAdminVoucherMutation,
	useDeleteAdminVoucherMutation,
} from "@/domains/admin";
import { Pagination } from "@/shared/components/Pagination";

export function AdminVouchersView() {
	const [page, setPage] = useState(1);
	const [pageSize] = useState(8);
	const [codeSearch, setCodeSearch] = useState("");
	const [selectedDiscountType, setSelectedDiscountType] = useState<string | undefined>(undefined);
	const [selectedIsActive, setSelectedIsActive] = useState<boolean | undefined>(undefined);

	// React Query hooks
	const { data, isLoading } = useAdminVouchersQuery({
		page,
		pageSize,
		code: codeSearch ? codeSearch.toUpperCase().trim() : undefined,
		discountType: selectedDiscountType,
		isActive: selectedIsActive,
	});

	const createVoucherMutation = useCreateAdminVoucherMutation();
	const updateVoucherMutation = useUpdateAdminVoucherMutation();
	const deleteVoucherMutation = useDeleteAdminVoucherMutation();

	// Parse response
	const vouchers = Array.isArray(data) ? data : data?.items || [];
	const totalCount = Array.isArray(data) ? data.length : data?.totalCount || vouchers.length;
	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	const [showAddEditModal, setShowAddEditModal] = useState(false);
	const [editingVoucher, setEditingVoucher] = useState<any>(null);

	const [formCode, setFormCode] = useState("");
	const [formName, setFormName] = useState("");
	const [formDiscountType, setFormDiscountType] = useState<string>("FixedAmount");
	const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
	const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number | "">("");
	const [formMinOrderValue, setFormMinOrderValue] = useState<number | "">("");
	const [formStartDate, setFormStartDate] = useState("");
	const [formEndDate, setFormEndDate] = useState("");
	const [formUsageLimit, setFormUsageLimit] = useState<number | "">("");
	const [formIsActive, setFormIsActive] = useState(true);

	const getLocalISOString = (date: Date = new Date()) => {
		const tzOffset = date.getTimezoneOffset() * 60000;
		return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
	};

	const handleOpenAdd = () => {
		const now = new Date();
		const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		setEditingVoucher(null);
		setFormCode("");
		setFormName("");
		setFormDiscountType("FixedAmount");
		setFormDiscountValue(0);
		setFormMaxDiscountAmount("");
		setFormMinOrderValue("");
		setFormStartDate(getLocalISOString(now));
		setFormEndDate(getLocalISOString(nextWeek));
		setFormUsageLimit("");
		setFormIsActive(true);
		setShowAddEditModal(true);
	};

	const handleOpenEdit = (voucher: any) => {
		setEditingVoucher(voucher);
		setFormCode(voucher.code || "");
		setFormName(voucher.name ?? "");
		setFormDiscountType(
			voucher.discountType === "Percentage" || voucher.discountType === 1 ? "Percentage" : "FixedAmount",
		);
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
		const isPercent = formDiscountType === "Percentage";
		const valNum = Number(formDiscountValue);

		if (!formCode || valNum <= 0 || !formStartDate || !formEndDate) {
			toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
			return;
		}

		if (isPercent && (valNum < 1 || valNum > 100)) {
			toast.error("Giá trị giảm theo phần trăm phải nằm trong khoảng từ 1% đến 100%.");
			return;
		}

		if (!isPercent && valNum <= 0) {
			toast.error("Giá trị giảm theo số tiền cố định phải lớn hơn 0đ.");
			return;
		}

		if (new Date(formStartDate) >= new Date(formEndDate)) {
			toast.error("Ngày bắt đầu phải trước ngày kết thúc!");
			return;
		}

		const payload = {
			code: formCode.trim().toUpperCase(),
			name: formName.trim(),
			discountType: isPercent ? "Percentage" : "FixedAmount",
			discountValue: valNum,
			maxDiscountAmount: isPercent && formMaxDiscountAmount !== "" ? Number(formMaxDiscountAmount) : null,
			minOrderValue: formMinOrderValue !== "" ? Number(formMinOrderValue) : 0,
			startDate: new Date(formStartDate).toISOString(),
			endDate: new Date(formEndDate).toISOString(),
			maxUsageCount: formUsageLimit !== "" ? Number(formUsageLimit) : 1000,
			isActive: formIsActive,
			scope: "Platform",
			shopId: null,
		};

		if (editingVoucher) {
			updateVoucherMutation.mutate(
				{ id: editingVoucher.id, payload },
				{
					onSuccess: () => {
						toast.success("Cập nhật voucher thành công!");
						setShowAddEditModal(false);
					},
					onError: (err: any) => {
						toast.error(err?.response?.data?.message || err?.response?.data || "Thao tác voucher thất bại!");
					},
				},
			);
		} else {
			createVoucherMutation.mutate(payload, {
				onSuccess: () => {
					toast.success("Tạo voucher thành công!");
					setShowAddEditModal(false);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data?.message || err?.response?.data || "Thao tác voucher thất bại!");
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

	const getDatePart = (isoStr: string) => (isoStr ? isoStr.split("T")[0] : "");
	const getTimePart = (isoStr: string) => (isoStr && isoStr.includes("T") ? isoStr.split("T")[1].slice(0, 5) : "00:00");
	const combineDateTime = (dateStr: string, timeStr: string) => {
		if (!dateStr) return "";
		return `${dateStr}T${timeStr || "00:00"}`;
	};

	return (
		<div className="space-y-4 text-left font-sans animate-in fade-in duration-200">
			{/* Standardized Header */}
			<div className="flex justify-between items-center pb-2.5 border-b border-brand-border">
				<div>
					<h2 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
						<Ticket className="w-4 h-4 text-brand-primary" />
						Quản lý mã giảm giá hệ thống
					</h2>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Tạo và quản lý các mã giảm giá áp dụng toàn sàn (Platform Vouchers)
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
							placeholder="Nhập mã voucher (ví dụ: BLACKFRIDAY)..."
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
							setSelectedDiscountType(val !== "" ? val : undefined);
							setPage(1);
						}}
						className="w-full h-8 px-2.5 text-xs bg-brand-light-soft/30 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold cursor-pointer"
					>
						<option value="">Tất cả loại</option>
						<option value="FixedAmount">Giảm tiền mặt (Fixed)</option>
						<option value="Percentage">Giảm theo % (Percentage)</option>
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
			) : vouchers && vouchers.length > 0 ? (
				<div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-brand-dark border-collapse">
							<thead className="bg-brand-light-soft/40 border-b border-brand-border text-[10px] font-extrabold uppercase text-brand-muted">
								<tr>
									<th className="p-3 text-left w-24">Mã Code</th>
									<th className="p-3 text-left min-w-[130px]">Tên Voucher</th>
									<th className="p-3 text-center w-24">Phạm Vi</th>
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
								{vouchers.map((voucher: any) => (
									<tr key={voucher.id} className="hover:bg-brand-light-soft/10 transition-colors">
										<td className="p-3 font-mono font-black text-brand-dark uppercase">
											{voucher.code}
										</td>
										<td className="p-3 text-brand-dark font-bold whitespace-normal break-words max-w-[160px] leading-tight">
											{voucher.name || "—"}
										</td>
										<td className="p-3 text-center">
											<span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 inline-block">
												TOÀN SÀN
											</span>
										</td>
										<td className="p-3 text-center">
											{voucher.discountType === "Percentage" || voucher.discountType === 1 ? (
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
											{voucher.discountType === "Percentage" || voucher.discountType === 1
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
														đến {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
													</span>
												</div>
											</div>
										</td>
										<td className="p-3 text-center font-bold text-brand-dark whitespace-nowrap">
											{voucher.usageCount || 0} / {voucher.maxUsageCount || "∞"}
										</td>
										<td className="p-3 text-center">
											<span
												className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold ${voucher.isActive
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
													className="p-1 text-brand-muted hover:text-brand-primary rounded-md hover:bg-brand-light-soft transition-colors cursor-pointer border-none bg-transparent"
													title="Chỉnh sửa"
												>
													<Edit className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={() => handleDelete(voucher.id)}
													className="p-1 text-brand-muted hover:text-red-500 rounded-md hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent"
													title="Ngừng kích hoạt"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="px-4 py-3 border-t border-brand-border flex justify-between items-center bg-brand-light-soft/20 text-xs">
						<span className="font-bold text-brand-muted">
							Tổng cộng: {totalCount} voucher
						</span>
						<Pagination
							currentPage={page}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</div>
				</div>
			) : (
				<div className="border border-brand-border border-dashed rounded-xl p-12 text-center text-brand-muted space-y-3">
					<Ticket className="w-10 h-10 mx-auto text-brand-muted/60" />
					<div className="space-y-1">
						<h3 className="text-xs font-bold text-brand-dark">Không tìm thấy voucher nào</h3>
						<p className="text-[11px]">Bấm nút Tạo Voucher Mới để tạo chương trình ưu đãi toàn sàn.</p>
					</div>
				</div>
			)}

			{/* Add/Edit Modal */}
			{showAddEditModal && (
				<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
					<div className="bg-white border border-brand-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
						<button
							onClick={() => setShowAddEditModal(false)}
							className="absolute top-4 right-4 p-1 rounded-full hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
						>
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-base font-black text-brand-dark border-b border-brand-border pb-3 flex items-center gap-2">
							<Ticket className="w-5 h-5 text-brand-primary" />
							{editingVoucher ? "Chỉnh sửa Voucher Toàn Sàn" : "Tạo Voucher Toàn Sàn Mới"}
						</h2>

						<form onSubmit={handleSave} className="space-y-3.5 text-xs text-brand-dark font-bold">
							<div className="space-y-1">
								<label className="font-bold text-brand-muted">
									Mã Voucher <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Ví dụ: BLACKFRIDAY"
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
									placeholder="Ví dụ: Ưu đãi toàn sàn mua sắm bùng nổ"
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
												setFormDiscountType("FixedAmount");
												setFormMaxDiscountAmount("");
											}}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === "FixedAmount"
													? "bg-brand-primary border-brand-primary text-brand-dark shadow-xs"
													: "bg-white border-brand-border text-brand-muted hover:bg-slate-50"
												}`}
										>
											Tiền mặt (Fixed)
										</button>
										<button
											type="button"
											onClick={() => setFormDiscountType("Percentage")}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === "Percentage"
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
										Giá trị giảm {formDiscountType === "Percentage" ? "(%)" : "(đ)"} <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										inputMode="numeric"
										placeholder={formDiscountType === "Percentage" ? "Nhập % (1-100)..." : "Nhập số tiền..."}
										value={formDiscountValue || ""}
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9]/g, "");
											setFormDiscountValue(val ? Number(val) : 0);
										}}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Đơn tối thiểu (đ)</label>
									<input
										type="text"
										inputMode="numeric"
										placeholder="Ví dụ: 100000"
										value={formMinOrderValue}
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9]/g, "");
											setFormMinOrderValue(val ? Number(val) : "");
										}}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Giảm tối đa (đ)</label>
									<input
										type="text"
										inputMode="numeric"
										placeholder={formDiscountType === "FixedAmount" ? "Bỏ qua (Tiền cố định)" : "Ví dụ: 50000"}
										disabled={formDiscountType === "FixedAmount"}
										value={formMaxDiscountAmount}
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9]/g, "");
											setFormMaxDiscountAmount(val ? Number(val) : "");
										}}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">
										Thời gian bắt đầu <span className="text-red-500">*</span>
									</label>
									<div className="grid grid-cols-2 gap-2">
										<input
											type="date"
											value={getDatePart(formStartDate)}
											onChange={(e) =>
												setFormStartDate(combineDateTime(e.target.value, getTimePart(formStartDate)))
											}
											className="h-9 px-2 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold text-xs text-brand-dark cursor-pointer"
											required
										/>
										<input
											type="time"
											value={getTimePart(formStartDate)}
											onChange={(e) =>
												setFormStartDate(combineDateTime(getDatePart(formStartDate), e.target.value))
											}
											className="h-9 px-2 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold text-xs text-brand-dark cursor-pointer"
											required
										/>
									</div>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">
										Thời gian kết thúc <span className="text-red-500">*</span>
									</label>
									<div className="grid grid-cols-2 gap-2">
										<input
											type="date"
											value={getDatePart(formEndDate)}
											onChange={(e) =>
												setFormEndDate(combineDateTime(e.target.value, getTimePart(formEndDate)))
											}
											className="h-9 px-2 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold text-xs text-brand-dark cursor-pointer"
											required
										/>
										<input
											type="time"
											value={getTimePart(formEndDate)}
											onChange={(e) =>
												setFormEndDate(combineDateTime(getDatePart(formEndDate), e.target.value))
											}
											className="h-9 px-2 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold text-xs text-brand-dark cursor-pointer"
											required
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Lượt sử dụng tối đa</label>
									<input
										type="text"
										inputMode="numeric"
										placeholder="Bỏ trống nếu không giới hạn"
										value={formUsageLimit}
										onChange={(e) => {
											const val = e.target.value.replace(/[^0-9]/g, "");
											setFormUsageLimit(val ? Number(val) : "");
										}}
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
									className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-lg transition-colors cursor-pointer border-none"
								>
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
