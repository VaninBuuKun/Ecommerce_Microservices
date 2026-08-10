using System;
using System.Threading.Tasks;
using BuildingBlocks.Grpc.Extensions;
using BuildingBlocks.Grpc.Services;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Infrastructure.GrpcClients;

public class PaymentClientService(
    PaymentGrpc.PaymentGrpcClient grpcClient,
    ILogger<PaymentClientService> logger)
    : IPaymentService
{
    public async Task<Result<bool>> CheckShopWalletAsync(long userId)
    {
        try
        {
            var response = await grpcClient.CheckShopWalletAsync(new CheckWalletRequest
            {
                UserId = userId
            });

            if (response == null)
            {
                return Result<bool>.Failure("Không nhận được phản hồi từ hệ thống ví điện tử.", BuildingBlocks.Shared.Enums.EErrorCode.InternalServerError);
            }

            return Result<bool>.Success(response.HasWallet);
        }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Lỗi gRPC khi kiểm tra ví của người dùng {UserId}: {Message}", userId, ex.Message);
            return ex.ToResultFailure<bool>();
        }
    }
}
