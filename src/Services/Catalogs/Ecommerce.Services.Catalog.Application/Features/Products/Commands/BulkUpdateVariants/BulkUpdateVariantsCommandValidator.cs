using FluentValidation;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.BulkUpdateVariants;

public class BulkUpdateVariantsCommandValidator : AbstractValidator<BulkUpdateVariantsCommand>
{
    public BulkUpdateVariantsCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("ProductId không được để trống.");

        // 1. Giới hạn tối đa 2 nhóm phân loại (0, 1 hoặc 2)
        RuleFor(x => x.Options)
            .Must(options => options == null || options.Count <= 2)
            .WithMessage("Sản phẩm chỉ hỗ trợ tối đa 2 nhóm phân loại (ví dụ: Màu sắc, Kích thước).");

        // 2. Validate chi tiết từng Option
        RuleForEach(x => x.Options).ChildRules(option =>
        {
            option.RuleFor(o => o.Name)
                .NotEmpty().WithMessage("Tên nhóm phân loại không được để trống.");

            option.RuleFor(o => o.Values)
                .NotEmpty().WithMessage("Nhóm phân loại phải có ít nhất 1 giá trị.");

            option.RuleForEach(o => o.Values).ChildRules(val =>
            {
                val.RuleFor(v => v.Value)
                    .NotEmpty().WithMessage("Tên giá trị phân loại không được để trống.");
            });
        });

        // 3. Validate danh sách Variants
        RuleForEach(x => x.Variants).ChildRules(variant =>
        {
            variant.RuleFor(v => v.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Giá sản phẩm không được nhỏ hơn 0.");

            variant.RuleFor(v => v.AvailableStock)
                .GreaterThanOrEqualTo(0).WithMessage("Số lượng tồn kho không được âm.");

            variant.RuleFor(v => v.OptionValues)
                .NotEmpty().When(x => x.OptionValues.Any())
                .WithMessage("Biến thể phải chứa thông tin các giá trị phân loại tương ứng.");
        });
    }
}