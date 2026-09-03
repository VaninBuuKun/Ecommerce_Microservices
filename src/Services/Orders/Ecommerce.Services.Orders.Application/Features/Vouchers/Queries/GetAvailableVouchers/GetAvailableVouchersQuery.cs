using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAvailableVouchers;

public record GetAvailableVouchersQuery(long CustomerId, long? ShopId = null) : IQuery<List<VoucherDto>>;