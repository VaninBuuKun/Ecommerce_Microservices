using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Mapster;

namespace Ecommerce.Services.Catalog.Application.Commons.Mappings;

public class ProductMappings : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<ProductVariant, VariantDto>()
            .Map(dest => dest.VariantName, src => src.GetVariantName())
            .Map(dest => dest.ProductName, src => src.Product.Name)
            .Map(dest => dest.ShopId, src => src.Product.ShopId)
            .Map(dest => dest.Weight, src => src.Weight.HasValue && src.Weight.Value > 0 ? src.Weight.Value : src.Product.Weight)
            .Map(dest => dest.Length, src => src.Length.HasValue && src.Length.Value > 0 ? src.Length.Value : src.Product.Length)
            .Map(dest => dest.Width, src => src.Width.HasValue && src.Width.Value > 0 ? src.Width.Value : src.Product.Width)
            .Map(dest => dest.Height, src => src.Height.HasValue && src.Height.Value > 0 ? src.Height.Value : src.Product.Height);
    }
}