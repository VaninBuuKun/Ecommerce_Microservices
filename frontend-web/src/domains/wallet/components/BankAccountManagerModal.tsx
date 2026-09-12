import React from "react";
import { X, PlusCircle, Edit, Trash2, Building2 } from "lucide-react";
import { VIETNAM_BANKS } from "@/shared/consts/banks";

interface BankAccountManagerModalProps {
	bankAccounts: any[];
	showAddForm: boolean;
	setShowAddForm: (show: boolean) => void;
	editingId: number | null;
	onClose: () => void;

	newBankName: string;
	setNewBankName: (val: string) => void;
	newBankAccountNumber: string;
	setNewBankAccountNumber: (val: string) => void;
	newBankAccountHolder: string;
	setNewBankAccountHolder: (val: string) => void;
	newIsDefault: boolean;
	setNewIsDefault: (val: boolean) => void;
	onAddSubmit: (e: React.FormEvent) => void;
	addPending: boolean;

	editBankName: string;
	setEditBankName: (val: string) => void;
	editBankAccountNumber: string;
	setEditBankAccountNumber: (val: string) => void;
	editBankAccountHolder: string;
	setEditBankAccountHolder: (val: string) => void;
	editIsDefault: boolean;
	setEditIsDefault: (val: boolean) => void;
	onUpdateSubmit: (id: number) => void;
	updatePending: boolean;

	onDeleteSubmit?: (id: number) => void;
	deletePending?: boolean;

	startEditing: (account: any) => void;
	cancelEditing: () => void;
}

