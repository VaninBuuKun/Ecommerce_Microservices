using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAdminVouchers;

public record GetAdminVouchersQuery(
    int Page = 1,
    int PageSize = 10,
    string? Code = null,
    DiscountType? DiscountType = null,
    VoucherScope? Scope = null,
    bool? IsActive = null,
    long? ShopId = null,
    bool? UsageLimit = null,
    DateTimeOffset? StartDate = null,
    DateTimeOffset? EndDate = null
) : IQuery<PagedResult<VoucherDto>>;
