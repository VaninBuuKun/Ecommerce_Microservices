using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Carts.Api.Models.Dtos;

public class CartItemRequest
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public int Quantity { get; set; }
    public bool IsSelected { get; set; } = true;
}

public class UpdateCartItemQuantityRequest
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public int Quantity { get; set; }
}

public class UpdateCartItemSelectRequest
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public bool IsSelected { get; set; }
}

public class RemoveCartItemRequest
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }
}
