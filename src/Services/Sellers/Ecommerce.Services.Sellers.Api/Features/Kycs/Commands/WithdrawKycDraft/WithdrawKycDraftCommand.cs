using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.WithdrawKycDraft;

public record WithdrawKycDraftCommand(long UserId) : ICommand<SellerKyc>;

public class WithdrawKycDraftCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<WithdrawKycDraftCommandHandler> logger)
    : ICommandHandler<WithdrawKycDraftCommand, SellerKyc>
{
    public async Task<Result<SellerKyc>> Handle(WithdrawKycDraftCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("WithdrawKycDraftCommand: Rút hồ sơ KYC về dạng Draft từ User: {UserId}", request.UserId);

        try
        {
            var kycRepo = unitOfWork.Repository<SellerKyc, long>();
            var kyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.UserId,
                cancellationToken: cancellationToken
            );

            if (kyc == null)
            {
                return Result<SellerKyc>.Failure("Không tìm thấy hồ sơ xác minh KYC.", EErrorCode.NotFound);
            }

            if (kyc.Status == KycStatus.Verified)
            {
                return Result<SellerKyc>.Failure("Tài khoản của bạn đã được xác minh thành công, không thể chuyển về trạng thái nháp.", EErrorCode.InvalidInput);
            }

            kyc.WithdrawToDraft();
            kycRepo.Update(kyc);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("WithdrawKycDraftCommand: Đã chuyển hồ sơ KYC của User: {UserId} về Draft thành công.", request.UserId);
            return Result<SellerKyc>.Success(kyc);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "WithdrawKycDraftCommand: Lỗi xảy ra khi rút KYC: {Message}", ex.Message);
            return Result<SellerKyc>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
