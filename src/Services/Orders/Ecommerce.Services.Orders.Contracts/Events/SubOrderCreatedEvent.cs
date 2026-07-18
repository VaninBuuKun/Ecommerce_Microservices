using BuildingBlocks.Messaging.Abstractions;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using Ecommerce.Services.Carts.Contracts.Dtos;

namespace Ecommerce.Services.Orders.Contracts.Events;

public record SubOrderCreatedEvent : IIntegrationEvent
{
    public Guid SubOrderId { get; set; }
    public Guid OrderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public long CustomerId { get; set; }
    public long ShopId { get; set; }
    public decimal TotalAmount { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string PaymentProvider { get; set; }
    public List<OrderItemData> OrderItems { get; set; } = new List<OrderItemData>();
}
