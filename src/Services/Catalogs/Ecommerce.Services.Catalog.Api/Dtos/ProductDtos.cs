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
    string? AttributesJson
);

public record UpdateSingleVariantRequest(
    decimal Price,
    int AvailableStock,
    double Weight,
    double Length,
    double Width,
    double Height,
    decimal? DiscountPrice
);

public record UpdateMultiVariantsRequest(
    List<MultiUpdateOptionDto> Options,
    List<MultiUpdateVariantDto> Variants
);
