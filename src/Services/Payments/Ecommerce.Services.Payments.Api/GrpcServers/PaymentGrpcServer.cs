using System;
using System.Globalization;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Services;
using Ecommerce.Services.Payments.Api.Models.Dtos;
using Ecommerce.Services.Payments.Api.Models.Enums;
using Ecommerce.Services.Payments.Api.Models.Interfaces;
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
        if (!decimal.TryParse(request.Amount, CultureInfo.InvariantCulture, out var amount) || amount <= 0)
        {
            logger.LogWarning("gRPC CreatePayment: Số tiền thanh toán không hợp lệ '{Amount}' cho đơn #{TargetId}", 
                request.Amount, request.TargetId);
            return new CreatePaymentGrpcResponse
            {
                Success = false,
                ErrorMessage = $"Số tiền thanh toán không hợp lệ: {request.Amount}"
            };
        }

        logger.LogInformation("gRPC CreatePayment: Khởi tạo thanh toán đơn #{TargetId}, số tiền {Amount} VND qua cổng '{Provider}'", 
            request.TargetId, amount, request.PaymentProvider);

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
            var errMsg = result.Message ?? "Xử lý thanh toán thất bại.";
            logger.LogWarning("gRPC CreatePayment thất bại cho đơn #{TargetId}: {Message}", request.TargetId, errMsg);
            return new CreatePaymentGrpcResponse
            {
                Success = false,
                ErrorMessage = errMsg
            };
        }

        var paymentResult = result.Value;
        logger.LogInformation("gRPC CreatePayment hoàn tất cho đơn #{TargetId}: Success={Success}, PaymentUrl={PaymentUrl}", 
            request.TargetId, paymentResult.Success, paymentResult.PaymentUrl);

        return new CreatePaymentGrpcResponse
        {
            Success = paymentResult.Success,
            PaymentUrl = paymentResult.PaymentUrl ?? string.Empty,
            ErrorMessage = paymentResult.ErrorMessage ?? string.Empty
        };
    }

    public override async Task<GetPaymentMethodResponse> GetPaymentMethod(GetPaymentMethodRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC GetPaymentMethod: Lấy phương thức thanh toán #{Id}", request.Id);

        var result = await paymentMethodService.GetPaymentMethodById(request.Id);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetPaymentMethod: Không tìm thấy phương thức #{Id}", request.Id);
            return new GetPaymentMethodResponse { Found = false };
        }

        var method = result.Value;
        return new GetPaymentMethodResponse
        {
            Found = true,
            Id = method.Id,
            Title = method.Title ?? string.Empty,
            SubTitle = method.SubTitle ?? string.Empty,
            ProviderName = method.ProviderName ?? string.Empty,
            IconUrl = method.IconUrl ?? string.Empty,
            IsActive = method.IsActive
        };
    }

    public override async Task<GetPaymentByOrderResponse> GetPaymentByOrder(GetPaymentByOrderRequest request, ServerCallContext context)
    {
        logger.LogInformation("gRPC GetPaymentByOrder: Lấy thông tin thanh toán cho đơn hàng #{OrderId}", request.OrderId);

        var result = await paymentService.GetPaymentByOrderIdAsync(request.OrderId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC GetPaymentByOrder: Không tìm thấy thông tin thanh toán đơn #{OrderId}", request.OrderId);
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
        logger.LogInformation("gRPC CheckShopWallet: Kiểm tra số dư ví người dùng #{UserId}", request.UserId);

        var result = await walletService.GetWalletByUserId(request.UserId);

        if (!result.IsSuccess || result.Value == null)
        {
            logger.LogWarning("gRPC CheckShopWallet: Không tìm thấy ví cho User #{UserId}", request.UserId);
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
