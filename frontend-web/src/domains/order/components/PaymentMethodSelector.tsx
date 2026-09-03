import type { PaymentMethod } from "../types/order.types";
import { CreditCard } from "lucide-react";

interface PaymentMethodSelectorProps {
	paymentMethods: PaymentMethod[] | undefined;
	paymentProvider: string;
	setPaymentProvider: (provider: string) => void;
}

export function PaymentMethodSelector({
	paymentMethods,
	paymentProvider,
	setPaymentProvider,
}: PaymentMethodSelectorProps) {
	return (
		<div className="bg-white border border-brand-border rounded-md p-4 shadow-xs text-left font-sans">
			<h2 className="text-xs font-bold text-brand-dark mb-3.5 uppercase tracking-wider border-b border-brand-border/50 pb-2.5">
				Chọn hình thức thanh toán
			</h2>

			<div className="space-y-2.5">
				{paymentMethods && paymentMethods.length > 0 ? (
					paymentMethods
						.filter((method) => method.isActive)
						.map((method) => (
							<label
								key={method.id}
								className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
									paymentProvider === method.providerName
										? "border-brand-primary bg-brand-primary/5"
										: "border-brand-border bg-white hover:border-brand-primary/50"
								}`}
							>
								<input
									type="radio"
									name="paymentMethod"
									checked={paymentProvider === method.providerName}
									onChange={() => setPaymentProvider(method.providerName)}
									className="accent-brand-primary w-4 h-4"
								/>
								<div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-light-soft overflow-hidden">
									{method.iconUrl ? (
										<img src={method.iconUrl} alt={method.title} className="w-5 h-5 object-contain" />
									) : (
										<CreditCard className="w-3.5 h-3.5 text-brand-primary" />
									)}
								</div>
								<div className="text-left">
									<div className="text-xs font-bold text-brand-dark">{method.title}</div>
									{method.subTitle && (
										<div className="text-[10px] text-brand-muted font-semibold mt-0.5">{method.subTitle}</div>
									)}
								</div>
							</label>
						))
				) : (
					<div className="text-xs text-brand-muted py-3 font-bold text-center">
						Đang tải hoặc không có phương thức thanh toán khả dụng nào từ hệ thống...
					</div>
				)}
			</div>
		</div>
	);
}