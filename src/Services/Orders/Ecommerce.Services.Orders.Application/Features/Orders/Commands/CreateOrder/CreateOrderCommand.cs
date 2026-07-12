using System;
using System.Collections.Generic;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Commands.CreateOrder;

public record CreateOrderCommand(
    long CustomerId,
    List<Guid> SelectedVariantIds,
    long PaymentMethodId,
    string ShippingAddress
) : ICommand<CustomerOrderResponse>;
