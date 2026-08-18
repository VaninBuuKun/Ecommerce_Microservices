using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Payments.Api.Consumers;

public class SellerRevenueConsumer(
    IEfUnitOfWork unitOfWork,
    SellerGrpc.SellerGrpcClient sellerGrpcClient,
    ILogger<SellerRevenueConsumer> logger)
    : IConsumer<SubOrderCompletedEvent>
{
    public async Task Consume(ConsumeContext<SubOrderCompletedEvent> context)
    {
        var @event = context.Message;
        var netRevenue = @event.TotalAmount - @event.PlatformDiscount; // Sàn tự bỏ ra phần PlatformDiscount, không ảnh hưởng seller
        logger.LogInformation("Processing SubOrderCompletedEvent. ShopId: {ShopId}, GrandTotal: {Total}, PlatformDiscount: {Discount}, NetRevenue: {Net}, SubOrderId: {SubOrderId}",
            @event.ShopId, @event.TotalAmount, @event.PlatformDiscount, netRevenue, @event.SubOrderId);

        try
        {
            // 1. Gọi gRPC sang Seller Service để lấy OwnerUserId của ShopId
            var shopInfo = await sellerGrpcClient.GetShopShippingInfoAsync(new GetShopShippingInfoRequest
            {
                ShopId = @event.ShopId
            });

            if (shopInfo == null || shopInfo.OwnerUserId == 0)
            {
                logger.LogError("Failed to retrieve owner user ID for ShopId {ShopId} via gRPC.", @event.ShopId);
                return;
            }

            var ownerUserId = shopInfo.OwnerUserId;
            var walletRepo = unitOfWork.Repository<Wallet, Guid>();
            var transactionRepo = unitOfWork.Repository<WalletTransaction, Guid>();

            // 2. Tìm ví của chủ shop
            var wallet = await walletRepo.FirstOrDefaultAsync(w => w.UserId == ownerUserId);
            if (wallet == null)
            {
                logger.LogWarning("Wallet for Shop Owner {OwnerUserId} not activated yet. Activating automatically to hold revenue.", ownerUserId);
                wallet = new Wallet
                {
                    UserId = ownerUserId,
                    Balance = 0m,
                    IsLocked = false
                };
                walletRepo.Add(wallet);
            }

            // 3. Cộng doanh thu thực tế vào ví (đã trừ PlatformDiscount do sàn tự bỏ ra)
            wallet.Balance += netRevenue;
            walletRepo.Update(wallet);

            // 4. Tạo giao dịch biến động số dư
            var transaction = new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = netRevenue,
                Type = TransactionType.Credit,
                Reason = TransactionReason.SellerRevenue,
                BalanceAfter = wallet.Balance,
                ReferenceId = @event.SubOrderId,
                Description = $"Cộng doanh thu đơn hàng {@event.SubOrderId} hoàn tất. (Tổng: {@event.TotalAmount:N0}đ - Sàn trợ giá: {@event.PlatformDiscount:N0}đ)"
            };
            transactionRepo.Add(transaction);

            await unitOfWork.SaveChangesAsync();
            logger.LogInformation("Successfully credited net revenue of {NetRevenue} (gross: {Total}, platform discount: {Discount}) to Seller {OwnerUserId} for SubOrder {SubOrderId}",
                netRevenue, @event.TotalAmount, @event.PlatformDiscount, ownerUserId, @event.SubOrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process SubOrderCompletedEvent for SubOrder {SubOrderId}", @event.SubOrderId);
            throw;
        }
    }
}
