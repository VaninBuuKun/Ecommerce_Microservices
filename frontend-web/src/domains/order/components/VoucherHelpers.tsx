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
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Chờ thanh toán
				</span>
			);
		case "AwaitingConfirmation":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Chờ xác nhận
				</span>
			);
		case "Processing":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đang xử lý
				</span>
			);
		case "PackageReady":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Chờ shipper lấy
				</span>
			);
		case "Shipping":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đang vận chuyển
				</span>
			);
		case "Delivered":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã giao hàng
				</span>
			);
		case "Completed":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hoàn thành
				</span>
			);
		case "Returning":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đang trả hàng
				</span>
			);
		case "Refunded":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hoàn tiền
				</span>
			);
		case "Cancelled":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hủy
				</span>
			);
		case "Rejected":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Bị từ chối
				</span>
			);
		default:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-brand-dark bg-brand-light-soft border border-brand-border rounded-md leading-none shadow-2xs whitespace-nowrap">
					{status || "N/A"}
				</span>
			);
	}
}

export function getShipmentStatusBadge(status: number | string) {
	const numericStatus = typeof status === "string" ? parseInt(status, 10) : status;
	switch (numericStatus) {
		case 1:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Chờ lấy hàng
				</span>
			);
		case 2:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đang vận chuyển
				</span>
			);
		case 3:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Giao hàng thành công
				</span>
			);
		case 4:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hoàn trả
				</span>
			);
		case 5:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hủy
				</span>
			);
		case 6:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Thất bại
				</span>
			);
		default:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-brand-dark bg-brand-light-soft border border-brand-border rounded-md leading-none shadow-2xs whitespace-nowrap">
					{String(status || "N/A")}
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

export function getRefundStatusBadge(status: string) {
	switch (status) {
		case "Pending":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Chờ xử lý
				</span>
			);
		case "SellerApproved":
		case "Approved":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã chấp thuận
				</span>
			);
		case "SellerRejected":
		case "Rejected":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã từ chối
				</span>
			);
		case "Cancelled":
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-md leading-none shadow-2xs whitespace-nowrap">
					Đã hủy
				</span>
			);
		default:
			return (
				<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-bold text-brand-dark bg-brand-light-soft border border-brand-border rounded-md leading-none shadow-2xs whitespace-nowrap">
					{status || "N/A"}
				</span>
			);
	}
}
