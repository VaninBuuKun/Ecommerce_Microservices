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
using Microsoft.Extensions.Logging;

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
                TargetId = Guid.Parse(request.TargetId),
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
}
