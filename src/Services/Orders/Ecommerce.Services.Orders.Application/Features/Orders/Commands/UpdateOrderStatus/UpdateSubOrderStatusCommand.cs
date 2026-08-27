using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.UpdateOrderStatus;

public record UpdateSubOrderStatusCommand(long SubOrderId, SubOrderStatus Status, string? PaymentUrl = null): ICommand;