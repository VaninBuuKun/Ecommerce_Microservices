using System.ComponentModel.DataAnnotations;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

public class CreateVoucherRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    [Required]
    public DiscountType DiscountType { get; set; }
    [Required]
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    [Range(0, 1000000000000)]
    public decimal MinOrderValue { get; set; }
    [Range(1, 1000000)]
    public long MaxUsageCount { get; set; }
    public long? ShopId { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
}