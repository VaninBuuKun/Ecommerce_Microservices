using System.Collections.Generic;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;

public class MyProductDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public string Status { get; set; } = string.Empty;

    public List<MyVariantDto> Variants { get; set; } = new();
}

public class MyVariantDto
{
    [JsonConverter(typeof(NullableLongToStringJsonConverter))]
    public long? Id { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int AvailableStock { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}