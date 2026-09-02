using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Dtos;

public class VariantDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long ProductId { get; set; }

    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long Id { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public int AvailableStock { get; set; }
    public decimal Price { get; set; }
    public decimal DiscountPrice { get; set; }
    public string VariantName { get; set; } = string.Empty;
    public long ShopId { get; set; }
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
}