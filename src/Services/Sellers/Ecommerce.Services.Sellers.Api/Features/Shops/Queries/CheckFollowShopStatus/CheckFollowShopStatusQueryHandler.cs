using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.CheckFollowShopStatus;

public class CheckFollowShopStatusQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<CheckFollowShopStatusQueryHandler> logger)
    : QueryHandler<CheckFollowShopStatusQuery, bool>
{
    private readonly IGenericEfRepository<FollowedShop, Guid> _followedShopRepo = unitOfWork.Repository<FollowedShop, Guid>();

    protected override async Task<Result<bool>> HandleQueryAsync(CheckFollowShopStatusQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var isFollowing = await _followedShopRepo.AnyAsync(
                f => f.CustomerId == query.CustomerId && f.ShopId == query.ShopId,
                cancellationToken);

            return Result<bool>.Success(isFollowing);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi kiểm tra trạng thái Follow của Customer {CustomerId} với Shop {ShopId}", query.CustomerId, query.ShopId);
            return Result<bool>.Failure("Có lỗi xảy ra khi kiểm tra trạng thái theo dõi.", EErrorCode.InternalServerError);
        }
    }
}
