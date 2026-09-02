using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetShopVouchers;

public record GetShopVouchersQuery(
    long ShopId,
    int Page = 1,
    int PageSize = 10,
    string? Code = null,
    DiscountType? DiscountType = null,
    bool? IsActive = null
) : IQuery<PagedResult<VoucherDto>>;
