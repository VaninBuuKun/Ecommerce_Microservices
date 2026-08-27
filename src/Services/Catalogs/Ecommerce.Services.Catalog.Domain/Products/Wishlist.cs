using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class Wishlist : EntityTrackingBase<long>
{
    public long CustomerId { get; set; }
    public long ProductId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;

    public Wishlist()
    {
    }

    public Wishlist(long customerId, long productId)
    {
        CustomerId = customerId;
        ProductId = productId;
        CreatedAt = DateTime.UtcNow;
    }
}
