using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Analytics.Api.Models.Entities;

public class DailyShopRevenue : EntityBase<long>
{
    public long ShopId { get; set; }
    public DateOnly Date { get; set; }
    public long Revenue { get; set; }
    public int OrderCount { get; set; }
    public int CompletedOrderCount { get; set; }
    public int CancelledOrderCount { get; set; }
    public int RefundedOrderCount { get; set; }
    public long RefundAmount { get; set; }
    public DateTimeOffset UpdatedDate { get; set; } = DateTimeOffset.UtcNow;
}
