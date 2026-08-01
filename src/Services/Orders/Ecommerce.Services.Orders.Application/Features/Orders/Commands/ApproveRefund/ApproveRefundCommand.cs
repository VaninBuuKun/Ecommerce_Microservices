using System;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ApproveRefund;

public record ApproveRefundCommand(
    Guid RefundRequestId,
    long SellerId,
    string? SellerNote) : ICommand;
