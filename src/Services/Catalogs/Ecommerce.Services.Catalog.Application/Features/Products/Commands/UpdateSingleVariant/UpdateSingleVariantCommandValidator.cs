using FluentValidation;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateSingleVariant;

public class UpdateSingleVariantCommandValidator : AbstractValidator<UpdateSingleVariantCommand>
{
    public UpdateSingleVariantCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Mã sản phẩm không hợp lệ.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Giá sản phẩm phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.AvailableStock)
            .GreaterThanOrEqualTo(0).WithMessage("Số lượng tồn kho không được âm.");

        RuleFor(x => x.Weight)
            .GreaterThanOrEqualTo(0).WithMessage("Khối lượng sản phẩm không được âm.");

        RuleFor(x => x.Length)
            .GreaterThanOrEqualTo(0).WithMessage("Chiều dài sản phẩm không được âm.");

        RuleFor(x => x.Width)
            .GreaterThanOrEqualTo(0).WithMessage("Chiều rộng sản phẩm không được âm.");

        RuleFor(x => x.Height)
            .GreaterThanOrEqualTo(0).WithMessage("Chiều cao sản phẩm không được âm.");

        RuleFor(x => x.DiscountPrice)
            .GreaterThanOrEqualTo(0).When(x => x.DiscountPrice.HasValue).WithMessage("Giá giảm phải lớn hơn hoặc bằng 0.")
            .LessThanOrEqualTo(x => x.Price).When(x => x.DiscountPrice.HasValue).WithMessage("Giá giảm không được lớn hơn giá gốc.");
    }
}
