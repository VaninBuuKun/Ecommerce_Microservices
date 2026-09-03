using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.DeleteVoucher;

public class DeleteVoucherCommandValidator : AbstractValidator<DeleteVoucherCommand>
{
    public DeleteVoucherCommandValidator()
    {
        RuleFor(x => x.VoucherId)
            .GreaterThan(0)
            .WithMessage("Mã định danh voucher (VoucherId) phải lớn hơn 0.");
    }
}
