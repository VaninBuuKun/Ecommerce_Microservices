using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Analytics.Api.Models.Entities;

public class DailyCategoryRevenue : EntityBase<long>
{
    public DateOnly Date { get; set; }
    public long ParentCategoryId { get; set; }
    public long Revenue { get; set; }
    public int SoldQuantity { get; set; }
    public DateTimeOffset UpdatedDate { get; set; } = DateTimeOffset.UtcNow;
}
