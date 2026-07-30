using System;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public class CreateShipmentRequest
{
    public Guid SubOrderId { get; set; }
    public Guid OrderId { get; set; }
    public string SenderAddress { get; set; } = string.Empty;
    public long RecipientWardId { get; set; }
    public string RecipientAddress { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public long ShopId { get; set; }
    public double Weight { get; set; }
    public double Height { get; set; }
    public double Width { get; set; }
    public double Length { get; set; }
    public decimal CodAmount { get; set; }
}
