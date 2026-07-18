using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Domain;
using Ecommerce.Services.Orders.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Application.Features.Orders.Commands.ConfirmPayment;

public class ConfirmPaymentCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<ConfirmPaymentCommandHandler> logger)
    : CommandHandler<ConfirmPaymentCommand>
{
    protected override async Task<Result> HandleCommandAsync(ConfirmPaymentCommand command, CancellationToken cancellationToken)
    {
        var orderId = command.OrderId;
        logger.LogInformation("ConfirmPaymentCommand: Bắt đầu xác nhận thanh toán cho đơn hàng {OrderId}", orderId);

        try
        {
            var subOrderRepo = unitOfWork.Repository<SubOrder, Guid>();
            
            // Tìm tất cả các SubOrder thuộc đơn gốc này
            var subOrders = await subOrderRepo.GetAllAsync(
                predicate: s => s.OrderId == orderId,
                cancellationToken: cancellationToken
            );

            if (!subOrders.Any())
            {
                logger.LogWarning("ConfirmPaymentCommand: Không tìm thấy SubOrder nào thuộc Order {OrderId}", orderId);
                return Result.Failure("Không tìm thấy đơn hàng con", EErrorCode.NotFound);
            }

            foreach (var subOrder in subOrders)
            {
                subOrder.UpdateSubOrderStatus(SubOrderStatus.AwaitingConfirmation);
                subOrderRepo.Update(subOrder);
                logger.LogInformation("ConfirmPaymentCommand: Cập nhật SubOrder {SubOrderId} sang AwaitingConfirmation", subOrder.Id);
            }
            

            await unitOfWork.SaveChangesAsync(cancellationToken);
            logger.LogInformation("ConfirmPaymentCommand: Đã hoàn tất cập nhật trạng thái đơn hàng {OrderId}", orderId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ConfirmPaymentCommand: Lỗi khi xử lý lưu trạng thái xác nhận thanh toán cho đơn {OrderId}: {Message}", orderId, ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
