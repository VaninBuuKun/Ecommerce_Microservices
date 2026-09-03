import { z } from "zod";

export const voucherFormSchema = z
	.object({
		code: z
			.string()
			.trim()
			.min(6, "Mã voucher phải có ít nhất 6 ký tự.")
			.max(15, "Mã voucher tối đa 15 ký tự.")
			.regex(/^[A-Za-z0-9_-]+$/, "Mã voucher chỉ được chứa chữ cái, số, gạch nối (-) hoặc gạch dưới (_)."),
		name: z
			.string()
			.trim()
			.min(20, "Tên voucher phải có từ 20 đến 50 ký tự.")
			.max(50, "Tên voucher không được vượt quá 50 ký tự."),
		discountType: z.enum(["FixedAmount", "Percentage"]),
		discountValue: z.number().positive("Giá trị giảm giá phải lớn hơn 0."),
		maxDiscountAmount: z.number().positive("Giảm tối đa phải lớn hơn 0.").nullable().optional(),
		minOrderValue: z.number().min(0, "Đơn hàng tối thiểu không được âm.").nullable().optional(),
		startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu."),
		endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc."),
		usageLimit: z.number().int().positive("Số lượt sử dụng phải lớn hơn 0.").nullable().optional(),
		isActive: z.boolean().default(true),
	})
	.refine(
		(data) => {
			if (data.discountType === "Percentage" && data.discountValue > 100) {
				return false;
			}
			return true;
		},
		{
			message: "Phần trăm giảm giá không được vượt quá 100%.",
			path: ["discountValue"],
		}
	)
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return new Date(data.endDate) > new Date(data.startDate);
			}
			return true;
		},
		{
			message: "Ngày kết thúc phải diễn ra sau ngày bắt đầu.",
			path: ["endDate"],
		}
	);

export type VoucherFormData = z.infer<typeof voucherFormSchema>;
