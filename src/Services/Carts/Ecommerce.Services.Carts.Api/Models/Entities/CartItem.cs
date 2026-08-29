using System;
using BuildingBlocks.Shared.Domains.Interfaces;

namespace Ecommerce.Services.Carts.Api.Models.Entities;

public class CartItem
{
    public long ProductId { get; set; }
    public long? ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public bool IsSelected { get; set; }
}
