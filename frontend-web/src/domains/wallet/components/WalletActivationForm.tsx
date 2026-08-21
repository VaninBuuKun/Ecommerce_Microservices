import React from "react";
import { AlertTriangle, CreditCard, Loader2 } from "lucide-react";
import { VIETNAM_BANKS } from "@/shared/consts/banks";

interface WalletActivationFormProps {
	onSubmit: (e: React.FormEvent) => void;
	bankName: string;
	setBankName: (val: string) => void;
	bankAccountNumber: string;
	setBankAccountNumber: (val: string) => void;
	bankAccountHolder: string;
	setBankAccountHolder: (val: string) => void;
	formError: string;
	pending: boolean;
}

export function WalletActivationForm({
	onSubmit,
	bankName,
	setBankName,
	bankAccountNumber,
	setBankAccountNumber,
	bankAccountHolder,
	setBankAccountHolder,
	formError,
	pending,
}: WalletActivationFormProps) {
	// Hỗ trợ tự động chuẩn hóa chữ viết hoa không dấu
	const handleHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const upperNoAccent = e.target.value
			.toUpperCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/Đ/g, "D")
			.replace(/[^A-Z0-9 ]/g, "");
		setBankAccountHolder(upperNoAccent);
	};

	// Hỗ trợ chỉ cho phép nhập tối đa 15 chữ số
	const handleAccountNumberChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const onlyNumbers = e.target.value.replace(/[^0-9]/g, "").slice(0, 15);
		setBankAccountNumber(onlyNumbers);
	};

	return (
		<div className="space-y-6 text-left font-sans">
			<div className="pb-3 border-b border-brand-border">
				<h2 className="text-base font-black text-brand-dark uppercase tracking-wide">
					Quản lý ví cá nhân
				</h2>
				<p className="text-xs text-brand-muted">
					Kích hoạt và liên kết ví điện tử để thực hiện giao dịch,
					thanh toán và hoàn tiền.
				</p>
			</div>

			<div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 flex gap-3 items-start text-amber-800 text-xs">
				<AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
				<div className="space-y-1 font-medium">
					<p className="font-extrabold text-sm text-brand-dark">
						Bạn chưa kích hoạt ví điện tử liên kết
					</p>
					<p className="text-brand-muted text-[11px] leading-relaxed">
						Để có thể đăng ký bán hàng (KYC), nhận tiền bán sản phẩm
						hoặc thực hiện các yêu cầu hoàn tiền (Refund) trên sàn,
						bạn bắt buộc phải kích hoạt ví điện tử liên kết trước.
					</p>
				</div>
			</div>

			<form onSubmit={onSubmit} className="space-y-4">
				<h3 className="text-xs font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
					<CreditCard className="w-4 h-4 text-brand-primary" />
					Thông tin tài khoản ngân hàng liên kết
				</h3>

				<div className="space-y-3 text-xs">
					<div className="space-y-1">
						<label className="font-extrabold text-brand-dark">
							Ngân hàng liên kết
						</label>
						<select
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
							className="w-full h-9 px-2.5 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary bg-white font-medium text-brand-dark"
							required
						>
							<option value="">
								-- Chọn ngân hàng Việt Nam --
							</option>
							{VIETNAM_BANKS.map((b) => (
								<option key={b.code} value={b.name}>
									{b.name} ({b.code})
								</option>
							))}
						</select>
					</div>

					<div className="space-y-1">
						<label className="font-extrabold text-brand-dark">
							Số tài khoản ngân hàng
						</label>
						<input
							type="text"
							placeholder="Nhập số tài khoản (tối đa 15 chữ số)..."
							value={bankAccountNumber}
							onChange={handleAccountNumberChange}
							className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary bg-white font-medium text-brand-dark font-mono"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="font-extrabold text-brand-dark">
							Tên chủ tài khoản (Viết hoa không dấu)
						</label>
						<input
							type="text"
							placeholder="Ví dụ: NGUYEN VAN A"
							value={bankAccountHolder}
							onChange={handleHolderChange}
							className="w-full h-9 px-3 border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary bg-white font-medium text-brand-dark"
							required
						/>
					</div>
				</div>

				{formError && (
					<p className="text-[10px] font-bold text-red-600">
						{formError}
					</p>
				)}

				<button
					type="submit"
					disabled={pending}
					className="w-full h-10 bg-brand-dark hover:bg-brand-primary hover:text-brand-dark text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
				>
					{pending ? (
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
