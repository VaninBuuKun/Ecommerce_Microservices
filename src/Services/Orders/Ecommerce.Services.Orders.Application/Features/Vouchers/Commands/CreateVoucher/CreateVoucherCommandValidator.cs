using System;
using Ecommerce.Services.Orders.Domain.Enums;
using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.CreateVoucher;

public class CreateVoucherCommandValidator : AbstractValidator<CreateVoucherCommand>
{
    public CreateVoucherCommandValidator()
    {
        RuleFor(x => x.voucherRequest)
            .NotNull()
            .WithMessage("Thông tin voucher không được để trống.");

        When(x => x.voucherRequest != null, () =>
        {
            RuleFor(x => x.voucherRequest.Code)
                .NotEmpty().WithMessage("Mã voucher không được để trống.")
                .MaximumLength(50).WithMessage("Mã voucher tối đa 50 ký tự.");

            RuleFor(x => x.voucherRequest.Name)
                .NotEmpty().WithMessage("Tên voucher không được để trống.")
                .MaximumLength(100).WithMessage("Tên voucher tối đa 100 ký tự.");

            RuleFor(x => x.voucherRequest.DiscountValue)
                .GreaterThan(0).WithMessage("Giá trị giảm giá phải lớn hơn 0.");

            When(x => x.voucherRequest.DiscountType == DiscountType.Percentage, () =>
            {
                RuleFor(x => x.voucherRequest.DiscountValue)
                    .InclusiveBetween(1, 100)
                    .WithMessage("Phần trăm giảm giá phải từ 1% đến 100%.");

                RuleFor(x => x.voucherRequest.MaxDiscountAmount)
                    .GreaterThan(0)
                    .When(x => x.voucherRequest.MaxDiscountAmount.HasValue)
                    .WithMessage("Số tiền giảm tối đa phải lớn hơn 0.");
            });

            RuleFor(x => x.voucherRequest.MinOrderValue)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Giá trị đơn hàng tối thiểu không được âm.");

            RuleFor(x => x.voucherRequest.MaxUsageCount)
                .GreaterThan(0)
                .WithMessage("Tổng lượt sử dụng tối đa phải lớn hơn 0.");

            RuleFor(x => x.voucherRequest.MaxUsagePerUser)
                .GreaterThan(0)
                .WithMessage("Lượt sử dụng tối đa trên mỗi người dùng phải lớn hơn 0.");

            RuleFor(x => x.voucherRequest.EndDate)
                .Must(endDate => endDate > DateTimeOffset.UtcNow)
                .WithMessage("Thời gian kết thúc phải ở tương lai.");

            RuleFor(x => x.voucherRequest)
                .Must(r => r.StartDate < r.EndDate)
                .WithMessage("Thời gian bắt đầu phải trước thời gian kết thúc.");

            // Phân quyền tạo Scope: Admin chỉ tạo Platform, Seller chỉ tạo Shop (bắt buộc truyền ShopId > 0)
            When(x => x.IsAdmin, () =>
            {
                RuleFor(x => x.voucherRequest.ShopId)
                    .Must(shopId => !shopId.HasValue || shopId.Value <= 0)
                    .WithMessage("Quản trị viên (Admin) chỉ được phép tạo Voucher toàn sàn (Platform), không được gán ShopId.");
            });

            When(x => !x.IsAdmin, () =>
            {
                RuleFor(x => x.voucherRequest.ShopId)
                    .NotNull().WithMessage("Người bán (Seller) bắt buộc phải truyền ShopId khi tạo voucher gian hàng.")
                    .GreaterThan(0).WithMessage("Mã gian hàng (ShopId) của voucher không hợp lệ.");
            });
        });
    }
}
