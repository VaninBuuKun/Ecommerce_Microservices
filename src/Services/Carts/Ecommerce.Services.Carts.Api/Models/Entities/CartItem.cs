using System.Text.Json.Serialization;
using BuildingBlocks.Shared.Converters;

namespace Ecommerce.Services.Carts.Api.Models.Entities;

public class CartItem
{
    [JsonConverter(typeof(LongToStringJsonConverter))]
    public long VariantId { get; set; }

    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
}
