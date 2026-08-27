using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.RejectRefund;

public record RejectRefundCommand(
    long RefundRequestId,
    long SellerId,
    string SellerNote) : ICommand;
