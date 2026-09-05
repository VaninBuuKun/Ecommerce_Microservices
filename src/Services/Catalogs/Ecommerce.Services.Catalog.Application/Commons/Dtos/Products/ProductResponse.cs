using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;
using Ecommerce.Services.Catalog.Domain;

namespace Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

public class ProductResponse
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int RatingSum { get; set; }
    
    public decimal Price { get; set; }
    public decimal PriceDisplay { get; set; }
    public decimal DiscountPrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public decimal MinDiscountPrice { get; set; }
    public decimal MaxDiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public int Sold { get; set; }
    public string? AttributesJson { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public long? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public long? ParentCategoryId { get; set; }
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
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public List<ProductOptionValueDto> Values { get; set; } = new();
}

public class ProductOptionValueDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string Value { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
}

public class ProductVariantDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string? Sku { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public int ReservedStock { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public List<ProductVariantOptionDto> VariantOptions { get; set; } = new();
}

public class ProductVariantOptionDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long OptionValueId { get; set; }
}