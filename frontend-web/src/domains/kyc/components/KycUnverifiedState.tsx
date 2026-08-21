import { ShieldAlert, ArrowLeft, CreditCard, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWalletQuery } from "@/domains/order";

interface Props {
	onBack: () => void;
	onProceed: () => void;
}

export const KycUnverifiedState: React.FC<Props> = ({ onBack, onProceed }) => {
	const navigate = useNavigate();
	const {
		data: wallet,
		isLoading: walletLoading,
		error: walletError,
	} = useWalletQuery();

	const hasWallet = !!wallet && !walletError;

	return (
		<div className="text-center py-4 font-sans text-left">
			{walletLoading ? (
				<div className="py-8 text-center text-xs text-brand-muted flex flex-col items-center gap-2">
					<div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
					Đang kiểm tra thông tin ví điện tử...
				</div>
			) : !hasWallet ? (
				/* TRƯỜNG HỢP 1: CHƯA KÍCH HOẠT VÍ */
				<>
					<div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
						<Wallet className="w-6 h-6 text-amber-600" />
					</div>
					<h2 className="text-base font-bold text-brand-dark mb-2 text-center uppercase tracking-wide">
						Yêu cầu kích hoạt ví điện tử
					</h2>
					<p className="text-xs text-brand-muted mb-6 leading-relaxed max-w-md mx-auto text-center">
						Bạn cần kích hoạt ví điện tử liên kết trước khi thực
						hiện nộp hồ sơ xác minh định danh (KYC) để trở thành
						người bán.
					</p>

					<div className="flex gap-3 justify-center">
						<button
							type="button"
							onClick={onBack}
							className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Quay lại
						</button>
						<button
							type="button"
							onClick={() => navigate("/profile?tab=wallet")}
							className="px-4 py-2 bg-brand-primary text-brand-dark hover:bg-brand-primary hover:text-brand-dark font-black text-xs rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
						>
							<CreditCard className="w-3.5 h-3.5" />
							Đến trang quản lý ví
						</button>
					</div>
				</>
			) : (
				/* TRƯỜNG HỢP 2: ĐÃ CÓ VÍ -> TIẾN HÀNH KYC */
				<>
					<div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
						<ShieldAlert className="w-6 h-6 text-amber-500" />
					</div>
					<h2 className="text-base font-bold text-brand-dark mb-2 text-center">
						Xác minh định danh
					</h2>
					<p className="text-xs text-brand-muted mb-6 leading-relaxed text-center">
						Nhập thông tin định danh để trở thành người bán trên
						BuuStore.
					</p>

					<div className="flex gap-3 justify-center">
						<button
							type="button"
							onClick={onBack}
							className="px-4 py-2 border border-brand-border rounded text-xs font-semibold text-brand-dark hover:bg-brand-light-soft transition-colors cursor-pointer flex items-center gap-1"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Quay lại
						</button>
						<button
							type="button"
							onClick={onProceed}
							className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
						>
							Tiến hành
						</button>
					</div>
				</>
			)}
		</div>
	);
};