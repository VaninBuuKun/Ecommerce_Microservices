using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Domain;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetOrderById;

public class GetOrderByIdQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetOrderByIdQueryHandler> logger,
    IMapper mapper)
    : QueryHandler<GetOrderByIdQuery, CustomerOrderResponse>
{
    protected override async Task<Result<CustomerOrderResponse>> HandleQueryAsync(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting order: {OrderId} for customer {CustomerId}", query.OrderId, query.CustomerId);

        var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
        
        var subOrder = await subOrderRepo.FirstOrDefaultAsync(
            predicate: o => o.Id == query.OrderId && o.CustomerId == query.CustomerId,
            includes: o => o.SubOrderItems
        );

        if (subOrder == null)
        {
            logger.LogWarning("Order {OrderId} not found or not owned by Customer {CustomerId}", query.OrderId, query.CustomerId);
            return Result<CustomerOrderResponse>.Failure("Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn", EErrorCode.NotFound);
        }

        var response = mapper.Map<CustomerOrderResponse>(subOrder);
        return Result<CustomerOrderResponse>.Success(response);
    }
}
