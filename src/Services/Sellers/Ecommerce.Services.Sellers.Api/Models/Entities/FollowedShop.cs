using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Sellers.Api.Models.Entities;

public class FollowedShop : EntityTrackingBase<Guid>
{
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public FollowedShop()
    {
        Id = Guid.NewGuid();
    }

    public FollowedShop(long customerId, long shopId)
    {
        Id = Guid.NewGuid();
        CustomerId = customerId;
        ShopId = shopId;
        CreatedAt = DateTime.UtcNow;
    }
}
