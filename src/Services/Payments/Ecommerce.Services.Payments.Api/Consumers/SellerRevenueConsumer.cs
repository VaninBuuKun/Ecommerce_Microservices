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
            // 1. Sử dụng trực tiếp snapshot từ SubOrderCompletedEvent (đã chốt cứng lúc tạo đơn, bất biến)
            decimal commissionRate;
            decimal commissionAmount;
            decimal netRevenue;

            if (@event.CommissionFee > 0 || @event.NetRevenue > 0)
            {
                commissionRate = @event.CommissionRate > 0 ? @event.CommissionRate : 5.0m;
                commissionAmount = @event.CommissionFee;
                netRevenue = @event.NetRevenue > 0 ? @event.NetRevenue : (grossRevenue - commissionAmount);
            }
            else
            {
                // Fallback cho các đơn hàng cũ tạo trước khi áp dụng tính năng snapshot
                commissionRate = 5.0m;
                commissionAmount = Math.Round(grossRevenue * (commissionRate / 100m), MidpointRounding.AwayFromZero);
                netRevenue = grossRevenue - commissionAmount;
            }

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

            // 5. Tạo giao dịch biến động số dư ghi nhận sổ cái đối soát ví
            var transaction = new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = netRevenue,
                Type = TransactionType.Credit,
                Reason = TransactionReason.SellerRevenue,
                BalanceAfter = wallet.Balance,
                ReferenceId = @event.SubOrderId.ToString(),
                Description = $"Cộng doanh thu đơn hàng {@event.SubOrderId} hoàn tất. (Doanh thu: {grossRevenue:N0}đ - Hoa hồng sàn {commissionRate}%: {commissionAmount:N0}đ - Thực nhận: {netRevenue:N0}đ)"
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
