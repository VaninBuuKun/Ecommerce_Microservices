using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Application.Features.Orders.Dtos;
using Ecommerce.Services.Orders.Domain;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Queries.GetCustomerOrders;

public record GetSubOrdersQuery(long CustomerId) : IQuery<List<CustomerOrderResponse>>;

public class GetSubOrdersQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetSubOrdersQueryHandler> logger, IMapper mapper)
    : QueryHandler<GetSubOrdersQuery, List<CustomerOrderResponse>>
{
    protected override async Task<Result<List<CustomerOrderResponse>>> HandleQueryAsync(GetSubOrdersQuery query, CancellationToken cancellationToken)
    {
        var customerId = query.CustomerId;
        logger.LogInformation("Getting orders for customer: {CustomerId}", customerId);

        var subOrderRepo = unitOfWork.Repository<SubOrder, long>();

        // Fetch orders using repository method, without calling AsQueryable()
        var orders = await subOrderRepo.GetAllAsync(
            predicate: o => o.CustomerId == customerId,
            orderBy: q => q.OrderByDescending(o => o.CreatedDate),
            cancellationToken: cancellationToken,
            includes: o => o.SubOrderItems
        );
        
        var response = orders.Select(o => new CustomerOrderResponse
        {
            Id = o.Id,
            CustomerId = o.CustomerId,
            GrandTotal = o.GrandTotal,
            Status = o.Status.ToString(),
            OrderDate = o.CreatedDate,
            ShopId = o.ShopId,
            ShopName = o.ShopId == 4 ? "Shop Phụ Kiện Kid Buu" : $"Cửa hàng #{o.ShopId}",
            OrderItems = o.SubOrderItems.Select(item => new CustomerOrderItemDto
            {
                OrderId = item.SubOrderId,
                VariantId = item.VariantId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                ProductName = item.ProductName,
                VariantName = item.VariantName,
                ThumbnailUrl = item.ThumbnailUrl ?? "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=150"
            }).ToList()
        }).ToList();

        return Result<List<CustomerOrderResponse>>.Success(response);
    }
}
