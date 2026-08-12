using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.UpdateVoucher;

public record UpdateVoucherCommand(
    bool IsAdmin,
    long UserId,
    Guid VoucherId,
    UpdateVoucherRequest Request
) : ICommand<VoucherDto>;
