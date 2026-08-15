import React from "react";

// Helper render mô tả giảm giá (Xử lý cả Fixed Amount & Percentage)
export function renderDiscountLabel(voucher: any, subTotal?: number) {
	const discountType = voucher.discountType;
	const isPercentage = discountType === 0 || discountType === "Percentage";

	if (isPercentage) {
		const maxDiscount = voucher.maxDiscountAmount || voucher.maxDiscount;
		let actualText = "";
		if (subTotal !== undefined && subTotal > 0) {
			const estimated = Math.min(subTotal * (voucher.discountValue / 100), maxDiscount || Infinity);
			actualText = `Thực tế giảm: -${estimated.toLocaleString("vi-VN")}đ`;
		}
		return (
			<>
				Giảm <span className="text-red-500 font-extrabold">{voucher.discountValue}%</span>
				{maxDiscount ? ` (Tối đa ${maxDiscount.toLocaleString("vi-VN")}đ)` : ""}
				{actualText && <span className="text-green-600 font-extrabold block mt-0.5">{actualText}</span>}
			</>
		);
	}

	let actualText = "";
	if (subTotal !== undefined && subTotal > 0) {
		const estimated = Math.min(subTotal, voucher.discountValue);
		actualText = `Thực tế giảm: -${estimated.toLocaleString("vi-VN")}đ`;
	}

	return (
		<>
			Giảm <span className="text-red-500 font-extrabold">{voucher.discountValue?.toLocaleString("vi-VN")}đ</span>
			{actualText && <span className="text-green-600 font-extrabold block mt-0.5">{actualText}</span>}
		</>
	);
}
