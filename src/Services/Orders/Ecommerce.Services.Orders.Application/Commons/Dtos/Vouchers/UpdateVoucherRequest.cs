using System.ComponentModel.DataAnnotations;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

/// <summary>
/// Request cập nhật voucher. Tất cả field đều nullable — chỉ field được truyền lên mới được patch.
/// IsActive = false → deactive; IsActive = true → active.
/// </summary>
public class UpdateVoucherRequest
{
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 100 characters.")]
    public string? Name { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "DiscountValue must be greater than 0.")]
    public decimal? DiscountValue { get; set; }
    
    public DiscountType DiscountType { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MinOrderValue { get; set; }

    [Range(1, 1_000_000)]
    public long? MaxUsageCount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }

    [Range(1, 1_000_000)]
    public long? MaxUsagePerUser { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    /// <summary>null = không thay đổi; true = active; false = deactive</summary>
    public bool? IsActive { get; set; }
}
