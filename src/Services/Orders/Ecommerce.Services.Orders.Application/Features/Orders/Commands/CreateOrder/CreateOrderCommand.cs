using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand(
    long CustomerId,
    string PaymentProvider,
    string CheckoutSessionKey,
    long AddressId,
    string? IdempotencyKey = null) : ICommand<CustomerOrderResponse>;
