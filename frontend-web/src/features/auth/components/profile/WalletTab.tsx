import React, { useState } from "react";
import { 
	useWalletQuery, 
	useActivateWalletMutation, 
	useWalletTransactionsQuery,
	useBankAccountsQuery,
	useAddBankAccountMutation,
	useUpdateBankAccountMutation
} from "../../../order/hooks/useCheckoutQueries";
import { Loader2, CreditCard, ShieldCheck, History, Edit, Check, X, PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

export function WalletTab() {
	const { data: wallet, isLoading: walletLoading, error: walletError, refetch } = useWalletQuery();
	const activateWalletMutation = useActivateWalletMutation();

	// Kiểm tra sự tồn tại của ví
	const hasWallet = !!wallet && !walletError;

	// Query ngân hàng & giao dịch
	const { data: bankAccounts, isLoading: banksLoading } = useBankAccountsQuery(hasWallet);
	const { data: transactions, isLoading: txLoading } = useWalletTransactionsQuery(hasWallet);

	// Mutations ngân hàng
	const addBankMutation = useAddBankAccountMutation();
	const updateBankMutation = useUpdateBankAccountMutation();

	// States kích hoạt ví
	const [bankName, setBankName] = useState("");
	const [bankAccountNumber, setBankAccountNumber] = useState("");
	const [bankAccountHolder, setBankAccountHolder] = useState("");
	const [formError, setFormError] = useState("");

	// States quản lý Modal danh sách Bank Accounts
	const [showBankModal, setShowBankModal] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);

	// Form thêm mới ngân hàng trong Modal
	const [newBankName, setNewBankName] = useState("");
	const [newBankAccountNumber, setNewBankAccountNumber] = useState("");
	const [newBankAccountHolder, setNewBankAccountHolder] = useState("");
	const [newIsDefault, setNewIsDefault] = useState(false);

	// State chỉnh sửa tài khoản ngân hàng trong Modal
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editBankName, setEditBankName] = useState("");
	const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
	const [editBankAccountHolder, setEditBankAccountHolder] = useState("");
	const [editIsDefault, setEditIsDefault] = useState(false);

	// Kích hoạt ví ban đầu
	const handleActivate = (e: React.FormEvent) => {
		e.preventDefault();
		setFormError("");

		if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountHolder.trim()) {
			setFormError("Vui lòng nhập đầy đủ thông tin ngân hàng.");
			return;
		}

		activateWalletMutation.mutate(
			{
				bankName: bankName.trim(),
				bankAccountNumber: bankAccountNumber.trim(),
				bankAccountHolder: bankAccountHolder.trim(),
			},
			{
				onSuccess: () => {
					toast.success("Kích hoạt ví điện tử liên kết thành công!");
					refetch();
				},
				onError: (err: any) => {
					setFormError(err?.response?.data || "Kích hoạt ví thất bại. Vui lòng kiểm tra lại.");
				},
			}
		);
	};

	// Xử lý Thêm ngân hàng mới trong Modal
	const handleAddBankAccount = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newBankName.trim() || !newBankAccountNumber.trim() || !newBankAccountHolder.trim()) {
			toast.error("Vui lòng điền đủ thông tin tài khoản ngân hàng mới.");
			return;
		}

		addBankMutation.mutate(
			{
				bankName: newBankName.trim(),
				bankAccountNumber: newBankAccountNumber.trim(),
				bankAccountHolder: newBankAccountHolder.trim().toUpperCase(),
				isDefault: newIsDefault,
			},
			{
				onSuccess: () => {
					toast.success("Liên kết tài khoản ngân hàng mới thành công!");
					setNewBankName("");
					setNewBankAccountNumber("");
					setNewBankAccountHolder("");
					setNewIsDefault(false);
					setShowAddForm(false);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Thêm tài khoản ngân hàng thất bại.");
				},
			}
		);
	};

	// Bắt đầu chỉnh sửa một tài khoản ngân hàng
	const startEditing = (acc: any) => {
		// Hủy bỏ các thay đổi dở dang trước đó (nếu có)
		setEditingId(acc.id);
		setEditBankName(acc.bankName);
		setEditBankAccountNumber(acc.bankAccountNumber);
		setEditBankAccountHolder(acc.bankAccountHolder);
		setEditIsDefault(acc.isDefault);
	};

	// Hủy bỏ chỉnh sửa tài khoản hiện tại
	const cancelEditing = () => {
		setEditingId(null);
		setEditBankName("");
		setEditBankAccountNumber("");
		setEditBankAccountHolder("");
		setEditIsDefault(false);
	};

	// Lưu chỉnh sửa tài khoản ngân hàng
	const handleUpdateBankAccount = (id: string) => {
		if (!editBankName.trim() || !editBankAccountNumber.trim() || !editBankAccountHolder.trim()) {
			toast.error("Thông tin cập nhật tài khoản ngân hàng không hợp lệ.");
			return;
		}

		updateBankMutation.mutate(
			{
				id,
				data: {
					bankName: editBankName.trim(),
					bankAccountNumber: editBankAccountNumber.trim(),
					bankAccountHolder: editBankAccountHolder.trim().toUpperCase(),
					isDefault: editIsDefault,
				},
			},
			{
				onSuccess: () => {
					toast.success("Cập nhật tài khoản ngân hàng thành công!");
					setEditingId(null);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Cập nhật tài khoản ngân hàng thất bại.");
				},
			}
		);
	};

	if (walletLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin ví điện tử...
			</div>
		);
	}

	// 1. Chưa kích hoạt ví
	const is404 = (walletError as any)?.response?.status === 404 || !wallet;
	if (is404) {
		return (
			<div className="space-y-6 text-left max-w-xl mx-auto font-sans">
				<div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4 flex gap-3 items-start text-amber-800 text-xs">
					<AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
					<div className="space-y-1 font-medium">
						<p className="font-extrabold text-sm text-brand-dark">Bạn chưa kích hoạt ví điện tử liên kết</p>
						<p className="text-brand-muted text-[11px] leading-relaxed">
							Để có thể đăng ký bán hàng (KYC), nhận tiền bán sản phẩm hoặc thực hiện các yêu cầu hoàn tiền (Refund) trên sàn, bạn bắt buộc phải kích hoạt ví điện tử liên kết trước.
						</p>
					</div>
				</div>

				<form onSubmit={handleActivate} className="border border-brand-border rounded-2xl p-5 bg-white shadow-sm space-y-4">
					<h3 className="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
						<CreditCard className="w-4 h-4 text-brand-primary" />
						Kích hoạt Ví Điện Tử liên kết
					</h3>

					<div className="space-y-3 text-xs">
						<div className="space-y-1">
							<label className="font-extrabold text-brand-dark">Tên ngân hàng liên kết</label>
							<input
								type="text"
								placeholder="Ví dụ: Vietcombank, Techcombank..."
								value={bankName}
								onChange={(e) => setBankName(e.target.value)}
								className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="font-extrabold text-brand-dark">Số tài khoản ngân hàng</label>
							<input
								type="text"
								placeholder="Nhập số tài khoản ngân hàng của bạn..."
								value={bankAccountNumber}
								onChange={(e) => setBankAccountNumber(e.target.value)}
								className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="font-extrabold text-brand-dark">Tên chủ tài khoản (Viết hoa không dấu)</label>
							<input
								type="text"
								placeholder="Ví dụ: NGUYEN VAN A"
								value={bankAccountHolder}
								onChange={(e) => setBankAccountHolder(e.target.value)}
								className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
								required
							/>
						</div>
					</div>

					{formError && <p className="text-[10px] font-bold text-red-600">{formError}</p>}

					<button
						type="submit"
						disabled={activateWalletMutation.isPending}
						className="w-full h-10 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
					>
						{activateWalletMutation.isPending ? (
							<>
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
								Đang xử lý kích hoạt...
							</>
						) : (
							"Kích hoạt Ví ngay"
						)}
					</button>
				</form>
			</div>
		);
	}

	// 2. Tìm tài khoản ngân hàng hiển thị mặc định
	const defaultAccount = bankAccounts?.find((acc: any) => acc.isDefault) || bankAccounts?.[0];
	const extraAccountsCount = bankAccounts ? bankAccounts.length - 1 : 0;

	return (
		<div className="space-y-6 text-left font-sans max-w-4xl mx-auto">
			{/* Wallet Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Wallet Balance Card */}
				<div className="border border-brand-border bg-gradient-to-br from-brand-dark to-slate-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-40 relative overflow-hidden">
					<div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-brand-primary/10 rounded-full blur-2xl" />
					<div className="flex justify-between items-start">
						<div className="space-y-1">
							<p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/80">Ví điện tử cá nhân</p>
							<p className="text-[11px] font-bold text-slate-300">ID: #{wallet.id.split("-")[0]}</p>
						</div>
						<ShieldCheck className="w-6 h-6 text-brand-primary" />
					</div>

					<div className="space-y-1 pt-4">
						<p className="text-[10px] font-bold text-slate-400">Số dư khả dụng</p>
						<p className="text-2xl font-black text-brand-primary font-mono">
							{Number(wallet.balance).toLocaleString("vi-VN")}đ
						</p>
					</div>

					<div className="flex justify-between items-center border-t border-white/10 pt-3 mt-3 text-[10px] font-bold text-slate-400">
						<span>Trạng thái: 
							<span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] uppercase ${wallet.isLocked ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
								{wallet.isLocked ? "Đang khóa" : "Hoạt động"}
							</span>
						</span>
						<span>Kích hoạt: {new Date(wallet.createdDate || Date.now()).toLocaleDateString("vi-VN")}</span>
					</div>
				</div>

				{/* Primary Bank Linked Account Card */}
				<div className="border border-brand-border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between min-h-40">
					<div className="space-y-3">
						<div className="flex justify-between items-center">
							<h4 className="text-xs font-black text-brand-dark uppercase tracking-wider">Tài khoản mặc định</h4>
							{extraAccountsCount > 0 && (
								<button
									onClick={() => setShowBankModal(true)}
									className="text-[10px] font-black text-brand-primary-deep hover:underline cursor-pointer"
								>
									Xem thêm {extraAccountsCount} tài khoản khác
								</button>
							)}
							{extraAccountsCount === 0 && (
								<button
									onClick={() => setShowBankModal(true)}
									className="text-[10px] font-black text-brand-muted hover:text-brand-dark hover:underline cursor-pointer flex items-center gap-0.5"
								>
									<PlusCircle className="w-3 h-3" /> Quản lý ngân hàng
								</button>
							)}
						</div>

						{banksLoading ? (
							<div className="flex items-center gap-1.5 text-xs text-brand-muted py-2">
								<Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải ngân hàng...
							</div>
						) : defaultAccount ? (
							<div className="space-y-2 text-xs">
								<div className="flex justify-between py-1.5 border-b border-slate-100">
									<span className="text-brand-muted font-bold">Ngân hàng</span>
									<span className="font-black text-brand-dark uppercase">{defaultAccount.bankName}</span>
								</div>
								<div className="flex justify-between py-1.5 border-b border-slate-100">
									<span className="text-brand-muted font-bold">Số tài khoản</span>
									<span className="font-extrabold text-brand-dark font-mono">{defaultAccount.bankAccountNumber}</span>
								</div>
								<div className="flex justify-between py-1.5">
									<span className="text-brand-muted font-bold">Chủ tài khoản</span>
									<span className="font-black text-brand-dark uppercase">{defaultAccount.bankAccountHolder}</span>
								</div>
							</div>
						) : (
							<p className="text-xs text-brand-muted py-3">Chưa có tài khoản ngân hàng liên kết mặc định.</p>
						)}
					</div>

					<div className="text-[10px] text-brand-muted font-bold pt-2 border-t border-slate-100">
						Nhấn vào xem thêm để quản lý hoặc liên kết nhiều tài khoản ngân hàng khác.
					</div>
				</div>
			</div>

			{/* Transactions History */}
			<div className="space-y-3">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
					<History className="w-4 h-4 text-brand-muted" />
					Lịch sử giao dịch ví
				</h3>

				<div className="border border-brand-border rounded-2xl bg-white overflow-hidden shadow-sm">
					{txLoading ? (
						<div className="flex justify-center items-center py-10 text-xs text-brand-muted gap-2">
							<Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
							Đang tải danh sách giao dịch...
						</div>
					) : !transactions || transactions.length === 0 ? (
						<div className="text-center py-12 text-brand-muted font-semibold text-xs">
							Chưa có giao dịch phát sinh nào trên ví của bạn.
						</div>
					) : (
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="bg-brand-light-soft/50 border-b border-brand-border text-[10px] font-extrabold text-brand-muted uppercase tracking-wider">
									<th className="p-3 w-1/4">Mã giao dịch</th>
									<th className="p-3 w-1/4">Thời gian</th>
									<th className="p-3 w-2/5">Mô tả</th>
									<th className="p-3 text-right">Số tiền</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-brand-border text-xs">
								{transactions.map((tx: any, idx: number) => {
									const isDebit = tx.type === "Debit";
									return (
										<tr key={idx} className="hover:bg-brand-light-soft/10">
											<td className="p-3 font-mono font-bold text-brand-dark">#{tx.id.split("-")[0]}</td>
											<td className="p-3 text-brand-muted">{new Date(tx.createdDate).toLocaleString("vi-VN")}</td>
											<td className="p-3 font-bold text-brand-dark">{tx.description}</td>
											<td className={`p-3 text-right font-extrabold ${isDebit ? "text-red-600" : "text-emerald-600"}`}>
												{isDebit ? "-" : "+"}{Number(tx.amount).toLocaleString("vi-VN")}đ
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Modal Quản lý tất cả tài khoản ngân hàng */}
			{showBankModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
					<div className="bg-white rounded-2xl max-w-2xl w-full border border-brand-border p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
						<div className="flex justify-between items-center border-b border-brand-border pb-3">
							<h3 className="font-black text-brand-dark text-sm uppercase flex items-center gap-1.5">
								<CreditCard className="w-4 h-4 text-brand-primary" />
								Quản lý ngân hàng liên kết
							</h3>
							<button 
								onClick={() => { setShowBankModal(false); setShowAddForm(false); cancelEditing(); }}
								className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Form Thêm ngân hàng liên kết mới */}
						{showAddForm ? (
							<form onSubmit={handleAddBankAccount} className="border border-brand-border/60 bg-brand-light-soft/10 rounded-xl p-4 space-y-3">
								<h4 className="text-xs font-black text-brand-dark uppercase">Liên kết tài khoản mới</h4>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
									<div className="space-y-1">
										<label className="font-extrabold text-[10px] text-brand-muted uppercase">Ngân hàng</label>
										<input
											type="text"
											placeholder="Vietcombank..."
											value={newBankName}
											onChange={(e) => setNewBankName(e.target.value)}
											className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
											required
										/>
									</div>
									<div className="space-y-1">
										<label className="font-extrabold text-[10px] text-brand-muted uppercase">Số tài khoản</label>
										<input
											type="text"
											placeholder="123456..."
											value={newBankAccountNumber}
											onChange={(e) => setNewBankAccountNumber(e.target.value)}
											className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
											required
										/>
									</div>
									<div className="space-y-1">
										<label className="font-extrabold text-[10px] text-brand-muted uppercase">Chủ tài khoản</label>
										<input
											type="text"
											placeholder="NGUYEN VAN A..."
											value={newBankAccountHolder}
											onChange={(e) => setNewBankAccountHolder(e.target.value)}
											className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
											required
										/>
									</div>
								</div>

								<div className="flex items-center gap-1.5 text-xs">
									<input 
										type="checkbox"
										id="newIsDefault"
										checked={newIsDefault}
										onChange={(e) => setNewIsDefault(e.target.checked)}
										className="w-3.5 h-3.5 cursor-pointer accent-brand-dark"
									/>
									<label htmlFor="newIsDefault" className="font-bold text-brand-dark cursor-pointer select-none">
										Đặt làm tài khoản nhận tiền mặc định
									</label>
								</div>

								<div className="flex justify-end gap-2 text-xs pt-1">
									<button
										type="button"
										onClick={() => setShowAddForm(false)}
										className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold cursor-pointer"
									>
										Hủy
									</button>
									<button
										type="submit"
										disabled={addBankMutation.isPending}
										className="px-4 py-1 bg-brand-dark text-white rounded font-black cursor-pointer hover:bg-brand-primary hover:text-brand-dark transition-all disabled:opacity-50"
									>
										{addBankMutation.isPending ? "Đang lưu..." : "Liên kết ngay"}
									</button>
								</div>
							</form>
						) : (
							<button
								onClick={() => { setShowAddForm(true); cancelEditing(); }}
								className="w-full py-2 bg-brand-light-soft border border-dashed border-brand-border hover:bg-brand-light-soft/60 rounded-xl text-xs font-black text-brand-dark cursor-pointer transition-all flex items-center justify-center gap-1"
							>
								<PlusCircle className="w-3.5 h-3.5" />
								Liên kết thêm tài khoản ngân hàng mới
							</button>
						)}

						{/* Danh sách tài khoản hiện có */}
						<div className="space-y-3 pt-2">
							<h4 className="text-xs font-black text-brand-muted uppercase tracking-wider">Danh sách tài khoản ({bankAccounts?.length || 0})</h4>
							
							<div className="divide-y divide-brand-border">
								{bankAccounts?.map((acc: any) => {
									const isEditing = editingId === acc.id;
									return (
										<div key={acc.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
											{isEditing ? (
												/* Dòng chỉnh sửa tài khoản */
												<div className="flex-1 w-full space-y-3">
													<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
														<div className="space-y-0.5">
															<span className="text-[9px] font-black uppercase text-brand-muted">Ngân hàng</span>
															<input
																type="text"
																value={editBankName}
																onChange={(e) => setEditBankName(e.target.value)}
																className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
															/>
														</div>
														<div className="space-y-0.5">
															<span className="text-[9px] font-black uppercase text-brand-muted">Số tài khoản</span>
															<input
																type="text"
																value={editBankAccountNumber}
																onChange={(e) => setEditBankAccountNumber(e.target.value)}
																className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
															/>
														</div>
														<div className="space-y-0.5">
															<span className="text-[9px] font-black uppercase text-brand-muted">Chủ tài khoản</span>
															<input
																type="text"
																value={editBankAccountHolder}
																onChange={(e) => setEditBankAccountHolder(e.target.value)}
																className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary"
															/>
														</div>
													</div>

													<div className="flex items-center gap-1.5 text-xs">
														<input
															type="checkbox"
															id={`editDefault-${acc.id}`}
															checked={editIsDefault}
															onChange={(e) => setEditIsDefault(e.target.checked)}
															className="w-3.5 h-3.5 cursor-pointer accent-brand-dark"
														/>
														<label htmlFor={`editDefault-${acc.id}`} className="font-bold text-brand-dark cursor-pointer select-none">
															Đặt làm tài khoản mặc định
														</label>
													</div>
												</div>
											) : (
												/* Dòng hiển thị thông tin tài khoản */
												<div className="flex-1 space-y-1">
													<div className="flex items-center gap-2">
														<span className="font-black text-brand-dark text-xs uppercase">{acc.bankName}</span>
														{acc.isDefault && (
															<span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] uppercase font-bold rounded">
																Mặc định
															</span>
														)}
													</div>
													<div className="text-[11px] text-brand-muted font-bold flex gap-4">
														<span>STK: <strong className="font-mono text-brand-dark">{acc.bankAccountNumber}</strong></span>
														<span>Chủ thẻ: <strong className="uppercase text-brand-dark">{acc.bankAccountHolder}</strong></span>
													</div>
												</div>
											)}

											{/* Nút Action của dòng */}
											<div className="flex items-center gap-2 shrink-0">
												{isEditing ? (
													<>
														<button
															onClick={() => handleUpdateBankAccount(acc.id)}
															disabled={updateBankMutation.isPending}
															className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer flex items-center justify-center"
															title="Lưu"
														>
															<Check className="w-3.5 h-3.5" />
														</button>
														<button
															onClick={cancelEditing}
															className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer flex items-center justify-center"
															title="Hủy"
														>
															<X className="w-3.5 h-3.5" />
														</button>
													</>
												) : (
													<button
														onClick={() => { setShowAddForm(false); startEditing(acc); }}
														className="p-1.5 bg-brand-light-soft text-brand-dark hover:bg-brand-border rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-black"
													>
														<Edit className="w-3.5 h-3.5" />
														Sửa
													</button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
