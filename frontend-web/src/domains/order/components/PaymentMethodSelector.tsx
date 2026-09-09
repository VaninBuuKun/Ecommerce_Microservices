import type { PaymentMethod } from "../types/order.types";
import { CreditCard, AlertCircle } from "lucide-react";

interface PaymentMethodSelectorProps {
	paymentMethods: PaymentMethod[] | undefined;
	paymentProvider: string;
	setPaymentProvider: (provider: string) => void;
	grandTotal?: number;
}

export function PaymentMethodSelector({
	paymentMethods,
	paymentProvider,
	setPaymentProvider,
	grandTotal,
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
						.map((method) => {
							const isBelowMin = Boolean(
								method.minAmount &&
								method.minAmount > 0 &&
								grandTotal !== undefined &&
								grandTotal < method.minAmount
							);
							const isSelected = paymentProvider === method.providerName;

							return (
								<label
									key={method.id}
									className={`flex items-start sm:items-center gap-3 p-3 rounded-md border transition-all ${
										isBelowMin
											? "opacity-55 cursor-not-allowed bg-gray-50/80 border-gray-200"
											: isSelected
											? "border-brand-primary bg-brand-primary/5 cursor-pointer"
											: "border-brand-border bg-white hover:border-brand-primary/50 cursor-pointer"
									}`}
								>
									<input
										type="radio"
										name="paymentMethod"
										disabled={isBelowMin}
										checked={isSelected}
										onChange={() => {
											if (!isBelowMin) {
												setPaymentProvider(method.providerName);
											}
										}}
										className="accent-brand-primary w-4 h-4 mt-0.5 sm:mt-0 disabled:cursor-not-allowed"
									/>
									<div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-brand-light-soft overflow-hidden mt-0.5 sm:mt-0">
										{method.iconUrl ? (
											<img src={method.iconUrl} alt={method.title} className="w-5 h-5 object-contain" />
										) : (
											<CreditCard className="w-3.5 h-3.5 text-brand-primary" />
										)}
									</div>
									<div className="text-left flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-xs font-bold text-brand-dark">{method.title}</span>
											{isBelowMin && (
												<span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-600 font-semibold border border-red-200/60">
													Tối thiểu {Number(method.minAmount).toLocaleString("vi-VN")} ₫
												</span>
											)}
										</div>
										{method.subTitle && (
											<div className="text-[10px] text-brand-muted font-semibold mt-0.5">{method.subTitle}</div>
										)}
										{isBelowMin && (
											<div className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
												Chỉ áp dụng cho đơn hàng từ {Number(method.minAmount).toLocaleString("vi-VN")} ₫ trở lên
											</div>
										)}
									</div>
								</label>
							);
						})
				) : (
					<div className="text-xs text-brand-muted py-3 font-bold text-center">
						Đang tải hoặc không có phương thức thanh toán khả dụng nào từ hệ thống...
					</div>
				)}
			</div>
		</div>
	);
}