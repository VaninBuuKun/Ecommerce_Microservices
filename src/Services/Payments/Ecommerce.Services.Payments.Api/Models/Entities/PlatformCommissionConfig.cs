using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Payments.Api.Models.Entities;

public class PlatformCommissionConfig : EntityTrackingBase<long>
{
    public decimal RatePercentage { get; set; } = 5.0m; // Default 5%
    public long? UpdatedByUserId { get; set; }
}
