using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;
using BuildingBlocks.Shared.Enums;
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

    public async Task<Result<PaymentMethodDto>> GetPaymentMethodAsync(long id, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.GetPaymentMethodAsync(new GetPaymentMethodRequest
            {
                Id = id
            }, cancellationToken: cancellationToken);

            if (!response.Found)
            {
                return Result<PaymentMethodDto>.Failure("Hình thức thanh toán không tồn tại.", EErrorCode.NotFound);
            }

            return Result<PaymentMethodDto>.Success(new PaymentMethodDto()
            {
                Id = response.Id,
                Title = response.Title,
                ProviderName = response.ProviderName,
                IconUrl = response.IconUrl,
                IsActive = response.IsActive
            });
        }
        catch (Grpc.Core.RpcException ex)
        {
            return ex.ToResultFailure<PaymentMethodDto>();
        }
        catch (Exception ex)
        {
            return Result<PaymentMethodDto>.Failure($"Lỗi khi kết nối gRPC tới Payment Service: {ex.Message}");
        }
    }

    public async Task<Result<PaymentDto>> GetPaymentByOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.GetPaymentByOrderAsync(new GetPaymentByOrderRequest
            {
                OrderId = orderId.ToString()
            }, cancellationToken: cancellationToken);

            if (!response.Found)
            {
                return Result<PaymentDto>.Failure("Thông tin thanh toán không tìm thấy cho đơn hàng này.", EErrorCode.NotFound);
            }

            return Result<PaymentDto>.Success(new PaymentDto()
            {
                Id = Guid.TryParse(response.PaymentId, out var paymentId)
                    ? paymentId
                    : throw new InvalidOperationException("PaymentId is null"),
                Title = response.MethodTitle,
                Status = response.Status,
                ProviderName = response.ProviderName,
                PaymentUrl = response.PaymentUrl,
                IconUrl = response.IconUrl
            });
        }
        catch (Grpc.Core.RpcException ex)
        {
            return ex.ToResultFailure<PaymentDto>();
        }
        catch (Exception ex)
        {
            return Result<PaymentDto>.Failure($"Lỗi khi kết nối gRPC tới Payment Service: {ex.Message}");
        }
    }
}
