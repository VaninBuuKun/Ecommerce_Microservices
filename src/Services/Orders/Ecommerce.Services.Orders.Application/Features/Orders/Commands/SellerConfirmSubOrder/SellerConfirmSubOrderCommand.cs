using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerConfirmSubOrder;

public record SellerConfirmSubOrderCommand(Guid SubOrderId, long SellerId) : ICommand;
