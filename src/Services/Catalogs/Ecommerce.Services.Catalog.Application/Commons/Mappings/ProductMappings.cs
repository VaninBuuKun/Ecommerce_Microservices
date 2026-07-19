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
            .Map(dest => dest.ShopId, src => src.Product.ShopId);
    }
}