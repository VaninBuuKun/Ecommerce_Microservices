using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Commands.CreateVoucher;

public record CreateVoucherCommand(bool IsAdmin, long UserId, CreateVoucherRequest voucherRequest ) : ICommand<VoucherDto>;