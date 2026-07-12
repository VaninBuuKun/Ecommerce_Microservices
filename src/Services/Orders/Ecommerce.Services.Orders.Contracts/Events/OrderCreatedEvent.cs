using BuildingBlocks.Messaging.Abstractions;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using Ecommerce.Services.Carts.Contracts.Dtos;

namespace Ecommerce.Services.Orders.Contracts.Events;

public record OrderCreatedEvent : IIntegrationEvent
{
    public Guid OrderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public long CustomerId { get; set; }
    public long TotalAmount { get; set; }
    public long PaymentMethodId { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public List<OrderItemData> OrderItems { get; set; } = new List<OrderItemData>();
}
