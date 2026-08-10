using System;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.CancelRefund;

public record CancelRefundCommand(Guid RefundRequestId, long CustomerId) : ICommand;
