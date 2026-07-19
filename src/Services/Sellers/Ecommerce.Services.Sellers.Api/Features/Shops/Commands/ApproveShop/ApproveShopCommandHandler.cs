using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Contracts.Events;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.ApproveShop;

// Khai báo Integration Event cục bộ để các service khác lắng nghe
public record ShopActivatedCommand(long ShopId, long OwnerUserId, string ShopName);

public class ApproveShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ILogger<ApproveShopCommandHandler> logger)
    : ICommandHandler<ApproveShopCommand>
{
    public async Task<Result> Handle(ApproveShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("ApproveShopCommand: Phê duyệt kích hoạt Shop ID: {ShopId}", request.ShopId);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shop = await shopRepo.FirstOrDefaultAsync(
                predicate: s => s.Id == request.ShopId,
                cancellationToken: cancellationToken
            );

            if (shop == null)
            {
                logger.LogWarning("ApproveShopCommand: Không tìm thấy Shop ID {ShopId} để duyệt.", request.ShopId);
                return Result.Failure("Không tìm thấy cửa hàng.", EErrorCode.NotFound);
            }

            if (shop.Status == ShopStatus.Active)
            {
                return Result.Success(); // Đã kích hoạt rồi thì thành công luôn
            }

            shop.Approve();
            shopRepo.Update(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            await publisher.PublishAsync(new ShopActivatedEvent(shop.Id, shop.OwnerUserId, shop.Name), cancellationToken);

            logger.LogInformation("ApproveShopCommand: Shop {ShopId} đã chuyển sang Active và publish ShopActivatedEvent thành công.", shop.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ApproveShopCommand: Lỗi xảy ra khi duyệt Shop: {Message}", ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
