using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
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
            .Map(dest => dest.Weight, src => src.Product.Weight)
            .Map(dest => dest.Length, src => src.Product.Length)
            .Map(dest => dest.Width, src => src.Product.Width)
            .Map(dest => dest.Height, src => src.Product.Height)
            .Map(dest => dest.DiscountPrice, src => src.DiscountPrice)
            .Map(dest => dest.AvailableStock, src => src.AvailableStock)
            .Map(dest => dest.ThumbnailUrl, src => src.GetThumbnailUrl());

        config.NewConfig<Product, VariantDto>()
            .Map(dest => dest.Id, src => 0)
            .Map(dest => dest.ProductId, src => src.Id)
            .Map(dest => dest.ProductName, src => src.Name)
            .Map(dest => dest.AvailableStock, src => src.Variants.Where(v => !v.IsDeleted).Sum(v => v.AvailableStock))
            .Map(dest => dest.Price, src => src.Price)
            .Map(dest => dest.DiscountPrice, src => src.DiscountPrice)
            .Map(dest => dest.VariantName, src => "")
            .Map(dest => dest.ShopId, src => src.ShopId)
            .Map(dest => dest.Weight, src => src.Weight)
            .Map(dest => dest.Length, src => src.Length)
            .Map(dest => dest.Width, src => src.Width)
            .Map(dest => dest.Height, src => src.Height)
            .Map(dest => dest.ThumbnailUrl, src => src.ThumbnailUrl ?? "");

        config.NewConfig<ProductVariant, ProductVariantDto>()
            .Map(dest => dest.AvailableStock, src => src.AvailableStock)
            .Map(dest => dest.ReservedStock, src => src.ReservedStock)
            .Map(dest => dest.VariantName, src => src.GetVariantName());

        config.NewConfig<Product, ProductResponse>()
            .Map(dest => dest.Price, src => src.Price)
            .Map(dest => dest.PriceDisplay, src => src.Price)
            .Map(dest => dest.DiscountPrice, src => src.DiscountPrice)
            .Map(dest => dest.MinPrice, src => src.Variants.Any(v => !v.IsDeleted) ? src.Variants.Where(v => !v.IsDeleted).Min(v => v.Price) : src.Price)
            .Map(dest => dest.MaxPrice, src => src.Variants.Any(v => !v.IsDeleted) ? src.Variants.Where(v => !v.IsDeleted).Max(v => v.Price) : src.Price)
            .Map(dest => dest.MinDiscountPrice, src => src.Variants.Any(v => !v.IsDeleted) ? src.Variants.Where(v => !v.IsDeleted).Min(v => v.DiscountPrice > 0 ? v.DiscountPrice : v.Price) : src.DiscountPrice)
            .Map(dest => dest.MaxDiscountPrice, src => src.Variants.Any(v => !v.IsDeleted) ? src.Variants.Where(v => !v.IsDeleted).Max(v => v.DiscountPrice > 0 ? v.DiscountPrice : v.Price) : src.DiscountPrice)
            .Map(dest => dest.AvailableStock, src => src.Variants.Where(v => !v.IsDeleted).Sum(v => v.AvailableStock))
            .Map(dest => dest.CategoryName, src => src.Category != null ? src.Category.Name : null)
            .Map(dest => dest.ParentCategoryId, src => src.Category != null ? src.Category.ParentId : null)
            .Map(dest => dest.ParentCategoryName, src => src.Category != null && src.Category.Parent != null ? src.Category.Parent.Name : null)
            .Map(dest => dest.Options, src => src.Options
                .Where(o => !o.IsDeleted)
                .OrderBy(o => o.SortOrder)
                .Select(o => new ProductOptionDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    SortOrder = o.SortOrder,
                    Values = o.Values
                        .Where(v => !v.IsDeleted)
                        .OrderBy(v => v.SortOrder)
                        .Select(v => new ProductOptionValueDto
                        {
                            Id = v.Id,
                            Value = v.Value,
                            ImageUrl = v.ImageUrl,
                            SortOrder = v.SortOrder
                        }).ToList()
                }).ToList())
            .Map(dest => dest.Variants, src => src.Variants
                .Where(v => !v.IsDeleted)
                .OrderBy(v => v.VariantOptions
                    .OrderBy(vo => vo.OptionValue.Option.SortOrder)
                    .Select(vo => vo.OptionValue.SortOrder)
                    .FirstOrDefault())
                .ThenBy(v => v.VariantOptions
                    .OrderBy(vo => vo.OptionValue.Option.SortOrder)
                    .Skip(1)
                    .Select(vo => vo.OptionValue.SortOrder)
                    .FirstOrDefault())
            );
    }
}