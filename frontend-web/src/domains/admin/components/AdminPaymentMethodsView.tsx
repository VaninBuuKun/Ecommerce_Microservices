import { useState } from "react";
import { createPortal } from "react-dom";
import {
	useAdminPaymentMethodsQuery,
	useCreatePaymentMethodMutation,
	useUpdatePaymentMethodMutation,
} from "../hooks/useAdmin";
import {
	CreditCard,
	Plus,
	Pencil,
	Loader2,
	RefreshCw,
	X,
	Sparkles,
	Sliders,
} from "lucide-react";
import { toast } from "react-toastify";
import { Pagination } from "@/shared/components/Pagination";

interface PaymentMethodItem {
	id: number;
	title: string;
	subTitle?: string;
	isActive: boolean;
	providerName: string;
	iconUrl: string;
	minAmount?: number | null;
	createdDate?: string;
	lastModifiedDate?: string;
}

export function AdminPaymentMethodsView() {
	const { data: methods, isLoading, refetch, isFetching } = useAdminPaymentMethodsQuery();
	const createMutation = useCreatePaymentMethodMutation();
	const updateMutation = useUpdatePaymentMethodMutation();

	// Pagination State
	const [page, setPage] = useState(1);
	const pageSize = 10;

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<PaymentMethodItem | null>(null);

	// Form State
	const [title, setTitle] = useState("");
	const [subTitle, setSubTitle] = useState("");
	const [providerName, setProviderName] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [minAmount, setMinAmount] = useState<string>("");
	const [isActive, setIsActive] = useState(true);

	const handleOpenCreate = () => {
		setEditingItem(null);
		setTitle("");
		setSubTitle("");
		setProviderName("");
		setIconUrl("");
		setMinAmount("");
		setIsActive(true);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item: PaymentMethodItem) => {
		setEditingItem(item);
		setTitle(item.title || "");
		setSubTitle(item.subTitle || "");
		setProviderName(item.providerName || "");
		setIconUrl(item.iconUrl || "");
		setMinAmount(item.minAmount != null ? String(item.minAmount) : "");
		setIsActive(item.isActive);
		setIsModalOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !providerName.trim() || !iconUrl.trim()) {
			toast.error("Vui lòng điền đầy đủ Tên, Mã Provider và Link Icon");
			return;
		}

		const parsedMin = minAmount.trim() ? parseFloat(minAmount) : null;

		const payload = {
			title: title.trim(),
			subTitle: subTitle.trim() || undefined,
			providerName: providerName.trim().toLowerCase(),
			iconUrl: iconUrl.trim(),
			minAmount: parsedMin !== null && !isNaN(parsedMin) ? parsedMin : null,
			isActive,
		};

		if (editingItem) {
			updateMutation.mutate(
				{ id: editingItem.id, payload },
				{
					onSuccess: () => {
						toast.success("Cập nhật phương thức thanh toán thành công!");
						setIsModalOpen(false);
					},
					onError: (err: any) => {
						toast.error(err?.response?.data?.message || err?.response?.data || "Cập nhật thất bại");
					},
				}
			);
		} else {
			createMutation.mutate(payload, {
				onSuccess: () => {
					toast.success("Tạo mới phương thức thanh toán thành công!");
					setIsModalOpen(false);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data?.message || err?.response?.data || "Tạo mới thất bại");
				},
			});
		}
	};

	const paymentList: PaymentMethodItem[] = Array.isArray(methods)
		? methods
		: methods?.items || [];

	const totalCount = paymentList.length;
	const totalPages = Math.ceil(totalCount / pageSize) || 1;
	const paginatedList = paymentList.slice((page - 1) * pageSize, page * pageSize);

	return (
		<div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
			{/* HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
				<div>
					<h1 className="text-sm font-black text-brand-dark uppercase tracking-wide">
						Quản lý Phương thức thanh toán
					</h1>
					<p className="text-[10px] text-brand-muted font-bold mt-0.5">
						Quản lý danh sách các cổng thanh toán (COD, MoMo, VNPay, Ví điện tử...) cho khách hàng khi đặt hàng
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<button
						onClick={() => refetch()}
						disabled={isFetching}
						className="h-8 px-3 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
						Làm mới
					</button>

					<button
						onClick={handleOpenCreate}
						className="h-8 px-3.5 bg-brand-primary hover:bg-brand-primary-deep text-white rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border-none"
					>
						<Plus className="w-3.5 h-3.5" />
						Thêm phương thức mới
					</button>
				</div>
			</div>

			{/* TABLE / LIST */}
			<div className="bg-white border border-brand-border rounded-md shadow-xs overflow-hidden">
				{isLoading ? (
					<div className="py-16 flex flex-col items-center justify-center gap-2 text-brand-muted text-xs font-bold">
						<Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
						Đang tải danh sách phương thức thanh toán...
					</div>
				) : paymentList.length === 0 ? (
					<div className="py-16 text-center text-brand-muted space-y-2">
						<CreditCard className="w-10 h-10 mx-auto opacity-40 text-brand-muted" />
						<p className="text-xs font-bold">Chưa có phương thức thanh toán nào được cấu hình.</p>
						<button
							onClick={handleOpenCreate}
							className="mt-2 text-xs font-bold text-white bg-brand-primary px-3.5 py-1.5 rounded hover:bg-brand-primary-deep cursor-pointer border-none shadow-xs"
						>
							Tạo phương thức đầu tiên
						</button>
					</div>
				) : (
					<div>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider select-none">
										<th className="py-2.5 px-4">Icon & Tên hiển thị</th>
										<th className="py-2.5 px-4">Provider Code</th>
										<th className="py-2.5 px-4">Mô tả phụ</th>
										<th className="py-2.5 px-4 text-center">Đơn tối thiểu</th>
										<th className="py-2.5 px-4 text-center">Trạng thái</th>
										<th className="py-2.5 px-4 text-right">Thao tác</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-brand-border/60">
									{paginatedList.map((item) => (
										<tr key={item.id} className="hover:bg-brand-light-soft/20 transition-colors">
											<td className="py-2.5 px-4">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-md bg-brand-light-soft border border-brand-border flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
														{item.iconUrl ? (
															<img
																src={item.iconUrl}
																alt={item.title}
																className="w-full h-full object-contain"
																onError={(e) => {
																	(e.currentTarget as HTMLElement).style.display = "none";
																}}
															/>
														) : (
															<CreditCard className="w-4 h-4 text-brand-muted" />
														)}
													</div>
													<div>
														<div className="font-bold text-brand-dark text-xs">{item.title}</div>
														<div className="text-[10px] text-brand-muted font-medium">ID: #{item.id}</div>
													</div>
												</div>
											</td>

											<td className="py-2.5 px-4">
												<span className="font-mono text-[11px] font-bold bg-brand-light-soft text-brand-dark px-2 py-0.5 rounded border border-brand-border">
													{item.providerName}
												</span>
											</td>

											<td className="py-2.5 px-4 text-brand-muted font-medium max-w-xs truncate">
												{item.subTitle || "—"}
											</td>

											<td className="py-2.5 px-4 text-center font-medium text-xs">
												{item.minAmount != null && item.minAmount > 0 ? (
													<span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
														{Number(item.minAmount).toLocaleString("vi-VN")} ₫
													</span>
												) : (
													<span className="text-brand-muted text-[10px]">Không giới hạn</span>
												)}
											</td>

											<td className="py-2.5 px-4 text-center">
												<span
													className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
														item.isActive
															? "bg-emerald-50 text-emerald-700 border border-emerald-200"
															: "bg-red-50 text-red-700 border border-red-200"
													}`}
												>
													{item.isActive ? "Hoạt động" : "Tạm dừng"}
												</span>
											</td>

											<td className="py-2.5 px-4 text-right">
												<button
													onClick={() => handleOpenEdit(item)}
													className="px-2.5 py-1 bg-white border border-brand-border hover:bg-brand-light-soft text-brand-dark rounded text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
												>
													<Pencil className="w-3 h-3 text-brand-muted" />
													Chỉnh sửa
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Unified Pagination Footer */}
						<div className="px-4 py-2 border-t border-brand-border bg-brand-light-soft/20 text-xs">
							<Pagination
								currentPage={page}
								totalPages={totalPages}
								totalCount={totalCount}
								pageSize={pageSize}
								onPageChange={setPage}
								showQuickJumper
								showTotal
							/>
						</div>
					</div>
				)}
			</div>

			{/* MODAL CREATE / EDIT */}
			{isModalOpen &&
				createPortal(
					<div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] overflow-y-auto">
						<div className="bg-white border border-brand-border rounded-md max-w-lg w-full p-6 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200 font-sans">
							<button
								onClick={() => setIsModalOpen(false)}
								className="absolute top-4 right-4 p-1 rounded-md hover:bg-brand-light-soft text-brand-muted hover:text-brand-dark cursor-pointer border-none bg-transparent"
							>
								<X className="w-5 h-5" />
							</button>

							<h2 className="text-sm font-black text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
								<Sliders className="w-5 h-5 text-brand-primary" />
								{editingItem ? "Chỉnh sửa phương thức thanh toán" : "Thêm phương thức thanh toán mới"}
							</h2>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label className="block text-[11px] font-bold text-brand-dark mb-1">
										Tên hiển thị (Tiêu đề) <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										placeholder="Ví dụ: Thanh toán khi nhận hàng (COD), Ví MoMo..."
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary"
									/>
								</div>

								<div>
									<label className="block text-[11px] font-bold text-brand-dark mb-1">
										Mã Provider định danh (Provider Name) <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										required
										placeholder="Ví dụ: cod, momo, vnpay, wallet"
										value={providerName}
										onChange={(e) => setProviderName(e.target.value)}
										className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary font-mono"
									/>
									<p className="text-[10px] text-brand-muted mt-1">
										Mã định danh duy nhất không dấu (ví dụ: <code className="bg-gray-100 px-1 py-0.5 rounded">cod</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">momo</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">vnpay</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">wallet</code>).
									</p>
								</div>

								<div>
									<label className="block text-[11px] font-bold text-brand-dark mb-1">
										Mô tả phụ (Subtitle)
									</label>
									<input
										type="text"
										placeholder="Ví dụ: Thanh toán bằng tiền mặt khi shipper giao tới..."
										value={subTitle}
										onChange={(e) => setSubTitle(e.target.value)}
										className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary"
									/>
								</div>

								<div>
									<label className="block text-[11px] font-bold text-brand-dark mb-1">
										Đường dẫn ảnh Icon (Icon URL) <span className="text-red-500">*</span>
									</label>
									<div className="flex gap-2">
										<input
											type="url"
											required
											placeholder="https://... /icon.png"
											value={iconUrl}
											onChange={(e) => setIconUrl(e.target.value)}
											className="flex-1 h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary"
										/>
										{iconUrl && (
											<div className="w-9 h-9 rounded-md bg-brand-light-soft border border-brand-border flex items-center justify-center p-1 shrink-0">
												<img src={iconUrl} alt="Preview" className="w-full h-full object-contain" />
											</div>
										)}
									</div>
								</div>

								{/* Quick preset icons */}
								<div className="bg-brand-light-soft/30 p-2.5 rounded-md border border-brand-border space-y-1.5">
									<span className="text-[10px] font-bold text-brand-muted block">Gợi ý Icon nhanh:</span>
									<div className="flex flex-wrap gap-1.5">
										{[
											{ name: "COD", icon: "https://cdn-icons-png.flaticon.com/512/1554/1554401.png", provider: "cod", title: "Thanh toán khi nhận hàng (COD)" },
											{ name: "MoMo", icon: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png", provider: "momo", title: "Ví điện tử MoMo" },
											{ name: "VNPay", icon: "https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png", provider: "vnpay", title: "Cổng thanh toán VNPay (QR / Thẻ ATM)" },
											{ name: "Ví BuuStore", icon: "https://cdn-icons-png.flaticon.com/512/60/60484.png", provider: "wallet", title: "Ví số dư BuuStore" },
										].map((preset) => (
											<button
												key={preset.provider}
												type="button"
												onClick={() => {
													setIconUrl(preset.icon);
													if (!providerName) setProviderName(preset.provider);
													if (!title) setTitle(preset.title);
												}}
												className="px-2 py-1 bg-white border border-brand-border hover:border-brand-primary rounded-md text-[10px] font-bold text-brand-dark cursor-pointer flex items-center gap-1"
											>
												<Sparkles className="w-2.5 h-2.5 text-brand-primary" />
												{preset.name}
											</button>
										))}
									</div>
								</div>

								<div>
									<label className="block text-[11px] font-bold text-brand-dark mb-1">
										Hạn mức đơn hàng tối thiểu (VNĐ)
									</label>
									<input
										type="number"
										min="0"
										step="1000"
										placeholder="Ví dụ: 10000 (Để trống nếu không giới hạn)"
										value={minAmount}
										onChange={(e) => setMinAmount(e.target.value)}
										className="w-full h-9 px-3 text-xs bg-white border border-brand-border rounded-md focus:outline-none focus:border-brand-primary"
									/>
									<p className="text-[10px] text-brand-muted mt-1 font-medium">
										Khách hàng chỉ có thể sử dụng phương thức này nếu tổng thanh toán đạt từ số tiền này trở lên.
									</p>
								</div>

								<label className="flex items-center gap-2 py-1 select-none cursor-pointer">
									<input
										type="checkbox"
										checked={isActive}
										onChange={(e) => setIsActive(e.target.checked)}
										className="accent-brand-primary w-4 h-4 rounded-md"
									/>
									<span className="text-xs text-brand-dark font-semibold">
										Kích hoạt phương thức này ngay lập tức
									</span>
								</label>

								<div className="flex gap-3 pt-3 border-t border-brand-border/60">
									<button
										type="button"
										onClick={() => setIsModalOpen(false)}
										className="flex-1 h-9 border border-brand-border hover:bg-brand-light-soft text-brand-dark font-bold text-xs rounded-md transition-colors cursor-pointer bg-white"
									>
										Hủy bỏ
									</button>
									<button
										type="submit"
										disabled={createMutation.isPending || updateMutation.isPending}
										className="flex-1 h-9 bg-brand-primary hover:bg-brand-primary-deep text-brand-dark font-black text-xs rounded-md transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
									>
										{(createMutation.isPending || updateMutation.isPending) && (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										)}
										{editingItem ? "Lưu thay đổi" : "Tạo phương thức"}
									</button>
								</div>
							</form>
						</div>
					</div>,
					document.body
				)}
		</div>
	);
}
