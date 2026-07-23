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
    : QueryHandler<GetSubOrdersByShopQuery, List<CustomerOrderResponse>>
{
    protected override async Task<Result<List<CustomerOrderResponse>>> HandleQueryAsync(GetSubOrdersByShopQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting sub-orders for seller shop: {ShopId}", query.ShopId);

        // Call gRPC Seller service to validate if the user owns the shop
        var validationResult = await sellerService.ValidateShopOwnerAsync(query.ShopId, query.UserId, cancellationToken);
        if (!validationResult.IsSuccess)
        {
            return Result<List<CustomerOrderResponse>>.Failure(validationResult.Message, EErrorCode.Forbidden);
        }
        if (!validationResult.Value)
        {
            return Result<List<CustomerOrderResponse>>.Failure("Bạn không phải là chủ sở hữu cửa hàng này", EErrorCode.Forbidden);
        }

        var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
        
        var subOrders = await subOrderRepo.GetAllAsync(
            predicate: o => o.ShopId == query.ShopId,
            orderBy: q => q.OrderByDescending(o => o.CreatedDate),
            cancellationToken: cancellationToken,
            includes: o => o.SubOrderItems
        );

        var response = mapper.Map<List<CustomerOrderResponse>>(subOrders);
        return Result<List<CustomerOrderResponse>>.Success(response);
    }
}
