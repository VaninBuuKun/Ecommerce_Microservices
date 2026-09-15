using System;

namespace Ecommerce.Services.Recommendations.Api.Models.Entities;

public class UserPurchaseHistory
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long ProductId { get; set; }
    public long? CategoryId { get; set; }
    public long ShopId { get; set; }
    public int Quantity { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
}
