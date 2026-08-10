
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Services;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Commands.RegisterKyc;

public class RegisterKycCommandHandler(
    IEfUnitOfWork unitOfWork,
    IPaymentService paymentService,
    ILogger<RegisterKycCommandHandler> logger)
    : ICommandHandler<RegisterKycCommand, SellerKyc>
{
    public async Task<Result<SellerKyc>> Handle(RegisterKycCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("RegisterKycCommand: Nhận đăng ký KYC từ User: {UserId}", request.UserId);

        try
        {
            // RÀNG BUỘC: Kiểm tra ví đã được kích hoạt hay chưa trước khi nộp KYC
            var walletCheck = await paymentService.CheckShopWalletAsync(request.UserId, cancellationToken);
            if (!walletCheck.IsSuccess)
            {
                logger.LogWarning("RegisterKycCommand: Thao tác bị chặn. User {UserId} chưa kích hoạt ví điện tử liên kết. Reason: {Reason}", request.UserId, walletCheck.Message);
                return Result<SellerKyc>.Failure(walletCheck.Message ?? "Tài khoản của bạn chưa kích hoạt hoặc đăng ký ví điện tử liên kết. Vui lòng tạo ví trước khi đăng ký làm Người bán hàng.", walletCheck.ErrorCode);
            }

            if (string.IsNullOrWhiteSpace(request.IdentityCardFrontUrl) || string.IsNullOrWhiteSpace(request.IdentityCardBackUrl))
            {
                return Result<SellerKyc>.Failure("Vui lòng cung cấp ảnh mặt trước và mặt sau căn cước công dân.", EErrorCode.InvalidInput);
            }

            var kycRepo = unitOfWork.Repository<SellerKyc, Guid>();

            var existingKyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.UserId,
                cancellationToken: cancellationToken
            );

            if (existingKyc != null)
            {
                if (existingKyc.Status == KycStatus.Verified)
                {
                    return Result<SellerKyc>.Failure("Tài khoản của bạn đã được xác minh làm Người bán hàng.", EErrorCode.Conflict);
                }
                
                if (existingKyc.Status == KycStatus.Submitted && !request.IsDraft)
                {
                    return Result<SellerKyc>.Failure("Hồ sơ xác minh của bạn đang chờ Admin duyệt. Bạn cần rút lại hồ sơ để chỉnh sửa.", EErrorCode.Conflict);
                }
                
                existingKyc.Resubmit(request.IdentityCardNumber, request.IdentityCardFrontUrl, request.IdentityCardBackUrl, request.IsDraft);
                kycRepo.Update(existingKyc);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return Result<SellerKyc>.Success(existingKyc);
            }

            var kyc = new SellerKyc(
                request.UserId,
                request.IdentityCardNumber,
                request.IdentityCardFrontUrl,
                request.IdentityCardBackUrl,
                request.IsDraft);
            kycRepo.Add(kyc);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("RegisterKycCommand: Lưu hồ sơ KYC thành công cho User: {UserId} dưới dạng {Status}.", request.UserId, kyc.Status);
            return Result<SellerKyc>.Success(kyc);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RegisterKycCommand: Lỗi xảy ra khi lưu KYC: {Message}", ex.Message);
            return Result<SellerKyc>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
