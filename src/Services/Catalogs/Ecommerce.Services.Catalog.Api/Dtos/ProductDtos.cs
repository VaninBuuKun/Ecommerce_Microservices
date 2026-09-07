using System.Collections.Generic;
using Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateMultiVariants;

namespace Ecommerce.Services.Catalog.Api.Dtos;

public record AddReviewRequest(int Rating, string Comment, List<string>? ImageUrls);

public record ProductRequest(long ShopId, string Name, string Description, string? ThumbnailUrl);

public record UpdateProductRequest(
    string Name,
    string Description,
    string? ThumbnailUrl,
    string? VideoUrl,
    List<string> ImageUrls,
    long? CategoryId,
    string? AttributesJson,
    int Weight = 0,
    int Length = 0,
    int Width = 0,
    int Height = 0
);

public record UpdateSingleVariantRequest(
    decimal Price,
    int AvailableStock,
    int Weight,
    int Length,
    int Width,
    int Height,
    decimal? DiscountPrice
);

public record UpdateMultiVariantsRequest(
    List<MultiUpdateOptionDto> Options,
    List<MultiUpdateVariantDto> Variants,
    int? Weight = null,
    int? Length = null,
    int? Width = null,
    int? Height = null
);
