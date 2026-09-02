using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Vouchers;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetShopVouchers;

public class GetShopVouchersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetShopVouchersQueryHandler> logger,
    IMapper mapper
) : QueryHandler<GetShopVouchersQuery, PagedResult<VoucherDto>>
{
    private IGenericEfRepository<Voucher, long> VoucherRepo => unitOfWork.Repository<Voucher, long>();

    protected override async Task<Result<PagedResult<VoucherDto>>> HandleQueryAsync(
        GetShopVouchersQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            var pageNumber = query.Page;
            var pageSize = query.PageSize;

            Expression<Func<Voucher, bool>> predicate = v =>
                v.Scope == VoucherScope.Shop &&
                v.ShopId == query.ShopId &&
                (string.IsNullOrEmpty(query.Code) || v.Code.ToUpper().Contains(query.Code.ToUpper()) || v.Name.ToUpper().Contains(query.Code.ToUpper())) &&
                (!query.DiscountType.HasValue || v.DiscountType == query.DiscountType.Value) &&
                (!query.IsActive.HasValue || v.IsActive == query.IsActive.Value);

            var totalCount = await VoucherRepo.CountAsync(predicate, cancellationToken);

            var vouchers = await VoucherRepo.GetPageAsync(
                pageNumber: pageNumber,
                pageSize: pageSize,
                predicate: predicate,
                orderBy: q => q.OrderByDescending(v => v.CreatedDate),
                cancellationToken: cancellationToken
            );

            var voucherDtos = mapper.Map<List<VoucherDto>>(vouchers);
            var response = new PagedResult<VoucherDto>(voucherDtos, totalCount, pageNumber, pageSize);

            return Result<PagedResult<VoucherDto>>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error retrieving shop vouchers for Shop {ShopId}", query.ShopId);
            return Result<PagedResult<VoucherDto>>.Failure($"Lỗi khi lấy danh sách voucher của shop: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
