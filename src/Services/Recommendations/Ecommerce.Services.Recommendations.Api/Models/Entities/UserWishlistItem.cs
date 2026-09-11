using System;

namespace Ecommerce.Services.Recommendations.Api.Models.Entities;

public class UserWishlistItem
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long ProductId { get; set; }
    public long? CategoryId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime ToggledAt { get; set; } = DateTime.UtcNow;
}
