using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Catalog.Domain.Products;

public class Wishlist : EntityTrackingBase<Guid>
{
    public long CustomerId { get; set; }
    public Guid ProductId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public Product Product { get; set; } = null!;

    public Wishlist()
    {
        Id = Guid.NewGuid();
    }

    public Wishlist(long customerId, Guid productId)
    {
        Id = Guid.NewGuid();
        CustomerId = customerId;
        ProductId = productId;
        CreatedAt = DateTime.UtcNow;
    }
}
