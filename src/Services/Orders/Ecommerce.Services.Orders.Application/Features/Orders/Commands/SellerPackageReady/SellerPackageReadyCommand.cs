using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerPackageReady;

public record SellerPackageReadyCommand(
    long SubOrderId,
    long SellerId,
    int Weight,
    int Length,
    int Width,
    int Height) : ICommand;
