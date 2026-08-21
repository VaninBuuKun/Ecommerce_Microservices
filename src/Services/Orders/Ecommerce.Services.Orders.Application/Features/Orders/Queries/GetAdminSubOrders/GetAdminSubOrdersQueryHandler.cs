using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MapsterMapper;
using Microsoft.Extensions.Logging;

using BuildingBlocks.Application.Commons.Models;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetAdminSubOrders;

public class GetAdminSubOrdersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetAdminSubOrdersQueryHandler> logger,
    IMapper mapper)
    : QueryHandler<GetAdminSubOrdersQuery, PagedResult<CustomerOrderResponse>>
{
    protected override async Task<Result<PagedResult<CustomerOrderResponse>>> HandleQueryAsync(
        GetAdminSubOrdersQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Admin fetching sub-orders (Page {PageNumber}, Size {PageSize}, Status {Status}, Search {Search})",
            query.PageNumber, query.PageSize, query.Status, query.SearchKeyword);

        var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();

        SubOrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<SubOrderStatus>(query.Status, true, out var parsedStatus))
        {
            statusEnum = parsedStatus;
        }

        Expression<Func<SubOrder, bool>> predicate = o => true;

        if (statusEnum.HasValue)
        {
            predicate = o => o.Status == statusEnum.Value;
        }

        if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
        {
            var keyword = query.SearchKeyword.Trim().ToLower();
            if (Guid.TryParse(keyword, out var searchedGuid))
            {
                predicate = statusEnum.HasValue
                    ? o => o.Status == statusEnum.Value && (o.Id == searchedGuid || o.OrderId == searchedGuid)
                    : o => o.Id == searchedGuid || o.OrderId == searchedGuid;
            }
            else if (long.TryParse(keyword, out var searchedId))
            {
                predicate = statusEnum.HasValue
                    ? o => o.Status == statusEnum.Value && (o.ShopId == searchedId || o.CustomerId == searchedId)
                    : o => o.ShopId == searchedId || o.CustomerId == searchedId;
            }
        }

        var totalCount = await subOrderRepo.CountAsync(predicate, cancellationToken);

        var subOrders = await subOrderRepo.GetPageAsync(
            pageNumber: query.PageNumber,
            pageSize: query.PageSize,
            predicate: predicate,
            orderBy: q => q.OrderByDescending(o => o.CreatedDate),
            cancellationToken: cancellationToken,
            includes: new Expression<Func<SubOrder, object>>[] { o => o.Order }
        );

        var items = mapper.Map<List<CustomerOrderResponse>>(subOrders);
        var response = new PagedResult<CustomerOrderResponse>(items, totalCount, query.PageNumber, query.PageSize);

        return Result<PagedResult<CustomerOrderResponse>>.Success(response);
    }
}
