using System;

namespace Ecommerce.Services.Recommendations.Api.Models.Entities;

public class ProductView
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public string? SessionId { get; set; }
    public long ProductId { get; set; }
    public long? CategoryId { get; set; }
    public long ShopId { get; set; }
    public int? DurationSeconds { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
