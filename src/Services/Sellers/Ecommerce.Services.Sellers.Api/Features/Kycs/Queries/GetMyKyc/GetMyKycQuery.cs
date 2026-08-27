using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Kycs.Queries.GetMyKyc;

public record SellerKycDto(
    long Id,
    long UserId,
    string IdentityCardNumber,
    string IdentityCardFrontUrl,
    string IdentityCardBackUrl,
    string Status,
    string? RejectReason,
    DateTimeOffset? VerifiedDate);

public record GetMyKycQuery(long UserId) : IQuery<SellerKycDto?>;

public class GetMyKycQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetMyKycQueryHandler> logger)
    : IQueryHandler<GetMyKycQuery, SellerKycDto?>
{
    public async Task<Result<SellerKycDto?>> Handle(GetMyKycQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var kycRepo = unitOfWork.Repository<SellerKyc, long>();
            var kyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.UserId,
                cancellationToken: cancellationToken
            );

            if (kyc == null)
            {
                return Result<SellerKycDto?>.Success(null);
            }

            var dto = new SellerKycDto(
                kyc.Id,
                kyc.UserId,
                kyc.IdentityCardNumber,
                kyc.IdentityCardFrontUrl,
                kyc.IdentityCardBackUrl,
                kyc.Status.ToString(),
                kyc.RejectReason,
                kyc.VerifiedDate);

            return Result<SellerKycDto?>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetMyKycQuery: Lỗi khi truy vấn KYC cho User: {UserId}", request.UserId);
            return Result<SellerKycDto?>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
