using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetPublicShopById;

public record PublicShopDetailDto(
    long Id,
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl,
    string Status,
    string? PickUpAddressProvince,
    string? PickUpAddressDistrict,
    string? PickUpAddressWard);

public record GetPublicShopByIdQuery(long ShopId) : IQuery<PublicShopDetailDto>;

public class GetPublicShopByIdQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetPublicShopByIdQueryHandler> logger)
    : IQueryHandler<GetPublicShopByIdQuery, PublicShopDetailDto>
{
    public async Task<Result<PublicShopDetailDto>> Handle(GetPublicShopByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shop = await shopRepo.GetByIdAsync(request.ShopId, cancellationToken);
            if (shop == null)
            {
                return Result<PublicShopDetailDto>.Failure("Cửa hàng không tồn tại", EErrorCode.NotFound);
            }

            var dto = new PublicShopDetailDto(
                shop.Id,
                shop.OwnerUserId,
                shop.Name,
                shop.Description,
                shop.LogoUrl,
                shop.Status.ToString(),
                shop.PickUpAddress?.Province,
                shop.PickUpAddress?.District,
                shop.PickUpAddress?.Ward
            );

            return Result<PublicShopDetailDto>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetPublicShopByIdQuery: Lỗi khi lấy chi tiết Shop Public: {ShopId}", request.ShopId);
            return Result<PublicShopDetailDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
