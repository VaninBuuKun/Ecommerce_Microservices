using System;
using System.Collections.Generic;
using Ecommerce.Services.Catalog.Domain;

namespace Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

public class ProductResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int RatingSum { get; set; }
    
    public decimal PriceDisplay { get; set; }
    public string MainImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? VideoUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public List<ProductOptionDto> Options { get; set; } = new();
    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class ProductOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public List<ProductOptionValueDto> Values { get; set; } = new();
}

public class ProductOptionValueDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
}

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public string? Sku { get; set; }
    public decimal Price { get; set; }
    public int AvailableStocks { get; set; }
    public int ReservedStocks { get; set; }
    public List<ProductVariantOptionDto> Options { get; set; } = new();
}

public class ProductVariantOptionDto
{
    public Guid OptionValueId {get; set;}
}