export function BankAccountManagerModal({
	bankAccounts,
	showAddForm,
	setShowAddForm,
	editingId,
	onClose,
	newBankName,
	setNewBankName,
	newBankAccountNumber,
	setNewBankAccountNumber,
	newBankAccountHolder,
	setNewBankAccountHolder,
	newIsDefault,
	setNewIsDefault,
	onAddSubmit,
	addPending,
	editBankName,
	setEditBankName,
	editBankAccountNumber,
	setEditBankAccountNumber,
	editBankAccountHolder,
	setEditBankAccountHolder,
	editIsDefault,
	setEditIsDefault,
	onUpdateSubmit,
	updatePending,
	onDeleteSubmit,
	deletePending,
	startEditing,
	cancelEditing,
}: BankAccountManagerModalProps) {
	const cleanHolderInput = (val: string) => {
		return val
			.toUpperCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/Đ/g, "D")
			.replace(/[^A-Z0-9 ]/g, "");
	};

	const cleanNumberInput = (val: string) => {
		return val.replace(/[^0-9]/g, "").slice(0, 15);
	};

	const selectedNewBank = VIETNAM_BANKS.find(
		(b) => b.name.toLowerCase() === newBankName.trim().toLowerCase()
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
			<div className="bg-white rounded-md max-w-2xl w-full border border-brand-border p-6 shadow-2xl space-y-4 text-left">
				<div className="flex justify-between items-center border-b border-brand-border pb-3">
					<h3 className="font-black text-brand-dark text-sm uppercase">
						Quản lý tài khoản ngân hàng liên kết
					</h3>
					<button
						onClick={onClose}
						className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm border-none bg-transparent"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{showAddForm ? (
					<form onSubmit={onAddSubmit} className="space-y-3 bg-brand-light-soft/50 p-4 border border-brand-border rounded-md text-xs">
						<h4 className="font-extrabold text-brand-dark uppercase text-xs">Thêm tài khoản ngân hàng mới</h4>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-1">
								<label className="font-extrabold text-[10px] text-brand-muted uppercase">Ngân hàng</label>
								<select
									value={newBankName}
									onChange={(e) => setNewBankName(e.target.value)}
									className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
									required
								>
									<option value="">-- Chọn ngân hàng --</option>
									{VIETNAM_BANKS.map((b) => (
										<option key={b.code} value={b.name}>
											{b.name} ({b.code})
										</option>
									))}
								</select>
							</div>
							<div className="space-y-1">
								<label className="font-extrabold text-[10px] text-brand-muted uppercase">Số tài khoản</label>
								<input
									type="text"
									placeholder="Tối đa 15 số..."
									value={newBankAccountNumber}
									onChange={(e) => setNewBankAccountNumber(cleanNumberInput(e.target.value))}
									className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium font-mono"
									required
								/>
							</div>
							<div className="space-y-1">
								<label className="font-extrabold text-[10px] text-brand-muted uppercase">Chủ tài khoản</label>
								<input
									type="text"
									placeholder="NGUYEN VAN A..."
									value={newBankAccountHolder}
									onChange={(e) => setNewBankAccountHolder(cleanHolderInput(e.target.value))}
									className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
									required
								/>
							</div>
						</div>

						{/* Dưới ô select là ảnh ngân hàng, bên phải là mặc định, phải cùng là hủy, xác nhận */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-brand-border/40">
							<div className="flex items-center gap-3">
								{/* Ảnh của ngân hàng dưới ô select */}
								<div className="w-18 h-18 flex items-center justify-center rounded-md border border-brand-border bg-white p-1 shrink-0 shadow-2xs">
									{selectedNewBank ? (
										<img
											src={selectedNewBank.logo}
											alt={selectedNewBank.name}
											className="w-full h-full object-contain"
										/>
									) : (
										<Building2 className="w-5 h-5 text-brand-muted/40" />
									)}
								</div>

								{/* Bên phải là mặc định */}
								<label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold text-brand-dark">
									<input
										type="checkbox"
										id="newIsDefault"
										checked={newIsDefault}
										onChange={(e) => setNewIsDefault(e.target.checked)}
										className="w-4 h-4 cursor-pointer accent-brand-dark rounded"
									/>
									<span>Đặt làm mặc định</span>
								</label>
							</div>

							{/* Phải cùng là hủy, xác nhận */}
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setShowAddForm(false)}
									className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold cursor-pointer border-none text-xs transition-colors"
								>
									Hủy
								</button>
								<button
									type="submit"
									disabled={addPending}
									className="px-4 py-1.5 bg-brand-dark text-white rounded-md font-black cursor-pointer hover:bg-brand-primary hover:text-brand-dark transition-all disabled:opacity-50 border-none text-xs shadow-xs"
								>
									{addPending ? "Đang xử lý..." : "Xác nhận"}
								</button>
							</div>
						</div>
					</form>
				) : (
					<button
						onClick={() => { setShowAddForm(true); cancelEditing(); }}
						className="w-full py-2 bg-brand-light-soft border border-dashed border-brand-border hover:bg-brand-light-soft/60 rounded-md text-xs font-black text-brand-dark cursor-pointer transition-all flex items-center justify-center gap-1"
					>
						<PlusCircle className="w-3.5 h-3.5" />
						Liên kết thêm tài khoản ngân hàng mới
					</button>
				)}

				<div className="space-y-3 pt-2 text-xs">
					<h4 className="text-xs font-black text-brand-muted uppercase tracking-wider">Danh sách tài khoản ({bankAccounts.length})</h4>

					<div className="divide-y divide-brand-border">
						{bankAccounts.map((acc: any) => {
							const isEditing = editingId === acc.id;
							const matchedBank = VIETNAM_BANKS.find(
								(b) => b.name.toLowerCase() === acc.bankName?.trim().toLowerCase()
							);
							const displayLogo = acc.iconUrl || matchedBank?.logo;

							const selectedEditBank = isEditing
								? VIETNAM_BANKS.find(
									(b) => b.name.toLowerCase() === editBankName.trim().toLowerCase()
								)
								: null;

							return (
								<div key={acc.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
									{isEditing ? (
										<div className="w-full space-y-3 bg-brand-light-soft/30 p-3 rounded-md border border-brand-border">
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
												<div className="space-y-0.5 text-left">
													<span className="text-[9px] font-black uppercase text-brand-muted">Ngân hàng</span>
													<select
														value={editBankName}
														onChange={(e) => setEditBankName(e.target.value)}
														className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
														required
													>
														{VIETNAM_BANKS.map((b) => (
															<option key={b.code} value={b.name}>
																{b.name} ({b.code})
															</option>
														))}
													</select>
												</div>
												<div className="space-y-0.5 text-left">
													<span className="text-[9px] font-black uppercase text-brand-muted">Số tài khoản</span>
													<input
														type="text"
														value={editBankAccountNumber}
														onChange={(e) => setEditBankAccountNumber(cleanNumberInput(e.target.value))}
														className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium font-mono"
													/>
												</div>
												<div className="space-y-0.5 text-left">
													<span className="text-[9px] font-black uppercase text-brand-muted">Chủ tài khoản</span>
													<input
														type="text"
														value={editBankAccountHolder}
														onChange={(e) => setEditBankAccountHolder(cleanHolderInput(e.target.value))}
														className="w-full h-8 px-2 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
													/>
												</div>
											</div>

											{/* Dưới ô select là ảnh ngân hàng, bên phải là mặc định, phải cùng là hủy, xác nhận */}
											<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-brand-border/40">
												<div className="flex items-center gap-3">
													{/* Ảnh của ngân hàng dưới ô select */}
													<div className="w-18 h-18 flex items-center justify-center rounded-md border border-brand-border bg-white p-1 shrink-0 shadow-2xs">
														{selectedEditBank ? (
															<img
																src={selectedEditBank.logo}
																alt={selectedEditBank.name}
																className="w-full h-full object-contain"
															/>
														) : (
															<Building2 className="w-5 h-5 text-brand-muted/40" />
														)}
													</div>

													{/* Bên phải là mặc định */}
													<label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold text-brand-dark">
														<input
															type="checkbox"
															id={`editDefault-${acc.id}`}
															checked={editIsDefault}
															onChange={(e) => setEditIsDefault(e.target.checked)}
															className="w-4 h-4 cursor-pointer accent-brand-dark rounded"
														/>
														<span>Đặt làm mặc định</span>
													</label>
												</div>

												{/* Phải cùng là hủy, xác nhận */}
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={cancelEditing}
														className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-bold cursor-pointer border-none text-xs transition-colors"
													>
														Hủy
													</button>
													<button
														type="button"
														onClick={() => onUpdateSubmit(acc.id)}
														disabled={updatePending}
														className="px-4 py-1.5 bg-brand-dark text-white rounded-md font-black cursor-pointer hover:bg-brand-primary hover:text-brand-dark transition-all disabled:opacity-50 border-none text-xs shadow-xs"
													>
														{updatePending ? "Đang lưu..." : "Xác nhận"}
													</button>
												</div>
											</div>
										</div>
									) : (
										<>
											<div className="flex-1 flex items-center gap-3 text-left">
												{displayLogo ? (
													<img
														src={displayLogo}
														alt={acc.bankName}
														className="w-11 h-11 object-contain rounded-md border border-brand-border bg-slate-50 p-1.5 shrink-0 shadow-2xs"
														onError={(e) => {
															(e.target as HTMLElement).style.display = "none";
														}}
													/>
												) : (
													<div className="w-11 h-11 rounded-md border border-brand-border bg-slate-100 flex items-center justify-center shrink-0 text-brand-muted font-black text-xs">
														{acc.bankName.slice(0, 3).toUpperCase()}
													</div>
												)}
												<div className="space-y-1">
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
											</div>

											<div className="flex items-center gap-1.5 shrink-0">
												<button
													onClick={() => { setShowAddForm(false); startEditing(acc); }}
													className="p-1.5 px-2.5 bg-brand-light-soft text-brand-dark hover:bg-brand-border rounded-md cursor-pointer flex items-center gap-1 text-[10px] font-black border-none transition-colors"
													title="Chỉnh sửa tài khoản"
												>
													<Edit className="w-3.5 h-3.5" />
													Sửa
												</button>
												{onDeleteSubmit && (
													<button
														onClick={() => onDeleteSubmit(acc.id)}
														disabled={deletePending}
														className="p-1.5 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-md cursor-pointer flex items-center gap-1 text-[10px] font-black border-none transition-colors disabled:opacity-50"
														title="Xóa tài khoản ngân hàng này"
													>
														<Trash2 className="w-3.5 h-3.5" />
														Xóa
													</button>
												)}
											</div>
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
