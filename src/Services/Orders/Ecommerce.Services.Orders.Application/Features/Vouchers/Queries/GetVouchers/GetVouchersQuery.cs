using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain.Enums;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetPlatformVoucher;

public record GetVouchersQuery(int Page, int PageSize, string? Code, DiscountType? DiscountType, 
    bool? UsageLimit, DateTimeOffset? StartDate, DateTimeOffset? EndDate, 
    bool? IsActive, long? ShopId) : 
    IQuery<List<VoucherDto>>;