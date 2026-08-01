using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.RejectRefund;

public record RejectRefundCommand(
    Guid RefundRequestId,
    long SellerId,
    string SellerNote) : ICommand;
