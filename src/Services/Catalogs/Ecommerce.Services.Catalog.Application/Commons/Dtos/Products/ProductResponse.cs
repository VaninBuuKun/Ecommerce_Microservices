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
    
    public decimal Price { get; set; }
    public decimal PriceDisplay { get; set; }
    public decimal DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; }
    public string? VideoUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? ParentCategoryName { get; set; }
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public string ShopPhone { get; set; } = string.Empty;
    public string ShopAddress { get; set; } = string.Empty;
    public string ShopRecipient { get; set; } = string.Empty;
    public long ShopOwnerId { get; set; }
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
    public decimal? DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public int ReservedStocks { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public List<ProductVariantOptionDto> VariantOptions { get; set; } = new();
}

public class ProductVariantOptionDto
{
    public Guid OptionValueId {get; set;}
}