import React, { useState } from "react";
import { Loader2, Clock, History } from "lucide-react";
import { toast } from "react-toastify";
import {
	useWalletQuery,
	useActivateWalletMutation,
	useBankAccountsQuery,
	useAddBankAccountMutation,
	useUpdateBankAccountMutation,
	useWalletTransactionsQuery,
	useCreateWithdrawMutation,
	useMyWithdrawalsQuery,
} from "@/domains/order";

import { WalletBalanceCard } from "./WalletBalanceCard";
import { BankAccountCard } from "./BankAccountCard";
import { BankAccountManagerModal } from "./BankAccountManagerModal";
import { WithdrawRequestModal } from "./WithdrawRequestModal";
import { WalletTransactionsTable } from "./WalletTransactionsTable";
import { WithdrawRequestsTable } from "./WithdrawRequestsTable";
import { WalletActivationForm } from "./WalletActivationForm";

export function WalletTab() {
	const { data: wallet, isLoading: walletLoading, error: walletError, refetch } = useWalletQuery();
	const activateWalletMutation = useActivateWalletMutation();

	const { data: bankAccounts, isLoading: banksLoading } = useBankAccountsQuery();
	const addBankMutation = useAddBankAccountMutation();
	const updateBankMutation = useUpdateBankAccountMutation();

	const { data: transactions = [], isLoading: txLoading } = useWalletTransactionsQuery();
	const { data: myWithdrawals = [], isLoading: withdrawsLoading } = useMyWithdrawalsQuery();
	const createWithdrawMutation = useCreateWithdrawMutation();


	// State cho Activation form
	const [bankName, setBankName] = useState("");
	const [bankAccountNumber, setBankAccountNumber] = useState("");
	const [bankAccountHolder, setBankAccountHolder] = useState("");
	const [formError, setFormError] = useState("");

	// State cho Modal Quản lý ngân hàng
	const [showBankModal, setShowBankModal] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	const [newBankName, setNewBankName] = useState("");
	const [newBankAccountNumber, setNewBankAccountNumber] = useState("");
	const [newBankAccountHolder, setNewBankAccountHolder] = useState("");
	const [newIsDefault, setNewIsDefault] = useState(false);

	const [editBankName, setEditBankName] = useState("");
	const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
	const [editBankAccountHolder, setEditBankAccountHolder] = useState("");
	const [editIsDefault, setEditIsDefault] = useState(false);

	// State cho Modal Rút tiền
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [withdrawAmount, setWithdrawAmount] = useState("");
	const [withdrawError, setWithdrawError] = useState("");

	// State cho Tab phân trang hoạt động ví
	const [activeSubTab, setActiveSubTab] = useState<"withdrawals" | "transactions">("withdrawals");
	const [withdrawPage, setWithdrawPage] = useState(1);
	const [txPage, setTxPage] = useState(1);
	const pageSize = 5;

	const handleActivate = (e: React.FormEvent) => {
		e.preventDefault();
		setFormError("");
		if (!bankName || !bankAccountNumber || !bankAccountHolder) {
			setFormError("Vui lòng điền đầy đủ thông tin ngân hàng.");
			return;
		}

		activateWalletMutation.mutate(
			{ bankName, bankAccountNumber, bankAccountHolder },
			{
				onSuccess: () => {
					toast.success("Kích hoạt Ví cá nhân thành công!");
					refetch();
				},
				onError: (err: any) => {
					setFormError(err?.response?.data || "Kích hoạt ví thất bại. Vui lòng thử lại.");
				},
			}
		);
	};

	const handleAddBankAccount = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newBankName || !newBankAccountNumber || !newBankAccountHolder) {
			toast.error("Vui lòng nhập đầy đủ thông tin tài khoản.");
			return;
		}

		addBankMutation.mutate(
			{
				bankName: newBankName,
				bankAccountNumber: newBankAccountNumber,
				bankAccountHolder: newBankAccountHolder,
				isDefault: newIsDefault,
			},
			{
				onSuccess: () => {
					toast.success("Liên kết tài khoản ngân hàng mới thành công!");
					setShowAddForm(false);
					setNewBankName("");
					setNewBankAccountNumber("");
					setNewBankAccountHolder("");
					setNewIsDefault(false);
				},
				onError: (err: any) => {
					toast.error(err?.response?.data || "Không thể liên kết tài khoản ngân hàng.");
				},
			}
		);
	};

	const startEditing = (acc: any) => {
		setEditingId(acc.id);
		setEditBankName(acc.bankName);
		setEditBankAccountNumber(acc.bankAccountNumber);
		setEditBankAccountHolder(acc.bankAccountHolder);
		setEditIsDefault(acc.isDefault);
	};

	const cancelEditing = () => {
		setEditingId(null);
	};

	const handleUpdateBankAccount = (id: number) => {
		if (!editBankName || !editBankAccountNumber || !editBankAccountHolder) {
			toast.error("Vui lòng nhập đầy đủ thông tin.");
			return;
		}

		updateBankMutation.mutate(
			{
				id,
				data: {
					bankName: editBankName,
					bankAccountNumber: editBankAccountNumber,
					bankAccountHolder: editBankAccountHolder,
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
			<div className="flex flex-col items-center justify-center py-20 text-brand-muted text-xs gap-3 font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
				Đang tải thông tin ví điện tử...
			</div>
		);
	}

	const is404 = (walletError as any)?.response?.status === 404 || !wallet;
	if (is404) {
		return (
			<WalletActivationForm
				onSubmit={handleActivate}
				bankName={bankName}
				setBankName={setBankName}
				bankAccountNumber={bankAccountNumber}
				setBankAccountNumber={setBankAccountNumber}
				bankAccountHolder={bankAccountHolder}
				setBankAccountHolder={setBankAccountHolder}
				formError={formError}
				pending={activateWalletMutation.isPending}
			/>
		);
	}

	const defaultAccount = bankAccounts?.find((acc: any) => acc.isDefault) || bankAccounts?.[0];
	const extraAccountsCount = bankAccounts ? bankAccounts.length - 1 : 0;

	const handleWithdrawSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setWithdrawError("");
		const amountNum = Number(withdrawAmount);
		if (isNaN(amountNum) || amountNum <= 0) {
			setWithdrawError("Số tiền rút phải lớn hơn 0đ.");
			return;
		}
		if (wallet && amountNum > wallet.balance) {
			setWithdrawError("Số tiền rút vượt quá số dư khả dụng.");
			return;
		}
		if (!defaultAccount) {
			setWithdrawError("Vui lòng liên kết tài khoản ngân hàng nhận tiền trước.");
			return;
		}

		createWithdrawMutation.mutate(
			{
				amount: amountNum,
				bankAccountId: defaultAccount.id,
			},
			{
				onSuccess: () => {
					toast.success("Tạo yêu cầu rút tiền thành công! Vui lòng chờ Admin phê duyệt.");
					setShowWithdrawModal(false);
					refetch();
				},
				onError: (err: any) => {
					setWithdrawError(err?.response?.data || "Không thể thực hiện yêu cầu rút tiền. Vui lòng thử lại.");
				},
			}
		);
	};

	const totalWithdraws = myWithdrawals.length;
	const paginatedWithdraws = myWithdrawals.slice((withdrawPage - 1) * pageSize, withdrawPage * pageSize);

	const totalTx = transactions.length;
	const paginatedTx = transactions.slice((txPage - 1) * pageSize, txPage * pageSize);

	const getWithdrawStatusBadge = (status: string) => {
		switch (status) {
			case "Pending":
				return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-yellow-50 text-yellow-700 border border-yellow-200">Đang chờ</span>;
			case "Approved":
				return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">Đã duyệt</span>;
			case "Completed":
			case "Paid":
				return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Thành công</span>;
			case "Rejected":
				return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">Từ chối</span>;
			default:
				return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-gray-50 text-gray-600">{status}</span>;
		}
	};

	return (
		<div className="space-y-6 text-left font-sans max-w-4xl mx-auto">
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Quản lý ví cá nhân
				</h2>
				<p className="text-xs text-brand-muted">
					Theo dõi số dư, liên kết tài khoản ngân hàng và lịch sử giao dịch ví của bạn.
				</p>
			</div>

			{/* PHẦN THẺ VÍ & NGÂN HÀNG CỐ ĐỊNH Ở ĐẦU */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
				<WalletBalanceCard 
					wallet={wallet} 
					onWithdrawClick={() => {
						setWithdrawAmount("");
						setWithdrawError("");
						setShowWithdrawModal(true);
					}} 
				/>
				<BankAccountCard 
					banksLoading={banksLoading} 
					defaultAccount={defaultAccount} 
					extraAccountsCount={extraAccountsCount} 
					onManageBankClick={() => setShowBankModal(true)} 
				/>
			</div>

			{/* ĐIỀU HƯỚNG TAB LỊCH SỬ BÊN DƯỚI */}
			<div className="space-y-4 pt-4 border-t border-brand-border">
				<div className="flex justify-between items-center pb-2">
					<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide">Lịch sử hoạt động ví</h3>
					
					<div className="flex bg-brand-light-soft/50 p-1 rounded-xl border border-brand-border shrink-0 select-none">
						<button
							onClick={() => { setActiveSubTab("withdrawals"); setWithdrawPage(1); }}
							className={`px-3.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border-none flex items-center gap-1 ${
								activeSubTab === "withdrawals" ? "bg-brand-dark text-white shadow-xs" : "text-brand-muted hover:text-brand-dark"
							}`}
						>
							<Clock className="w-3.5 h-3.5" />
							Yêu cầu rút tiền
						</button>
						<button
							onClick={() => { setActiveSubTab("transactions"); setTxPage(1); }}
							className={`px-3.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border-none flex items-center gap-1 ${
								activeSubTab === "transactions" ? "bg-brand-dark text-white shadow-xs" : "text-brand-muted hover:text-brand-dark"
							}`}
						>
							<History className="w-3.5 h-3.5" />
							Lịch sử giao dịch
						</button>
					</div>
				</div>

				{activeSubTab === "withdrawals" ? (
					<WithdrawRequestsTable 
						withdrawsLoading={withdrawsLoading}
						paginatedWithdraws={paginatedWithdraws}
						totalWithdraws={totalWithdraws}
						withdrawPage={withdrawPage}
						pageSize={pageSize}
						setWithdrawPage={setWithdrawPage}
						getWithdrawStatusBadge={getWithdrawStatusBadge}
					/>
				) : (
					<WalletTransactionsTable 
						txLoading={txLoading}
						paginatedTx={paginatedTx}
						totalTx={totalTx}
						txPage={txPage}
						pageSize={pageSize}
						setTxPage={setTxPage}
					/>
				)}
			</div>

			{/* Modal Quản lý tất cả tài khoản ngân hàng */}
			{showBankModal && (
				<BankAccountManagerModal 
					bankAccounts={bankAccounts || []}
					showAddForm={showAddForm}
					setShowAddForm={setShowAddForm}
					editingId={editingId}
					onClose={() => { setShowBankModal(false); setShowAddForm(false); cancelEditing(); }}
					
					newBankName={newBankName}
					setNewBankName={setNewBankName}
					newBankAccountNumber={newBankAccountNumber}
					setNewBankAccountNumber={setNewBankAccountNumber}
					newBankAccountHolder={newBankAccountHolder}
					setNewBankAccountHolder={setNewBankAccountHolder}
					newIsDefault={newIsDefault}
					setNewIsDefault={setNewIsDefault}
					onAddSubmit={handleAddBankAccount}
					addPending={addBankMutation.isPending}

					editBankName={editBankName}
					setEditBankName={setEditBankName}
					editBankAccountNumber={editBankAccountNumber}
					setEditBankAccountNumber={setEditBankAccountNumber}
					editBankAccountHolder={editBankAccountHolder}
					setEditBankAccountHolder={setEditBankAccountHolder}
					editIsDefault={editIsDefault}
					setEditIsDefault={setEditIsDefault}
					onUpdateSubmit={handleUpdateBankAccount}
					updatePending={updateBankMutation.isPending}
					startEditing={startEditing}
					cancelEditing={cancelEditing}
				/>
			)}

			{/* Modal Rút tiền */}
			{showWithdrawModal && (
				<WithdrawRequestModal 
					onClose={() => setShowWithdrawModal(false)}
					defaultAccount={defaultAccount}
					onSubmit={handleWithdrawSubmit}
					withdrawAmount={withdrawAmount}
					setWithdrawAmount={setWithdrawAmount}
					withdrawError={withdrawError}
					walletBalance={wallet.balance}
					mutationPending={createWithdrawMutation.isPending}
					onAddBankRedirect={() => { setShowWithdrawModal(false); setShowBankModal(true); }}
				/>
			)}
		</div>
	);
}
