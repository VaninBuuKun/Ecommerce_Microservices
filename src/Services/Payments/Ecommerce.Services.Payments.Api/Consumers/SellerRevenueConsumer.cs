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
        // PlatformDiscount là khoản giảm giá do Sàn tài trợ cho người mua (Platform Voucher),
        // người bán (Seller) vẫn được hưởng đầy đủ giá trị đơn hàng (TotalAmount) và không bị khấu trừ khoản này.
        var grossRevenue = @event.TotalAmount;

        try
        {
            // 1. Lấy tỷ lệ hoa hồng sàn hiện tại
            var configRepo = unitOfWork.Repository<PlatformCommissionConfig, long>();
            var commissionConfig = await configRepo.FirstOrDefaultAsync(c => true);
            var commissionRate = commissionConfig?.RatePercentage ?? 5.0m;

            var commissionAmount = Math.Round(grossRevenue * (commissionRate / 100m), 2);
            var netRevenue = grossRevenue - commissionAmount;

            logger.LogInformation("Processing SubOrderCompletedEvent. ShopId: {ShopId}, Gross: {Gross}, Rate: {Rate}%, Commission: {Commission}, Net: {Net}, SubOrderId: {SubOrderId}",
                @event.ShopId, grossRevenue, commissionRate, commissionAmount, netRevenue, @event.SubOrderId);

            // 2. Gọi gRPC sang Seller Service để lấy OwnerUserId của ShopId
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
            var walletRepo = unitOfWork.Repository<Wallet, long>();
            var transactionRepo = unitOfWork.Repository<WalletTransaction, Guid>();
            var revenueRecordRepo = unitOfWork.Repository<RevenueRecord, long>();

            // 3. Tìm ví của chủ shop
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

            // 4. Cộng doanh thu thực tế (đã trừ hoa hồng sàn) vào ví
            wallet.Balance += netRevenue;
            walletRepo.Update(wallet);

            // 5. Tạo bản ghi RevenueRecord đối soát
            var revenueRecord = new RevenueRecord
            {
                SubOrderId = @event.SubOrderId,
                ShopId = @event.ShopId,
                GrossAmount = grossRevenue,
                PlatformDiscountAmount = @event.PlatformDiscount,
                CommissionRatePercentage = commissionRate,
                CommissionAmount = commissionAmount,
                NetAmount = netRevenue
            };
            revenueRecordRepo.Add(revenueRecord);

            // 6. Tạo giao dịch biến động số dư
            var transaction = new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = netRevenue,
                Type = TransactionType.Credit,
                Reason = TransactionReason.SellerRevenue,
                BalanceAfter = wallet.Balance,
                ReferenceId = @event.SubOrderId.ToString(),
                Description = $"Cộng doanh thu đơn hàng {@event.SubOrderId} hoàn tất. (Doanh thu: {grossRevenue:N0}đ - Hoa hồng sàn {commissionRate}%: {commissionAmount:N0}đ = Thực nhận: {netRevenue:N0}đ)"
            };
            transactionRepo.Add(transaction);

            await unitOfWork.SaveChangesAsync();
            logger.LogInformation("Successfully credited net revenue of {NetRevenue} (Gross: {Gross}, Commission: {Commission}) to Seller {OwnerUserId} for SubOrder {SubOrderId}",
                netRevenue, grossRevenue, commissionAmount, ownerUserId, @event.SubOrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process SubOrderCompletedEvent for SubOrder {SubOrderId}", @event.SubOrderId);
            throw;
        }
    }
}
