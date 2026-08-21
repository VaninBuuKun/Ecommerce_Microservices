using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ToggleFollowShop;

public class ToggleFollowShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<ToggleFollowShopCommandHandler> logger)
    : CommandHandler<ToggleFollowShopCommand, bool>
{
    private readonly IGenericEfRepository<Shop, long> _shopRepository = unitOfWork.Repository<Shop, long>();
    private readonly IGenericEfRepository<FollowedShop, Guid> _followedShopRepository = unitOfWork.Repository<FollowedShop, Guid>();

    protected override async Task<Result<bool>> HandleCommandAsync(ToggleFollowShopCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var shop = await _shopRepository.GetByIdAsync(command.ShopId, cancellationToken);
            if (shop == null)
            {
                return Result<bool>.Failure("Cửa hàng không tồn tại.", EErrorCode.NotFound);
            }

            var existingFollow = await _followedShopRepository.FirstOrDefaultAsync(
                f => f.CustomerId == command.CustomerId && f.ShopId == command.ShopId,
                null,
                cancellationToken);

            if (existingFollow != null)
            {
                _followedShopRepository.Delete(existingFollow);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<bool>.Success(false); // Unfollowed
            }
            else
            {
                var newFollow = new FollowedShop(command.CustomerId, command.ShopId);
                _followedShopRepository.Add(newFollow);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<bool>.Success(true); // Followed
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi cập nhật Follow Shop {ShopId} cho Customer {CustomerId}", command.ShopId, command.CustomerId);
            return Result<bool>.Failure("Có lỗi xảy ra khi theo dõi cửa hàng.", EErrorCode.InternalServerError);
        }
    }
}
