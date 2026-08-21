using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetPublicShopById;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetFollowedShops;

public class GetFollowedShopsQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetFollowedShopsQueryHandler> logger)
    : QueryHandler<GetFollowedShopsQuery, List<PublicShopDetailDto>>
{
    private readonly IGenericEfRepository<FollowedShop, Guid> _followedShopRepo = unitOfWork.Repository<FollowedShop, Guid>();
    private readonly IGenericEfRepository<Shop, long> _shopRepo = unitOfWork.Repository<Shop, long>();

    protected override async Task<Result<List<PublicShopDetailDto>>> HandleQueryAsync(GetFollowedShopsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var follows = await _followedShopRepo.GetAllAsync(
                f => f.CustomerId == query.CustomerId,
                q => q.OrderByDescending(f => f.CreatedAt),
                cancellationToken);

            var shopIds = follows.Select(f => f.ShopId).Distinct().ToList();

            if (!shopIds.Any())
            {
                return Result<List<PublicShopDetailDto>>.Success(new List<PublicShopDetailDto>());
            }

            var shops = await _shopRepo.GetAllAsync(
                s => shopIds.Contains(s.Id) && s.Status == ShopStatus.Active,
                null,
                cancellationToken);

            var dtos = shops.Select(shop => new PublicShopDetailDto(
                shop.Id,
                shop.OwnerUserId,
                shop.Name,
                shop.Description,
                shop.LogoUrl,
                shop.Status.ToString(),
                shop.PickUpAddress?.Province,
                shop.PickUpAddress?.District,
                shop.PickUpAddress?.Ward
            )).ToList();

            return Result<List<PublicShopDetailDto>>.Success(dtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi lấy danh sách Shop đang Follow của Customer {CustomerId}", query.CustomerId);
            return Result<List<PublicShopDetailDto>>.Failure("Có lỗi xảy ra khi lấy danh sách cửa hàng theo dõi.", EErrorCode.InternalServerError);
        }
    }
}
