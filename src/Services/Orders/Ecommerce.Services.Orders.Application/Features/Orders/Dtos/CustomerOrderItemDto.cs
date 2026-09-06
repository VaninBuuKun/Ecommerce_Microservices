using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class CustomerOrderItemDto
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long OrderId { get; set; }

    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public double WeightInGrams { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}