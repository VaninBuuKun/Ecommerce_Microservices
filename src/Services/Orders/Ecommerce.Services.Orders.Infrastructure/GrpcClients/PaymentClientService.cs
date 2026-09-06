using System;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using Ecommerce.Services.Orders.Application.Commons.Dtos.Payments;
using Ecommerce.Services.Orders.Application.Services;

namespace Ecommerce.Services.Orders.Infrastructure.GrpcClients;

public class PaymentClientService(PaymentGrpc.PaymentGrpcClient client) : IPaymentService
{
    public async Task<Result<string?>> CreatePaymentAsync(long orderId, decimal amount, string paymentProvider, CancellationToken cancellationToken = default)
    {
        try
        {
            var request = new CreatePaymentGrpcRequest
            {
                TargetId = orderId,
                Amount = amount.ToString(CultureInfo.InvariantCulture),
                PaymentProvider = paymentProvider
            };

            var response = await client.CreatePaymentAsync(request, cancellationToken: cancellationToken);

            if (!response.Success)
            {
                return Result<string?>.Failure(response.ErrorMessage, EErrorCode.InternalServerError);
            }

            return Result<string?>.Success(response.PaymentUrl);
        }
        catch (Exception ex)
        {
            return Result<string?>.Failure($"Lỗi gọi Payment gRPC service: {ex.Message}", EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<PaymentMethodDto>> GetPaymentMethodAsync(long id, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.GetPaymentMethodAsync(new GetPaymentMethodRequest { Id = id }, cancellationToken: cancellationToken);
            if (!response.Found) return Result<PaymentMethodDto>.Failure("Phương thức thanh toán không tồn tại", EErrorCode.NotFound);

            return Result<PaymentMethodDto>.Success(new PaymentMethodDto
            {
                Id = response.Id,
                Title = response.Title,
                SubTitle = response.SubTitle,
                ProviderName = response.ProviderName,
                IconUrl = response.IconUrl,
                IsActive = response.IsActive,
                MinAmount = decimal.TryParse(response.MinAmount, NumberStyles.Any, CultureInfo.InvariantCulture, out var ma) ? ma : null
            });
        }
        catch (Exception ex)
        {
            return Result<PaymentMethodDto>.Failure($"Lỗi gọi Payment gRPC service: {ex.Message}", EErrorCode.InternalServerError);
        }
    }

    public async Task<Result<PaymentDto>> GetPaymentByOrderAsync(long orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.GetPaymentByOrderAsync(new GetPaymentByOrderRequest
            {
                OrderId = orderId
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

    public async Task<Result<bool>> CheckWalletAsync(long userId, decimal requiredAmount = 0m, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.CheckShopWalletAsync(new CheckWalletRequest
            {
                UserId = userId
            }, cancellationToken: cancellationToken);

            if (!response.HasWallet)
            {
                return Result<bool>.Failure("Người bán chưa đăng ký ví điện tử liên kết.", EErrorCode.NotFound);
            }

            if (response.IsLocked)
            {
                return Result<bool>.Failure("Ví điện tử của người bán hiện đang bị tạm khóa.", EErrorCode.Forbidden);
            }

            if (decimal.TryParse(response.Balance, CultureInfo.InvariantCulture, out var balance))
            {
                if (balance < requiredAmount)
                {
                    return Result<bool>.Failure($"Số dư ví của người bán không đủ để hoàn tiền. (Cần tối thiểu: {requiredAmount.ToString("N0", CultureInfo.GetCultureInfo("vi-VN"))}đ, Hiện có: {balance.ToString("N0", CultureInfo.GetCultureInfo("vi-VN"))}đ)", EErrorCode.ValidationErrors);
                }
            }

            return Result<bool>.Success(true);
        }
        catch (Grpc.Core.RpcException ex)
        {
            return ex.ToResultFailure<bool>();
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"Lỗi khi kết nối gRPC tới Payment Service: {ex.Message}");
        }
    }
}
