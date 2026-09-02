using FluentValidation;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAdminVouchers;

public class GetAdminVouchersQueryValidator : AbstractValidator<GetAdminVouchersQuery>
{
    public GetAdminVouchersQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0)
            .WithMessage("Số trang (Page) phải lớn hơn 0.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0)
            .WithMessage("Kích thước trang (PageSize) phải lớn hơn 0.")
            .LessThanOrEqualTo(100)
            .WithMessage("Kích thước trang (PageSize) tối đa là 100.");

        RuleFor(x => x.ShopId)
            .GreaterThan(0)
            .When(x => x.ShopId.HasValue)
            .WithMessage("Mã gian hàng (ShopId) phải lớn hơn 0.");
    }
}
