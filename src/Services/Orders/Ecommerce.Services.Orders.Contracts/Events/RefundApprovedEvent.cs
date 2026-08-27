using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Events;

public class RefundApprovedEvent : IIntegrationEvent
{
    public long SubOrderId { get; set; }
    public long RefundRequestId { get; set; }
    public long CustomerId { get; set; }
    public decimal RefundAmount { get; set; } //Danh cho seller
    public decimal CustomerRefundAmount { get; set; } //Danh cho customer
    public long ShopOwnerUserId { get; set; }
}
