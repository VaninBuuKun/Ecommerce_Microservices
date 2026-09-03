using System.Collections.Generic;
using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartResponse
{
    public long CustomerId { get; set; }
    public List<ShopCartGroupResponse> ShopGroups { get; set; } = [];
}

public class ShopCartGroupResponse
{
    public long ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public List<CartItemResponse> Items { get; set; } = [];
}

public class CartItemResponse
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long ProductId { get; set; }

    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPrice { get; set; }
    public int AvailableStock { get; set; }
    public long ShopId { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public double Weight { get; set; }
    public double Length { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}
