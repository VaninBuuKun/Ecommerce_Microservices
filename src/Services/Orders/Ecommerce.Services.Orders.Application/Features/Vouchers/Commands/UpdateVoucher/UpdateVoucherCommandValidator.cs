using System;
using Ecommerce.Services.Orders.Domain.Enums;
using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.UpdateVoucher;

public class UpdateVoucherCommandValidator : AbstractValidator<UpdateVoucherCommand>
{
    public UpdateVoucherCommandValidator()
    {
        RuleFor(x => x.VoucherId)
            .GreaterThan(0)
            .WithMessage("Mã định danh voucher (VoucherId) phải lớn hơn 0.");

        RuleFor(x => x.Request)
            .NotNull()
            .WithMessage("Thông tin cập nhật voucher không được để trống.");

        When(x => x.Request != null, () =>
        {
            RuleFor(x => x.Request.Name)
                .MaximumLength(100).WithMessage("Tên voucher tối đa 100 ký tự.")
                .When(x => !string.IsNullOrEmpty(x.Request.Name));

            RuleFor(x => x.Request.DiscountValue)
                .GreaterThan(0)
                .When(x => x.Request.DiscountValue.HasValue)
                .WithMessage("Giá trị giảm giá phải lớn hơn 0.");

            When(x => x.Request.DiscountType == DiscountType.Percentage && x.Request.DiscountValue.HasValue, () =>
            {
                RuleFor(x => x.Request.DiscountValue!.Value)
                    .InclusiveBetween(1, 100)
                    .WithMessage("Phần trăm giảm giá phải từ 1% đến 100%.");
            });

            RuleFor(x => x.Request.MinOrderValue)
                .GreaterThanOrEqualTo(0)
                .When(x => x.Request.MinOrderValue.HasValue)
                .WithMessage("Giá trị đơn hàng tối thiểu không được âm.");

            RuleFor(x => x.Request.MaxUsageCount)
                .GreaterThan(0)
                .When(x => x.Request.MaxUsageCount.HasValue)
                .WithMessage("Tổng lượt sử dụng tối đa phải lớn hơn 0.");

            RuleFor(x => x.Request.MaxUsagePerUser)
                .GreaterThan(0)
                .When(x => x.Request.MaxUsagePerUser.HasValue)
                .WithMessage("Lượt sử dụng tối đa trên mỗi người dùng phải lớn hơn 0.");

            RuleFor(x => x.Request)
                .Must(r => !r.StartDate.HasValue || !r.EndDate.HasValue || r.StartDate.Value < r.EndDate.Value)
                .WithMessage("Thời gian bắt đầu phải trước thời gian kết thúc.");
        });
    }
}
