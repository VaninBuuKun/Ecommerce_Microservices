using System;
using BuildingBlocks.Shared.Domains;

namespace Ecommerce.Services.Orders.Domain;

//Lưu trữ lại danh sách các địa điểm mà customer đã dùng để đặt đơn hàng.
public class ShippingAddress : EntityTrackingBase<Guid>
{
    public long CustomerId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
