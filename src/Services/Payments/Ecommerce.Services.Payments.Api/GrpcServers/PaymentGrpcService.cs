using System;
using System.Globalization;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Entities;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Grpc.Core;
namespace Ecommerce.Services.Payments.Api.GrpcServers;

public class PaymentGrpcService(
    IPaymentService paymentService,
    IEfUnitOfWork unitOfWork,
    ILogger<PaymentGrpcService> logger) : PaymentGrpc.PaymentGrpcBase
{
    public override async Task<CreatePaymentGrpcResponse> CreatePayment(CreatePaymentGrpcRequest request, ServerCallContext context)
    {
        try
        {
            var amount = decimal.Parse(request.Amount, CultureInfo.InvariantCulture);
            var paymentRequest = new CreatePaymentRequest
            {
                OrderId = Guid.Parse(request.TargetId),
                Amount = amount,
                Currency = "VND",
                MethodProvider = request.PaymentProvider,
                PaymentType = PaymentType.Purchase
            };

            // 3. Xử lý thanh toán
            var result = await paymentService.ProcessPayment(paymentRequest);
            if (!result.IsSuccess || result.Value == null)
            {
                return new CreatePaymentGrpcResponse
                {
                    Success = false,
                    ErrorMessage = result.Message ?? "Xử lý thanh toán thất bại."
                };
            }

            var paymentResult = result.Value;
            return new CreatePaymentGrpcResponse
            {
                Success = paymentResult.Success,
                PaymentUrl = paymentResult.PaymentUrl ?? string.Empty,
                ErrorMessage = paymentResult.ErrorMessage ?? string.Empty
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi xử lý tạo Payment gRPC cho đơn hàng {TargetId}: {Message}", request.TargetId, ex.Message);
            return new CreatePaymentGrpcResponse
            {
                Success = false,
                ErrorMessage = $"Lỗi hệ thống khi tạo thanh toán: {ex.Message}"
            };
        }
    }

    public override async Task<GetPaymentMethodResponse> GetPaymentMethod(GetPaymentMethodRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get payment method: {Id}", request.Id);

        try
        {
            var repo = unitOfWork.Repository<PaymentMethod, long>();
            var method = await repo.GetByIdAsync(request.Id);
            if (method == null)
            {
                logger.LogWarning("Payment method not found: {Id}", request.Id);
                return new GetPaymentMethodResponse { Found = false };
            }

            return new GetPaymentMethodResponse
            {
                Found = true,
                Id = method.Id,
                Title = method.Title,
                SubTitle = method.SubTitle ?? string.Empty,
                ProviderName = method.ProviderName,
                IconUrl = method.IconUrl ?? string.Empty,
                IsActive = method.IsActive
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy thông tin payment method gRPC {Id}: {Message}", request.Id, ex.Message);
            return new GetPaymentMethodResponse { Found = false };
        }
    }

    public override async Task<GetPaymentByOrderResponse> GetPaymentByOrder(GetPaymentByOrderRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get payment by order: {OrderId}", request.OrderId);

        try
        {
            if (!Guid.TryParse(request.OrderId, out var orderId))
            {
                return new GetPaymentByOrderResponse { Found = false };
            }

            var repo = unitOfWork.Repository<Payment, Guid>();
            var payment = await repo.FirstOrDefaultAsync(
                predicate: p => p.OrderId == orderId,
                includes: p => p.Method
            );

            if (payment == null)
            {
                logger.LogWarning("Payment not found for order: {OrderId}", request.OrderId);
                return new GetPaymentByOrderResponse { Found = false };
            }

            return new GetPaymentByOrderResponse
            {
                Found = true,
                PaymentId = payment.Id.ToString(),
                IconUrl = payment.Method.IconUrl ?? string.Empty,
                Status = payment.Status.ToString(),
                MethodTitle = payment.Method?.Title ?? string.Empty,
                ProviderName = payment.Method?.ProviderName ?? string.Empty,
                PaymentUrl = payment.PaymentUrl ?? string.Empty
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy thông tin payment gRPC theo order {OrderId}: {Message}", request.OrderId, ex.Message);
            return new GetPaymentByOrderResponse { Found = false };
        }
    }
}
