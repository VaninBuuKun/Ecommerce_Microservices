using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetMySellerProfile;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetPublicShopsByOwnerId;

public record GetPublicShopsByOwnerIdQuery(long OwnerUserId) : IQuery<List<ShopDto>>;

public class GetPublicShopsByOwnerIdQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetPublicShopsByOwnerIdQueryHandler> logger)
    : IQueryHandler<GetPublicShopsByOwnerIdQuery, List<ShopDto>>
{
    public async Task<Result<List<ShopDto>>> Handle(GetPublicShopsByOwnerIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shops = (await shopRepo.GetAllAsync(s => s.OwnerUserId == request.OwnerUserId && s.Status == ShopStatus.Active))
                .Select(s => new ShopDto(
                    s.Id,
                    s.Name,
                    s.Description,
                    s.LogoUrl)).ToList();

            return Result<List<ShopDto>>.Success(shops);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetPublicShopsByOwnerIdQuery: Lỗi khi lấy danh sách shop của Owner: {OwnerUserId}", request.OwnerUserId);
            return Result<List<ShopDto>>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
