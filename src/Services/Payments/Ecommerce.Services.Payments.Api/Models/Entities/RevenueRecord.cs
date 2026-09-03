using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class RevenueRecord : EntityTrackingBase<long>
{
    public long SubOrderId { get; set; }
    public long ShopId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal PlatformDiscountAmount { get; set; }
    public decimal CommissionRatePercentage { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }
}
