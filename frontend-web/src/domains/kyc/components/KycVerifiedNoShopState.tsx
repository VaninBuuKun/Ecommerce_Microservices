import { CheckCircle2, ArrowLeft } from "lucide-react";

interface Props {
	onBack: () => void;
	onRegisterShop: () => void;
}

export const KycVerifiedNoShopState: React.FC<Props> = ({
	onBack,
	onRegisterShop,
}) => {
	return (
		<div className="text-center py-6 font-sans text-left">
			<div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
				<CheckCircle2 className="w-6 h-6 text-emerald-500" />
			</div>
			<h2 className="text-base font-bold text-brand-dark mb-1 text-center">
				Đã xác minh định danh
			</h2>
			<p className="text-xs text-emerald-600 font-medium mb-4 text-center">
				Tài khoản của bạn đã đủ điều kiện mở cửa hàng!
			</p>
			<p className="text-xs text-brand-muted mb-6 leading-relaxed text-center">
				Hiện tại chưa có shop nào cả, hãy thực hiện thủ tục đăng ký shop
				để trở thành người bán.
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
					onClick={onRegisterShop}
					className="px-4 py-2 bg-brand-primary text-brand-dark font-black text-xs rounded hover:bg-brand-primary-deep transition-colors cursor-pointer"
				>
					Tiến hành đăng ký shop
				</button>
			</div>
		</div>
	);
};