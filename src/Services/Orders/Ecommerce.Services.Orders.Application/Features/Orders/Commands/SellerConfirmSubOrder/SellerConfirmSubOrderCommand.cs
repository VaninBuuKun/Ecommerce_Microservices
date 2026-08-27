using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerConfirmSubOrder;

public record SellerConfirmSubOrderCommand(long SubOrderId, long SellerId) : ICommand;
