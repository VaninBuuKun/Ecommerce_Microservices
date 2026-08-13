using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;

namespace Ecommerce.Services.Sellers.Api.Services;

public class PaymentService(
    PaymentGrpc.PaymentGrpcClient client,
    ILogger<PaymentService> logger) : IPaymentService
{
    public async Task<Result<bool>> CheckShopWalletAsync(long userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.CheckShopWalletAsync(new CheckWalletRequest
            {
                UserId = userId
            }, cancellationToken: cancellationToken);

            if (!response.HasWallet)
            {
                return Result<bool>.Failure("Tài khoản của bạn chưa kích hoạt hoặc đăng ký ví điện tử liên kết. Vui lòng tạo ví trước khi đăng ký mở cửa hàng.", EErrorCode.ValidationErrors);
            }

            if (response.IsLocked)
            {
                return Result<bool>.Failure("Ví điện tử của người bán hiện đang bị khóa.", EErrorCode.Forbidden);
            }

            return Result<bool>.Success(true);
        }
        catch (Grpc.Core.RpcException ex)
        {
            logger.LogError(ex, "gRPC error checking shop wallet for user {UserId}", userId);
            return ex.ToResultFailure<bool>();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error checking shop wallet for user {UserId}", userId);
            return Result<bool>.Failure($"Lỗi khi kết nối gRPC tới Payment Service: {ex.Message}");
        }
    }
}
