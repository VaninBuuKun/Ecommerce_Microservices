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

namespace Ecommerce.Services.Orders.Application.Features.Vouchers.Queries.GetAdminVouchers;

public class GetAdminVouchersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetAdminVouchersQueryHandler> logger,
    IMapper mapper
) : QueryHandler<GetAdminVouchersQuery, PagedResult<VoucherDto>>
{
    private IGenericEfRepository<Voucher, long> VoucherRepo => unitOfWork.Repository<Voucher, long>();

    protected override async Task<Result<PagedResult<VoucherDto>>> HandleQueryAsync(
        GetAdminVouchersQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            var pageNumber = query.Page;
            var pageSize = query.PageSize;

            Expression<Func<Voucher, bool>> predicate = v =>
                (string.IsNullOrEmpty(query.Code) || v.Code.ToUpper().Contains(query.Code.ToUpper()) || v.Name.ToUpper().Contains(query.Code.ToUpper())) &&
                (!query.DiscountType.HasValue || v.DiscountType == query.DiscountType.Value) &&
                (!query.Scope.HasValue || v.Scope == query.Scope.Value) &&
                (!query.IsActive.HasValue || v.IsActive == query.IsActive.Value) &&
                (!query.ShopId.HasValue || v.ShopId == query.ShopId.Value) &&
                (!query.UsageLimit.HasValue || (query.UsageLimit.Value ? v.MaxUsageCount > 0 : v.MaxUsageCount == 0)) &&
                (!query.StartDate.HasValue || v.StartDate >= query.StartDate.Value) &&
                (!query.EndDate.HasValue || v.EndDate <= query.EndDate.Value);

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
            logger.LogError(ex, "Error retrieving admin vouchers");
            return Result<PagedResult<VoucherDto>>.Failure($"Lỗi khi lấy danh sách voucher admin: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
