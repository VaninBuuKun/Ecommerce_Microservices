using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerRejectSubOrder;

public record SellerRejectSubOrderCommand(Guid SubOrderId, long SellerId, string Reason) : ICommand;
