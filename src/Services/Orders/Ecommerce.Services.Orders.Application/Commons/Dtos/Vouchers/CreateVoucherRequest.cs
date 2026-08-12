using System.ComponentModel.DataAnnotations;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

public class CreateVoucherRequest
{
    [Required]
    [Range(6, 50, ErrorMessage = "Code must be between 6 and 50 characters.")]
    public string Code { get; set; } = string.Empty;
    [Required]
    [Range(1, 100, ErrorMessage = "Amount must be between 1 and 100 characters.")]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public DiscountType DiscountType { get; set; }
    
    [Required]
    public decimal DiscountValue { get; set; }
    
    [Range(0, 1000000000000)]
    public decimal MinOrderValue { get; set; }
    
    [Range(1, 1000000)]
    public long MaxUsageCount { get; set; }
    
    public long MaxUsagePerUser { get; set; } = 1;
    public long? ShopId { get; set; }

    public DateTimeOffset StartDate { get; set; }

    public DateTimeOffset EndDate { get; set; }

    public long? UserId { get; set; }
}