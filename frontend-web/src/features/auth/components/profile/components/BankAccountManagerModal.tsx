import React from "react";
import { X, CreditCard, PlusCircle, Edit, Check } from "lucide-react";
import { VIETNAM_BANKS } from "../../../../../shared/consts/banks";

interface BankAccountManagerModalProps {
	bankAccounts: any[];
	showAddForm: boolean;
	setShowAddForm: (show: boolean) => void;
	editingId: string | null;
	onClose: () => void;
	
	// Thêm mới
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

	// Sửa đổi
	editBankName: string;
	setEditBankName: (val: string) => void;
	editBankAccountNumber: string;
	setEditBankAccountNumber: (val: string) => void;
	editBankAccountHolder: string;
	setEditBankAccountHolder: (val: string) => void;
	editIsDefault: boolean;
	setEditIsDefault: (val: boolean) => void;
	onUpdateSubmit: (id: string) => void;
	updatePending: boolean;
	startEditing: (acc: any) => void;
	cancelEditing: () => void;
}

export function BankAccountManagerModal({
	bankAccounts,
	showAddForm,
	setShowAddForm,
	editingId,
	onClose,
	
	newBankName, setNewBankName,
	newBankAccountNumber, setNewBankAccountNumber,
	newBankAccountHolder, setNewBankAccountHolder,
	newIsDefault, setNewIsDefault,
	onAddSubmit, addPending,

	editBankName, setEditBankName,
	editBankAccountNumber, setEditBankAccountNumber,
	editBankAccountHolder, setEditBankAccountHolder,
	editIsDefault, setEditIsDefault,
	onUpdateSubmit, updatePending,
	startEditing, cancelEditing,
}: BankAccountManagerModalProps) {

	// Hỗ trợ tự động chuẩn hóa chữ viết hoa không dấu
	const cleanHolderInput = (val: string) => {
		return val
			.toUpperCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
			.replace(/Đ/g, "D")
			.replace(/[^A-Z0-9 ]/g, ""); // Chỉ giữ chữ in hoa, số và khoảng trắng
	};

	// Hỗ trợ chỉ cho phép nhập tối đa 15 chữ số
	const cleanNumberInput = (val: string) => {
		return val.replace(/[^0-9]/g, "").slice(0, 15);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-xs font-sans">
			<div className="bg-white rounded-2xl max-w-2xl w-full border border-brand-border p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left">
				<div className="flex justify-between items-center border-b border-brand-border pb-3">
					<h3 className="font-black text-brand-dark text-sm uppercase flex items-center gap-1.5">
						<CreditCard className="w-4 h-4 text-brand-primary" />
						Quản lý ngân hàng liên kết
					</h3>
					<button 
						onClick={onClose}
						className="text-brand-muted hover:text-brand-dark cursor-pointer font-black text-sm border-none bg-transparent"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{showAddForm ? (
					<form onSubmit={onAddSubmit} className="border border-brand-border/60 bg-brand-light-soft/10 rounded-xl p-4 space-y-3">
						<h4 className="text-xs font-black text-brand-dark uppercase">Liên kết tài khoản mới</h4>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
							<div className="space-y-1">
								<label className="font-extrabold text-[10px] text-brand-muted uppercase">Ngân hàng</label>
								<select
									value={newBankName}
									onChange={(e) => setNewBankName(e.target.value)}
									className="w-full h-8 px-1.5 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
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
								className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold cursor-pointer border-none"
							>
								Hủy
							</button>
							<button
								type="submit"
								disabled={addPending}
								className="px-4 py-1 bg-brand-dark text-white rounded font-black cursor-pointer hover:bg-brand-primary hover:text-brand-dark transition-all disabled:opacity-50 border-none"
							>
								{addPending ? "Đang lưu..." : "Liên kết ngay"}
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

				<div className="space-y-3 pt-2 text-xs">
					<h4 className="text-xs font-black text-brand-muted uppercase tracking-wider">Danh sách tài khoản ({bankAccounts.length})</h4>
					
					<div className="divide-y divide-brand-border">
						{bankAccounts.map((acc: any) => {
							const isEditing = editingId === acc.id;
							const matchedBank = VIETNAM_BANKS.find(b => b.name.toLowerCase() === acc.bankName.toLowerCase());
							return (
								<div key={acc.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
									{isEditing ? (
										<div className="flex-1 w-full space-y-3">
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
												<div className="space-y-0.5 text-left">
													<span className="text-[9px] font-black uppercase text-brand-muted">Ngân hàng</span>
													<select
														value={editBankName}
														onChange={(e) => setEditBankName(e.target.value)}
														className="w-full h-8 px-1.5 border border-brand-border rounded focus:outline-none focus:border-brand-primary bg-white text-xs text-brand-dark font-medium"
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
										<div className="flex-1 flex items-center gap-3 text-left">
											{matchedBank?.logo && (
												<img src={matchedBank.logo} alt={acc.bankName} className="w-10 h-10 object-contain rounded border border-brand-border bg-slate-50 p-1" />
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
									)}

									<div className="flex items-center gap-2 shrink-0">
										{isEditing ? (
											<>
												<button
													onClick={() => onUpdateSubmit(acc.id)}
													disabled={updatePending}
													className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer flex items-center justify-center border-none"
													title="Lưu"
												>
													<Check className="w-3.5 h-3.5" />
												</button>
												<button
													onClick={cancelEditing}
													className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer flex items-center justify-center border-none"
													title="Hủy"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</>
										) : (
											<button
												onClick={() => { setShowAddForm(false); startEditing(acc); }}
												className="p-1.5 bg-brand-light-soft text-brand-dark hover:bg-brand-border rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-black border-none"
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
	);
}
