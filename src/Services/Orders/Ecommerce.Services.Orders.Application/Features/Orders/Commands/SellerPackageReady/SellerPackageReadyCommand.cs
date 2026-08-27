using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using System;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerPackageReady;

public record SellerPackageReadyCommand(
    long SubOrderId,
    long SellerId,
    double Weight,
    double Length,
    double Width,
    double Height) : ICommand;
