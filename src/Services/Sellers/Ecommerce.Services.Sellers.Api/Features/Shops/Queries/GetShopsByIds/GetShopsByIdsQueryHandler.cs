using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopsByIds;

public class GetShopsByIdsQueryHandler(IEfUnitOfWork unitOfWork) 
    : IQueryHandler<GetShopsByIdsQuery, List<ShopGrpcDto>>
{
    public async Task<Result<List<ShopGrpcDto>>> Handle(GetShopsByIdsQuery request, CancellationToken cancellationToken)
    {
        var shopRepo = unitOfWork.Repository<Shop, long>();
        var shops = await shopRepo.GetAllAsync(s => request.ShopIds.Contains(s.Id));

        var dtos = shops.Select(s => new ShopGrpcDto(s.Id, s.Name)).ToList();
        return Result<List<ShopGrpcDto>>.Success(dtos);
    }
}
