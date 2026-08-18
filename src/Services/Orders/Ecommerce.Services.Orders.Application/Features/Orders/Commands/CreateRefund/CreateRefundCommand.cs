using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CreateRefund;

public record CreateRefundCommand(
    Guid SubOrderId,
    long CustomerId,
    string Reason,
    List<string>? Medias = null) : ICommand<RefundRequestDto>;
