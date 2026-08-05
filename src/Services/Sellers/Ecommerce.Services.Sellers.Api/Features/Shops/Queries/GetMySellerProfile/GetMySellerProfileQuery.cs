using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Features.Kycs.Queries.GetMyKyc;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetMySellerProfile;

public record ShopDto(
    long Id,
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl,
    string Status,
    string RecipientName,
    string Phone,
    string AddressLine,
    long ProvinceId,
    long DistrictId,
    long WardId);

public record SellerProfileDto(
    SellerKycDto? Kyc,
    List<ShopDto> Shops);

public record GetMySellerProfileQuery(long UserId) : IQuery<SellerProfileDto>;

public class GetMySellerProfileQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetMySellerProfileQueryHandler> logger)
    : IQueryHandler<GetMySellerProfileQuery, SellerProfileDto>
{
    public async Task<Result<SellerProfileDto>> Handle(GetMySellerProfileQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Lấy thông tin KYC của User
            var kycRepo = unitOfWork.Repository<SellerKyc, Guid>();
            var kyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.UserId,
                cancellationToken: cancellationToken
            );

            SellerKycDto? kycDto = kyc == null ? null : new SellerKycDto(
                kyc.Id,
                kyc.UserId,
                kyc.IdentityCardNumber,
                kyc.IdentityCardFrontUrl,
                kyc.IdentityCardBackUrl,
                kyc.Status.ToString(),
                kyc.RejectReason,
                kyc.VerifiedDate);

            // 2. Lấy danh sách Shop của User
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shops = (await shopRepo.GetAllAsync(s => s.OwnerUserId == request.UserId))
                .Select(s => new ShopDto(
                    s.Id,
                    s.OwnerUserId,
                    s.Name,
                    s.Description,
                    s.LogoUrl,
                    s.Status.ToString(),
                    s.PickUpAddress.RecipientName,
                    s.PickUpAddress.Phone,
                    s.PickUpAddress.AddressLine,
                    s.PickUpAddress.ProvinceId,
                    s.PickUpAddress.DistrictId,
                    s.PickUpAddress.WardId)).ToList();

            var profileDto = new SellerProfileDto(kycDto, shops);
            return Result<SellerProfileDto>.Success(profileDto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetMySellerProfileQuery: Lỗi khi lấy thông tin profile người bán của User: {UserId}", request.UserId);
            return Result<SellerProfileDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
