using System;
using System.Globalization;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
using Ecommerce.Services.Payments.Api.Services;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Payments.Api.GrpcServers;

public class PaymentGrpcServer(
    IPaymentService paymentService,
    IPaymentMethodService paymentMethodService,
    IWalletService walletService,
    ILogger<PaymentGrpcServer> logger) : PaymentGrpc.PaymentGrpcBase
{
    public override async Task<CreatePaymentGrpcResponse> CreatePayment(CreatePaymentGrpcRequest request, ServerCallContext context)
    {
        try
        {
            var amount = decimal.Parse(request.Amount, CultureInfo.InvariantCulture);
            var paymentRequest = new CreatePaymentRequest
            {
                OrderId = request.TargetId,
                Amount = amount,
                Currency = "VND",
                MethodProvider = request.PaymentProvider,
                PaymentType = PaymentType.Purchase
            };

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

        var result = await paymentMethodService.GetPaymentMethodById(request.Id);

        if (!result.IsSuccess || result.Value == null)
        {
            return new GetPaymentMethodResponse { Found = false };
        }

        var method = result.Value;
        return new GetPaymentMethodResponse
        {
            Found = true,
            Id = method.Id,
            Title = method.Title,
            SubTitle = method.SubTitle,
            ProviderName = method.ProviderName,
            IconUrl = method.IconUrl,
            IsActive = method.IsActive
        };
    }

    public override async Task<GetPaymentByOrderResponse> GetPaymentByOrder(GetPaymentByOrderRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to get payment by order: {OrderId}", request.OrderId);

        var result = await paymentService.GetPaymentByOrderIdAsync(request.OrderId);

        if (!result.IsSuccess || result.Value == null)
        {
            return new GetPaymentByOrderResponse { Found = false };
        }

        var payment = result.Value;
        return new GetPaymentByOrderResponse
        {
            Found = true,
            PaymentId = payment.Id.ToString(),
            IconUrl = payment.Method?.IconUrl ?? string.Empty,
            Status = payment.Status.ToString(),
            MethodTitle = payment.Method?.Title ?? string.Empty,
            ProviderName = payment.Method?.ProviderName ?? string.Empty,
            PaymentUrl = payment.PaymentUrl ?? string.Empty
        };
    }

    public override async Task<CheckWalletResponse> CheckShopWallet(CheckWalletRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC Request to check shop wallet for user: {UserId}", request.UserId);

        var result = await walletService.GetWalletByUserId(request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            return new CheckWalletResponse { HasWallet = false, IsLocked = false, Balance = "0" };
        }

        var wallet = result.Value;
        return new CheckWalletResponse
        {
            HasWallet = true,
            IsLocked = wallet.IsLocked,
            Balance = wallet.Balance.ToString(CultureInfo.InvariantCulture)
        };
    }
}
