using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerRejectSubOrder;

public record SellerRejectSubOrderCommand(long SubOrderId, long SellerId, string Reason) : ICommand;
