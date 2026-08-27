using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.ApproveKyc;

public class ApproveKycCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<ApproveKycCommandHandler> logger)
    : ICommandHandler<ApproveKycCommand>
{
    public async Task<Result> Handle(ApproveKycCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("ApproveKycCommand: Duyệt hồ sơ KYC ID: {KycId}", request.KycId);

        try
        {
            var kycRepo = unitOfWork.Repository<SellerKyc, long>();
            var kyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.Id == request.KycId,
                cancellationToken: cancellationToken
            );

            if (kyc == null)
            {
                logger.LogWarning("ApproveKycCommand: Không tìm thấy hồ sơ KYC ID: {KycId}", request.KycId);
                return Result.Failure("Không tìm thấy hồ sơ xác minh.", EErrorCode.NotFound);
            }

            if (kyc.Status == KycStatus.Verified)
            {
                return Result.Success();
            }

            if (kyc.Status == KycStatus.Draft)
            {
                return Result.Failure("Hồ sơ KYC đang ở trạng thái Nháp, người dùng chưa tiến hành gửi. Admin không thể duyệt.", EErrorCode.InvalidInput);
            }

            kyc.Verify();
            kycRepo.Update(kyc);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("ApproveKycCommand: Hồ sơ KYC ID {KycId} của User {UserId} đã được Verified.", kyc.Id, kyc.UserId);
            return Result.Success();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "ApproveKycCommand: Lỗi xảy ra khi duyệt KYC: {Message}", ex.Message);
            return Result.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
