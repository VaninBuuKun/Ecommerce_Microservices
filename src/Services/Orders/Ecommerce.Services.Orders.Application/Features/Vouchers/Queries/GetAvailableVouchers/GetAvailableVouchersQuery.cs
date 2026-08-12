using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;

public record GetAvailableVouchersQuery() : IQuery<List<VoucherDto>>;