using FluentValidation;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.RegisterKyc;

public class RegisterKycCommandValidator : AbstractValidator<RegisterKycCommand>
{
    public RegisterKycCommandValidator()
    {
        RuleFor(x => x.IdentityCardNumber)
            .NotEmpty().WithMessage("Số CMND/CCCD không được để trống.")
            .Matches(@"^\d+$").WithMessage("Số CMND/CCCD phải bao gồm tất cả là các chữ số.");

        RuleFor(x => x.IdentityCardFrontUrl)
            .NotEmpty().WithMessage("Ảnh chụp mặt trước CCCD không được để trống.");

        RuleFor(x => x.IdentityCardBackUrl)
            .NotEmpty().WithMessage("Ảnh chụp mặt sau CCCD không được để trống.");
    }
}
