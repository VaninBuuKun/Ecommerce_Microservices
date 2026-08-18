import { CreditCard, Check } from "lucide-react";

interface PaymentMethodSelectorProps {
	paymentMethods: any[] | undefined;
	paymentProvider: string;
	setPaymentProvider: (provider: string) => void;
}

export function PaymentMethodSelector({
	paymentMethods,
	paymentProvider,
	setPaymentProvider,
}: PaymentMethodSelectorProps) {
	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 shadow-sm text-left">
			<h3 className="text-xs font-bold text-brand-dark mb-3 uppercase tracking-wider flex items-center gap-2">
				<CreditCard className="w-4 h-4 text-brand-primary" />
				Phương Thức Thanh Toán
			</h3>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{paymentMethods && paymentMethods.length > 0 ? (
					paymentMethods
						.filter((m) => m.isActive)
						.map((method) => {
							const isSelected = paymentProvider === method.providerName;
							return (
								<button
									key={method.id}
									type="button"
									onClick={() => setPaymentProvider(method.providerName)}
									className={`p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
										isSelected
											? "border-brand-primary bg-brand-primary/5 text-brand-dark font-extrabold"
											: "border-brand-border bg-white text-brand-muted hover:border-brand-muted"
									}`}
								>
									<div>
										<span className="text-xs block">
											{method.displayName}
										</span>
										<span className="text-[9px] text-brand-muted font-normal block mt-0.5">
											{method.description || "Thanh toán tiện lợi"}
										</span>
									</div>
									{isSelected && (
										<Check className="w-4 h-4 text-brand-primary shrink-0" />
									)}
								</button>
							);
						})
				) : (
					<div className="p-3.5 rounded-xl border border-brand-primary bg-brand-primary/5 text-left font-bold text-xs text-brand-dark flex items-center justify-between col-span-3">
						<span>Thanh toán khi nhận hàng (COD)</span>
						<Check className="w-4 h-4 text-brand-primary" />
					</div>
				)}
			</div>
		</div>
	);
}
