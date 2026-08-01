using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

public class RefundRequestDto
{
    public Guid Id { get; set; }
    public Guid SubOrderId { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? SellerNote { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
}
