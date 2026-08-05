using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ActivateShop;

public class ActivateShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<ActivateShopCommandHandler> logger)
    : ICommandHandler<ActivateShopCommand>
{
    public async Task<Result> Handle(ActivateShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("ActivateShopCommand: Kích hoạt lại Shop ID: {ShopId}", request.ShopId);

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
                return Result.Failure("Bạn không có quyền kích hoạt cửa hàng này.", EErrorCode.Forbidden);
            }

            if (shop.Status == ShopStatus.Active)
            {
                return Result.Success();
            }

            if (shop.Status != ShopStatus.Suspended)
            {
                return Result.Failure("Chỉ có thể kích hoạt lại cửa hàng đang tạm ẩn.", EErrorCode.Forbidden);
            }

            shop.Activate();
            shopRepo.Update(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("ActivateShopCommand: Shop {ShopId} đã chuyển sang Active.", shop.Id);
            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(ex.Message, EErrorCode.Forbidden);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ActivateShopCommand: Lỗi khi kích hoạt Shop: {Message}", ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
