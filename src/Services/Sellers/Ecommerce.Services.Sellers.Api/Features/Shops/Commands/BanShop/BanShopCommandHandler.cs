using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.BanShop;

public class BanShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<BanShopCommandHandler> logger)
    : ICommandHandler<BanShopCommand>
{
    public async Task<Result> Handle(BanShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("BanShopCommand: Khóa Shop ID: {ShopId}", request.ShopId);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shop = await shopRepo.GetByIdAsync(request.ShopId, cancellationToken: cancellationToken);

            if (shop == null)
            {
                return Result.Failure("Không tìm thấy cửa hàng.", EErrorCode.NotFound);
            }

            if (shop.Status == ShopStatus.Banned)
            {
                return Result.Success();
            }

            shop.Ban();
            shopRepo.Update(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("BanShopCommand: Shop {ShopId} đã chuyển sang Banned.", shop.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "BanShopCommand: Lỗi khi khóa Shop: {Message}", ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
