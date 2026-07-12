using System;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Orders.Contracts.Events;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Services;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Payments.Api.Consumers;

public class CreatePaymentConsumer(
    IEfUnitOfWork unitOfWork,
    PaymentGatewayFactory factory,
    ILogger<CreatePaymentConsumer> logger) : IConsumer<CreatePaymentCommand>
{
    public async Task Consume(ConsumeContext<CreatePaymentCommand> context)
    {
        var command = context.Message;
        logger.LogInformation("Nhận CreatePaymentCommand cho đơn hàng {OrderId}, phương thức {MethodId}, số tiền {Amount}", command.OrderId, command.PaymentMethodId, command.Amount);
        
        try
        {
            var paymentMethodRepo = unitOfWork.Repository<PaymentMethod, long>();
            var paymentRepo = unitOfWork.Repository<Payment, Guid>();
            
            // 1. Tìm phương thức thanh toán theo ID
            var paymentMethod = await paymentMethodRepo.GetByIdAsync(command.PaymentMethodId, context.CancellationToken);
            if (paymentMethod == null || !paymentMethod.IsActive)
            {
                logger.LogError("Phương thức thanh toán {MethodId} không khả dụng.", command.PaymentMethodId);
                await context.Publish<PaymentFailedEvent>(new PaymentFailedEvent
                {
                    OrderId = command.OrderId,
                    Reason = $"Phương thức thanh toán không tồn tại hoặc đã bị khóa."
                });
                return;
            }
            
            // 2. Lấy gateway tương ứng
            var gateway = factory.GetPaymentGateway(paymentMethod.ProviderName);
            if (gateway == null)
            {
                logger.LogError("Cổng thanh toán '{ProviderName}' không được hỗ trợ.", paymentMethod.ProviderName);
                await context.Publish<PaymentFailedEvent>(new PaymentFailedEvent
                {
                    OrderId = command.OrderId,
                    Reason = $"Cổng thanh toán '{paymentMethod.ProviderName}' không được hỗ trợ."
                });
                return;
            }
            
            // 3. Tạo Payment Entity
            var payment = new Payment
            {
                Amount = command.Amount,
                TargetId = command.OrderId, // target là OrderId
                Status = PaymentStatus.Pending,
                Type = PaymentType.Purchase,
                MethodId = paymentMethod.Id,
            };
            
            paymentRepo.Add(payment);
            await unitOfWork.SaveChangesAsync(context.CancellationToken);
            
            // 4. Gọi Gateway tạo URL thanh toán
            var paymentResult = await gateway.CreatePaymentAsync(payment, context.CancellationToken);
            
            if (paymentResult.Success)
            {
                payment.PaymentUrl = paymentResult.PaymentUrl;
                await unitOfWork.SaveChangesAsync(context.CancellationToken);
                
                // Bắn event báo đã sinh URL thanh toán thành công
                await context.Publish<PaymentCreatedEvent>(new PaymentCreatedEvent
                {
                    OrderId = command.OrderId,
                    PaymentUrl = paymentResult.PaymentUrl
                });
                
                logger.LogInformation("Tạo Payment thành công cho đơn hàng {OrderId}. URL: {Url}", command.OrderId, paymentResult.PaymentUrl);
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                payment.ErrorMessage = paymentResult.ErrorMessage;
                await unitOfWork.SaveChangesAsync(context.CancellationToken);
                
                // Bắn event báo thanh toán thất bại
                await context.Publish<PaymentFailedEvent>(new PaymentFailedEvent
                {
                    OrderId = command.OrderId,
                    Reason = paymentResult.ErrorMessage ?? "Không thể khởi tạo giao dịch thanh toán."
                });
                
                logger.LogError("Lỗi khi tạo Payment qua gateway cho đơn hàng {OrderId}: {Error}", command.OrderId, paymentResult.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi nghiêm trọng trong CreatePaymentConsumer cho đơn hàng {OrderId}: {Message}", command.OrderId, ex.Message);
            await context.Publish<PaymentFailedEvent>(new PaymentFailedEvent
            {
                OrderId = command.OrderId,
                Reason = "Lỗi hệ thống khi khởi tạo thanh toán: " + ex.Message
            });
        }
    }
}
