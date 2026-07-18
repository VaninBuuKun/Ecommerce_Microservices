
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ConfirmPayment;

public record ConfirmPaymentCommand(Guid OrderId) : ICommand;
