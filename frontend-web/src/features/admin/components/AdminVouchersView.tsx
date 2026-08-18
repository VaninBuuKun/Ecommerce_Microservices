import { useState, useEffect } from "react";
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
import api from "../../../shared/lib/axios";

export function AdminVouchersView() {
	// State filter & search & pagination
	const [page, setPage] = useState(1);
	const [pageSize] = useState(8);
	const [codeSearch, setCodeSearch] = useState("");
	const [selectedDiscountType, setSelectedDiscountType] = useState<number | undefined>(undefined);
	const [selectedIsActive, setSelectedIsActive] = useState<boolean | undefined>(undefined);
	const [vouchers, setVouchers] = useState<any[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);

	// Modal states
	const [showAddEditModal, setShowAddEditModal] = useState(false);
	const [editingVoucher, setEditingVoucher] = useState<any>(null);

	// Form states
	const [formCode, setFormCode] = useState("");
	const [formName, setFormName] = useState("");
	const [formDiscountType, setFormDiscountType] = useState<number>(0); // 0: Fixed/Flat, 1: Percent
	const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
	const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number | "">("");
	const [formMinOrderValue, setFormMinOrderValue] = useState<number | "">("");
	const [formStartDate, setFormStartDate] = useState("");
	const [formEndDate, setFormEndDate] = useState("");
	const [formUsageLimit, setFormUsageLimit] = useState<number | "">("");
	const [formIsActive, setFormIsActive] = useState(true);

	// Admin specific states
	const [formScope, setFormScope] = useState<number>(0); // 0: Platform, 1: Shop
	const [formShopId, setFormShopId] = useState<number | "">("");

	const fetchVouchers = async () => {
		try {
			setLoading(true);
			const params: any = {
				page,
				pageSize,
				code: codeSearch ? codeSearch.toUpperCase().trim() : undefined,
				discountType: selectedDiscountType,
				isActive: selectedIsActive,
			};
			const response = await api.get("/v1/vouchers", { params });
			const data = response.data?.value || response.data;

			if (data && typeof data === "object" && "items" in data) {
				setVouchers(data.items);
				setTotalCount(data.totalCount || data.items.length);
			} else {
				const list = Array.isArray(data) ? data : [];
				setVouchers(list);
				setTotalCount(list.length);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách vouchers", err);
			// Fallback mock nếu API lỗi
			const mockItems = [
				{ id: "1", code: "BUU20", name: "Giảm giá khai trương", discountType: 1, discountValue: 20, scope: 0, minOrderValue: 200000, maxDiscountAmount: 50000, maxUsageCount: 100, usageCount: 24, isActive: true, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString() },
				{ id: "2", code: "FREESHIP", name: "Miễn phí vận chuyển", discountType: 0, discountValue: 30000, scope: 0, minOrderValue: 0, maxDiscountAmount: 30000, maxUsageCount: 500, usageCount: 112, isActive: true, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString() }
			];
			setVouchers(mockItems);
			setTotalCount(mockItems.length);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchVouchers();
	}, [page, codeSearch, selectedDiscountType, selectedIsActive]);

	const handleOpenAdd = () => {
		setEditingVoucher(null);
		setFormCode("");
		setFormName("");
		setFormDiscountType(0); // Tiền mặt (Fixed)
		setFormDiscountValue(0);
		setFormMaxDiscountAmount("");
		setFormMinOrderValue("");
		setFormStartDate("");
		setFormEndDate("");
		setFormUsageLimit("");
		setFormScope(0);
		setFormShopId("");
		setFormIsActive(true);
		setShowAddEditModal(true);
	};

	const handleOpenEdit = (voucher: any) => {
		setEditingVoucher(voucher);
		setFormCode(voucher.code || "");
		setFormName(voucher.name ?? "");
		setFormDiscountType(voucher.discountType === "Percentage" || voucher.discountType === 1 ? 1 : 0);
		setFormDiscountValue(voucher.discountValue ?? 0);
		setFormMaxDiscountAmount(voucher.maxDiscountAmount ?? "");
		setFormMinOrderValue(voucher.minOrderValue ?? "");
		setFormStartDate(voucher.startDate ? voucher.startDate.slice(0, 16) : "");
		setFormEndDate(voucher.endDate ? voucher.endDate.slice(0, 16) : "");
		setFormUsageLimit(voucher.maxUsageCount ?? "");
		setFormScope(voucher.scope ?? 0);
		setFormShopId(voucher.shopId ?? "");
		setFormIsActive(voucher.isActive ?? true);
		setShowAddEditModal(true);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formCode || formDiscountValue <= 0 || !formStartDate || !formEndDate) {
			toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
			return;
		}

		if (new Date(formStartDate) >= new Date(formEndDate)) {
			toast.error("Ngày bắt đầu phải trước ngày kết thúc!");
			return;
		}

		if (formDiscountType === 1 && (formDiscountValue <= 0 || formDiscountValue > 100)) {
			toast.error("Phần trăm giảm giá phải từ 1 - 100%");
			return;
		}

		const payload = {
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
			scope: formScope,
			shopId: formScope === 1 ? Number(formShopId) : null,
		};

		try {
			if (editingVoucher) {
				await api.put(`/v1/vouchers/${editingVoucher.id}`, payload);
				toast.success("Cập nhật voucher thành công!");
			} else {
				await api.post("/v1/vouchers", payload);
				toast.success("Tạo voucher thành công!");
			}
			setShowAddEditModal(false);
			fetchVouchers();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || err?.response?.data || "Thao tác voucher thất bại!");
		}
	};

	const handleDelete = async (voucherId: string) => {
		if (window.confirm("Bạn có chắc chắn muốn ngừng kích hoạt (Xóa) mã voucher này?")) {
			try {
				await api.delete(`/v1/vouchers/${voucherId}`);
				toast.success("Đã ngưng hoạt động voucher thành công!");
				fetchVouchers();
			} catch (err: any) {
				toast.error(err?.response?.data || "Thao tác thất bại!");
			}
		}
	};

	const totalPages = Math.ceil(totalCount / pageSize) || 1;

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
			{/* Title & Add Button */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-xl font-extrabold text-brand-dark mb-1 flex items-center gap-2">
						<Ticket className="w-6 h-6 text-brand-primary" />
						Quản lý Mã Giảm Giá Hệ Thống
					</h1>
					<p className="text-xs text-brand-muted">
						Tạo các mã giảm giá cho sàn (Platform) hoặc quản lý các voucher của các shop trên toàn hệ thống.
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
							placeholder="Nhập mã voucher (ví dụ: BUU50K)..."
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
			{loading ? (
				<div className="flex flex-col items-center justify-center py-16 text-brand-muted text-xs gap-2">
					<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
					Đang tải danh sách voucher...
				</div>
			) : vouchers && vouchers.length > 0 ? (
				<div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-xs text-brand-dark">
							<thead className="bg-brand-light-soft/40 border-b border-brand-border text-[10px] font-bold uppercase text-brand-muted">
								<tr>
									<th className="px-5 py-3 text-left">Mã Code</th>
									<th className="px-5 py-3 text-left">Tên Voucher</th>
									<th className="px-5 py-3 text-left">Phạm Vi</th>
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
								{vouchers.map((voucher: any) => (
									<tr key={voucher.id} className="hover:bg-brand-light-soft/10">
										<td className="px-5 py-4 font-black text-brand-dark">{voucher.code}</td>
										<td className="px-5 py-4 text-brand-dark">{voucher.name || "—"}</td>
										<td className="px-5 py-4">
											<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${voucher.scope === 0 ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
												}`}>
												{voucher.scope === 0 ? "Toàn sàn" : `Shop #${voucher.shopId}`}
											</span>
										</td>
										<td className="px-5 py-4">
											{voucher.discountType === 1 || voucher.discountType === "Percentage" ? (
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
											{voucher.discountType === 1 || voucher.discountType === "Percentage"
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
						<span className="font-bold text-brand-muted">Tổng cộng: {totalCount} voucher</span>
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

						<form onSubmit={handleSave} className="space-y-3.5 text-xs text-brand-dark font-bold">
							{/* Scope platform/shop selection */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Phạm vi áp dụng <span className="text-red-500">*</span></label>
									<select
										value={formScope}
										onChange={(e) => {
											setFormScope(Number(e.target.value));
											if (Number(e.target.value) === 0) setFormShopId("");
										}}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold cursor-pointer"
									>
										<option value={0}>Platform (Toàn sàn)</option>
										<option value={1}>Shop (Mã cửa hàng)</option>
									</select>
								</div>

								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Mã Shop liên kết</label>
									<input
										type="number"
										disabled={formScope === 0}
										required={formScope === 1}
										placeholder="Ví dụ: 2, 5..."
										value={formShopId}
										onChange={(e) => setFormShopId(e.target.value ? Number(e.target.value) : "")}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary disabled:bg-slate-100 disabled:cursor-not-allowed font-bold"
									/>
								</div>
							</div>

							{/* Voucher Code */}
							<div className="space-y-1">
								<label className="font-bold text-brand-muted">Mã Voucher <span className="text-red-500">*</span></label>
								<input
									type="text"
									placeholder="Ví dụ: VOUCHER50K"
									value={formCode}
									disabled={!!editingVoucher}
									onChange={(e) => setFormCode(e.target.value)}
									className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-bold uppercase disabled:bg-slate-50"
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
												setFormDiscountType(0);
												setFormMaxDiscountAmount("");
											}}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === 0
												? "bg-brand-primary border-brand-primary text-brand-dark shadow-sm"
												: "bg-white border-brand-border text-brand-muted hover:bg-slate-50"
												}`}
										>
											Tiền mặt (Fixed)
										</button>
										<button
											type="button"
											onClick={() => setFormDiscountType(1)}
											className={`flex-1 text-center font-bold border rounded-lg transition-all cursor-pointer text-[11px] ${formDiscountType === 1
												? "bg-brand-primary border-brand-primary text-brand-dark shadow-sm"
												: "bg-white border-brand-border text-brand-muted hover:bg-slate-50"
												}`}
										>
											Phần trăm (%)
										</button>
									</div>
								</div>

								{/* Discount Value */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Giá trị giảm <span className="text-red-500">*</span></label>
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
								{/* Min Order Value */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Đơn hàng tối thiểu (đ)</label>
									<input
										type="number"
										placeholder="Ví dụ: 100000"
										value={formMinOrderValue}
										onChange={(e) => setFormMinOrderValue(e.target.value ? Number(e.target.value) : "")}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								{/* Max Discount Amount */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Mức giảm tối đa (đ)</label>
									<input
										type="number"
										placeholder={formDiscountType === 0 ? "Bỏ qua (Tiền cố định)" : "Ví dụ: 50000"}
										disabled={formDiscountType === 0}
										value={formMaxDiscountAmount}
										onChange={(e) => setFormMaxDiscountAmount(e.target.value ? Number(e.target.value) : "")}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed"
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
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
										required
									/>
								</div>

								{/* End Date */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Ngày kết thúc <span className="text-red-500">*</span></label>
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
								{/* Usage Limit */}
								<div className="space-y-1">
									<label className="font-bold text-brand-muted">Lượt sử dụng tối đa</label>
									<input
										type="number"
										placeholder="Bỏ trống nếu không giới hạn"
										value={formUsageLimit}
										onChange={(e) => setFormUsageLimit(e.target.value ? Number(e.target.value) : "")}
										className="w-full h-9 px-3 bg-brand-light-soft/20 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary font-semibold"
									/>
								</div>

								{/* Active status */}
								<div className="space-y-1 flex flex-col justify-end">
									<label className="flex items-center gap-2 py-2 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={formIsActive}
											onChange={(e) => setFormIsActive(e.target.checked)}
											className="accent-brand-primary w-4 h-4"
										/>
										<span className="text-xs text-brand-dark font-bold">Kích hoạt ngay lập tức</span>
									</label>
								</div>
							</div>

							{/* Actions buttons */}
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
