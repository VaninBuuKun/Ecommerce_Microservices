using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;

namespace Ecommerce.Services.Orders.Contracts.Requests;

public record CancelWaybillRequest : IIntegrationEvent
{
    public long SubOrderId { get; init; }
}
