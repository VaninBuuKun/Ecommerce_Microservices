using System.Threading.Tasks;
using Ecommerce.Services.Orders.Application.Features.Orders.Commands.ConfirmPayment;
using Ecommerce.Services.Orders.Contracts.Events;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Orders.Infrastructure.Consumers;

public class PaymentSucceededConsumer(
    ISender sender,
    ILogger<PaymentSucceededConsumer> logger) 
    : IConsumer<PaymentSucceededEvent>
{
    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var orderId = context.Message.OrderId;
        logger.LogInformation("PaymentSucceededConsumer: Nhận xác nhận thanh toán thành công cho đơn hàng: {OrderId}", orderId);

        var result = await sender.Send(new ConfirmPaymentCommand(orderId), context.CancellationToken);
        
        if (!result.IsSuccess)
        {
            logger.LogError("PaymentSucceededConsumer: Lỗi khi xử lý xác nhận thanh toán cho đơn {OrderId}: {Error}", orderId, result.Message);
        }
    }
}
