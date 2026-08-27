using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Application.Services;
using Ecommerce.Services.Orders.Domain;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetSubOrdersByShop;

public class GetSubOrdersByShopQueryHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ILogger<GetSubOrdersByShopQueryHandler> logger,
    IMapper mapper)
    : QueryHandler<GetSubOrdersByShopQuery, PagedOrdersResponse>
{
    protected override async Task<Result<PagedOrdersResponse>> HandleQueryAsync(GetSubOrdersByShopQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting sub-orders for seller shop: {ShopId} (Page {PageNumber}, Size {PageSize})", 
            query.ShopId, query.PageNumber, query.PageSize);

        // Call gRPC Seller service to validate if the user owns the shop
        var validationResult = await sellerService.ValidateShopOwnerAsync(query.ShopId, query.UserId, cancellationToken);
        if (!validationResult.IsSuccess)
        {
            return Result<PagedOrdersResponse>.Failure(validationResult.Message, EErrorCode.Forbidden);
        }
        if (!validationResult.Value)
        {
            return Result<PagedOrdersResponse>.Failure("Bạn không phải là chủ sở hữu cửa hàng này", EErrorCode.Forbidden);
        }

        var subOrderRepo = unitOfWork.Repository<SubOrder, long>();

        Ecommerce.Services.Orders.Domain.Enums.SubOrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<Ecommerce.Services.Orders.Domain.Enums.SubOrderStatus>(query.Status, true, out var parsedStatus))
        {
            statusEnum = parsedStatus;
        }

        System.Linq.Expressions.Expression<Func<SubOrder, bool>> predicate = o => o.ShopId == query.ShopId;
        if (statusEnum.HasValue)
        {
            predicate = o => o.ShopId == query.ShopId && o.Status == statusEnum.Value;
        }

        var totalCount = await subOrderRepo.CountAsync(predicate, cancellationToken);

        var subOrders = await subOrderRepo.GetPageAsync(
            pageNumber: query.PageNumber,
            pageSize: query.PageSize,
            predicate: predicate,
            orderBy: q => q.OrderByDescending(o => o.CreatedDate),
            cancellationToken: cancellationToken,
            includes: new System.Linq.Expressions.Expression<Func<SubOrder, object>>[] { o => o.Order }
        );

        var items = mapper.Map<List<CustomerOrderResponse>>(subOrders);
        var totalPages = (int)System.Math.Ceiling((double)totalCount / query.PageSize);
        var response = new PagedOrdersResponse(items, totalCount, query.PageNumber, query.PageSize, totalPages);

        return Result<PagedOrdersResponse>.Success(response);
    }
}
