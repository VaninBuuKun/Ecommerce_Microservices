using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.SuspendShop;

public class SuspendShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<SuspendShopCommandHandler> logger)
    : ICommandHandler<SuspendShopCommand>
{
    public async Task<Result> Handle(SuspendShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("SuspendShopCommand: Tạm ẩn Shop ID: {ShopId}", request.ShopId);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shop = await shopRepo.GetByIdAsync(request.ShopId, cancellationToken: cancellationToken);

            if (shop == null)
            {
                return Result.Failure("Không tìm thấy cửa hàng.", EErrorCode.NotFound);
            }

            if (!request.IsAdmin && shop.OwnerUserId != request.RequestingUserId)
            {
                return Result.Failure("Bạn không có quyền tạm ẩn cửa hàng này.", EErrorCode.Forbidden);
            }

            if (shop.Status == ShopStatus.Suspended)
            {
                return Result.Success();
            }

            shop.Suspend();
            shopRepo.Update(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("SuspendShopCommand: Shop {ShopId} đã chuyển sang Suspended.", shop.Id);
            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(ex.Message, EErrorCode.Forbidden);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SuspendShopCommand: Lỗi khi tạm ẩn Shop: {Message}", ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
