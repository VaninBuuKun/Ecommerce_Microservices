using FluentValidation;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.UpdateShop;

public class UpdateShopCommandValidator : AbstractValidator<UpdateShopCommand>
{
    public UpdateShopCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên cửa hàng không được để trống.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches(@"^(03|05|07|08|09)+([0-9]{8})$|^(01[2|6|8|9])+([0-9]{8})$|^0\d{9}$")
            .WithMessage("Số điện thoại không hợp lệ tại Việt Nam (ví dụ: 0912345678, 10 chữ số bắt đầu bằng số 0).");
    }
}
