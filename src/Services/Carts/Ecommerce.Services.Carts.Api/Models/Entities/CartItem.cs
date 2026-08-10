using BuildingBlocks.Shared.Domains.Interfaces;

namespace Ecommerce.Services.Carts.Api.Models.Entities;

public class CartItem
{
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId  {get; set;}
    public int Quantity {get; set;}
    public bool IsSelected {get; set;}
}