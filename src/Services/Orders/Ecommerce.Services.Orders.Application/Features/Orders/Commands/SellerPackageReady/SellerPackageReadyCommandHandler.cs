using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Messaging;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Ecommerce.Services.Orders.Application.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.SellerPackageReady;

public class SellerPackageReadyCommandHandler(
    IEfUnitOfWork unitOfWork,
    IEventPublisher publisher,
    ISellerService sellerService,
    ILogger<SellerPackageReadyCommandHandler> logger)
    : CommandHandler<SellerPackageReadyCommand>
{
    protected override async Task<Result> HandleCommandAsync(SellerPackageReadyCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seller {SellerId} marking sub-order {SubOrderId} as PackageReady", command.SellerId, command.SubOrderId);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, long>();
            
            // Tải SubOrder kèm Order mẹ, truyền null cho orderBy, cancellationToken và selector x => x.Order
            var subOrder = await subOrderRepo.FirstOrDefaultAsync(
                x => x.Id == command.SubOrderId,
                null,
                cancellationToken,
                x => x.Order);

            if (subOrder == null)
            {
                return Result.Failure("Đơn hàng không tồn tại", EErrorCode.NotFound);
            }

            // Gọi gRPC Seller service để xác thực chủ cửa hàng
            var validationResult = await sellerService.ValidateShopOwnerAsync(subOrder.ShopId, command.SellerId, cancellationToken);
            if (!validationResult.IsSuccess)
            {
                return Result.Failure(validationResult.Message, EErrorCode.Forbidden);
            }

            if (!validationResult.Value)
            {
                return Result.Failure("Bạn không phải là chủ sở hữu cửa hàng này", EErrorCode.Forbidden);
            }


            subOrder.UpdateSubOrderStatus(SubOrderStatus.PackageReady);
            subOrderRepo.Update(subOrder);

     
            await publisher.PublishAsync(new PackageReadyEvent
            {
                SubOrderId = subOrder.Id,
                Weight = command.Weight,
                Height = command.Height,
                Width = command.Width,
                Length = command.Length,
            }, cancellationToken);
            
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Sub-order {SubOrderId} marked as PackageReady and event published", subOrder.Id);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error marking sub-order {SubOrderId} as PackageReady by seller", command.SubOrderId);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
