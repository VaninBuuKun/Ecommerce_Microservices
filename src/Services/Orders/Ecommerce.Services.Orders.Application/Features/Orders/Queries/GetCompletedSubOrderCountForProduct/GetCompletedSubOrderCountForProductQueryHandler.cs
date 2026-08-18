using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using MediatR;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Queries.GetCompletedSubOrderCountForProduct;

public class GetCompletedSubOrderCountForProductQueryHandler(IEfUnitOfWork unitOfWork) 
    : IRequestHandler<GetCompletedSubOrderCountForProductQuery, Result<int>>
{
    public async Task<Result<int>> Handle(GetCompletedSubOrderCountForProductQuery request, CancellationToken cancellationToken)
    {
        var subOrderRepository = unitOfWork.Repository<SubOrder, Guid>();
        
        var count = await subOrderRepository.CountAsync(
            s => s.CustomerId == request.CustomerId 
              && s.Status == SubOrderStatus.Completed 
              && s.SubOrderItems.Any(i => i.ProductId == request.ProductId),
            cancellationToken);

        return Result<int>.Success(count);
    }
}
