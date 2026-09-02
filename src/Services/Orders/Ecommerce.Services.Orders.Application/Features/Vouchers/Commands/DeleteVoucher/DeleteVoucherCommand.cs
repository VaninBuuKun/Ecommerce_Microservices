using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.DeleteVoucher;

public record DeleteVoucherCommand(bool IsAdmin, long UserId, long VoucherId) : ICommand<bool>;
