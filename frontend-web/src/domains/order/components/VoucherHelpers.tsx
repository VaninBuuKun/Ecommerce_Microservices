import React from "react";

export function renderDiscountLabel(voucher: any, subTotal?: number) {
	const discountType = voucher.discountType;
	const isPercentage = discountType === "Percentage" || discountType === 1;

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

export function getOrderStatusBadge(status: string) {
	switch (status) {
		case "AwaitingPayment":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded">
					Chờ thanh toán
				</span>
			);
		case "AwaitingConfirmation":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded">
					Chờ xác nhận
				</span>
			);
		case "Processing":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded">
					Đang xử lý
				</span>
			);
		case "PackageReady":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">
					Chờ shipper lấy
				</span>
			);
		case "Shipping":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded">
					Đang giao hàng
				</span>
			);
		case "Delivered":
		case "Completed":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
					Đã hoàn thành
				</span>
			);
		case "Cancelled":
		case "Rejected":
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded">
					Đã hủy
				</span>
			);
		default:
			return (
				<span className="inline-block px-2.5 py-0.8 text-[10px] font-bold text-brand-dark bg-brand-light-soft border border-brand-border rounded">
					{status || "N/A"}
				</span>
			);
	}
}

export function getPaymentStatusLabel(status: string) {
	switch (status) {
		case "Succeeded":
		case "Paid":
			return { text: "Đã thanh toán", color: "text-emerald-600 font-bold" };
		case "Failed":
			return { text: "Thanh toán thất bại", color: "text-red-600 font-bold" };
		case "Pending":
		default:
			return { text: "Chờ thanh toán", color: "text-amber-600 font-bold" };
	}
}
