using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Services;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class PaymentClientService(PaymentGrpc.PaymentGrpcClient client) : IPaymentService
{
    public async Task<Result<string?>> CreatePaymentAsync(Guid orderId, decimal amount, string paymentProvider, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new CreatePaymentGrpcRequest
            {
                TargetId = orderId.ToString(),
                Amount = amount.ToString(CultureInfo.InvariantCulture),
                PaymentProvider = paymentProvider
            };

            var response = await client.CreatePaymentAsync(request, cancellationToken: cancellationToken);

            if (!response.Success)
            {
                return Result<string?>.Failure(response.ErrorMessage ?? "Khởi tạo thanh toán thất bại.");
            }

            return Result<string?>.Success(string.IsNullOrEmpty(response.PaymentUrl) ? null : response.PaymentUrl);
        }
        catch (Grpc.Core.RpcException ex)
        {
            return ex.ToResultFailure<string?>();
        }
        catch (Exception ex)
        {
            return Result<string?>.Failure($"Lỗi khi kết nối gRPC tới Payment Service: {ex.Message}");
        }
    }
}
