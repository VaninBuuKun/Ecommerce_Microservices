using FluentValidation;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateMultiVariants;

public class UpdateMultiVariantsCommandValidator : AbstractValidator<UpdateMultiVariantsCommand>
{
    public UpdateMultiVariantsCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0).WithMessage("Mã sản phẩm không hợp lệ.");

        RuleFor(x => x.Options)
            .NotEmpty().WithMessage("Danh sách phân loại sản phẩm không được rỗng.");

        RuleForEach(x => x.Options).ChildRules(option =>
        {
            option.RuleFor(o => o.Name)
                .NotEmpty().WithMessage("Tên nhóm phân loại không được để trống.")
                .MaximumLength(100).WithMessage("Tên nhóm phân loại tối đa 100 ký tự.");

            option.RuleFor(o => o.Values)
                .NotEmpty().WithMessage("Nhóm phân loại phải có ít nhất một giá trị.");

            option.RuleForEach(o => o.Values).ChildRules(val =>
            {
                val.RuleFor(v => v.Value)
                    .NotEmpty().WithMessage("Giá trị phân loại không được để trống.")
                    .MaximumLength(100).WithMessage("Giá trị phân loại tối đa 100 ký tự.");
            });
        });

        RuleFor(x => x.Variants)
            .NotEmpty().WithMessage("Danh sách biến thể không được rỗng.")
            .Must(v => v.Count <= 60).WithMessage("Một sản phẩm chỉ hỗ trợ tối đa 60 biến thể.");

        RuleForEach(x => x.Variants).ChildRules(variant =>
        {
            variant.RuleFor(v => v.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Giá biến thể phải lớn hơn hoặc bằng 0.");

            variant.RuleFor(v => v.AvailableStock)
                .GreaterThanOrEqualTo(0).WithMessage("Số lượng tồn kho biến thể không được âm.");

            variant.RuleFor(v => v.DiscountPrice)
                .GreaterThanOrEqualTo(0).When(v => v.DiscountPrice.HasValue).WithMessage("Giá giảm phải lớn hơn hoặc bằng 0.")
                .LessThanOrEqualTo(v => v.Price).When(v => v.DiscountPrice.HasValue).WithMessage("Giá giảm không được lớn hơn giá gốc.");

            variant.RuleFor(v => v.OptionValues)
                .NotEmpty().WithMessage("Mỗi biến thể phải liên kết với ít nhất một giá trị phân loại.");
        });
    }
}
