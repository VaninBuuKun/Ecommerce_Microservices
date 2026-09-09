import React from "react";
import { NumberInput } from "@/shared";

interface ShippingInfoCardProps {
	weight: number;
	setWeight: (v: number) => void;
	length: number;
	setLength: (v: number) => void;
	width: number;
	setWidth: (v: number) => void;
	height: number;
	setHeight: (v: number) => void;
}

export const ShippingInfoCard: React.FC<ShippingInfoCardProps> = ({
	weight,
	setWeight,
	length,
	setLength,
	width,
	setWidth,
	height,
	setHeight,
}) => {
	return (
		<div className="bg-white border border-brand-border rounded-xl p-5 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left font-sans">
			{/* Header */}
			<div className="pb-3 border-b border-brand-border space-y-1">
				<h3 className="text-sm font-bold text-brand-dark">
					Thông tin vận chuyển & Quy cách đóng gói
				</h3>
				<p className="text-xs text-brand-muted leading-relaxed max-w-2xl">
					Kích thước đóng gói và khối lượng sản phẩm sau khi đóng hộp là cơ sở bắt buộc để tính toán cước phí và tạo đơn giao hàng. Vui lòng nhập đúng quy cách kiện hàng thực tế để tránh phát sinh phụ phí trọng lượng vượt mức.
				</p>
			</div>

			{/* Dimension Inputs */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
				<div className="space-y-1.5">
					<label className="block font-bold text-brand-dark">
						Khối lượng đóng gói <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<NumberInput
							value={weight}
							onChange={setWeight}
							className="w-full h-9 pl-3 pr-8 border border-brand-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary"
						/>
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted pointer-events-none">
							gram
						</span>
					</div>
					<span className="text-[10px] text-brand-muted">
						Khối lượng cả bao bì (Ví dụ: 250g)
					</span>
				</div>

				<div className="space-y-1.5">
					<label className="block font-bold text-brand-dark">
						Chiều dài (D) <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<NumberInput
							value={length}
							onChange={setLength}
							className="w-full h-9 pl-3 pr-8 border border-brand-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary"
						/>
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted pointer-events-none">
							cm
						</span>
					</div>
					<span className="text-[10px] text-brand-muted">
						Kích thước đóng hộp (Ví dụ: 20cm)
					</span>
				</div>

				<div className="space-y-1.5">
					<label className="block font-bold text-brand-dark">
						Chiều rộng (R) <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<NumberInput
							value={width}
							onChange={setWidth}
							className="w-full h-9 pl-3 pr-8 border border-brand-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary"
						/>
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted pointer-events-none">
							cm
						</span>
					</div>
					<span className="text-[10px] text-brand-muted">
						Kích thước đóng hộp (Ví dụ: 15cm)
					</span>
				</div>

				<div className="space-y-1.5">
					<label className="block font-bold text-brand-dark">
						Chiều cao (C) <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<NumberInput
							value={height}
							onChange={setHeight}
							className="w-full h-9 pl-3 pr-8 border border-brand-border rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-primary"
						/>
						<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted pointer-events-none">
							cm
						</span>
					</div>
					<span className="text-[10px] text-brand-muted">
						Kích thước đóng hộp (Ví dụ: 10cm)
					</span>
				</div>
			</div>
		</div>
	);
};

