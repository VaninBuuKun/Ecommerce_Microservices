using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Queries.GetShopById;

public record ShopDetailDto(
    long Id,
    long OwnerUserId,
    string Name,
    string Description,
    string? LogoUrl,
    string Status,
    string? RecipientName,
    string? Phone,
    string? Province,
    string? District,
    string? Ward,
    string? AddressLine,
    long? ProvinceId,
    long? DistrictId,
    long? WardId);

public record GetShopByIdQuery(long ShopId, long UserId) : IQuery<ShopDetailDto>;

public class GetShopByIdQueryHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<GetShopByIdQueryHandler> logger)
    : IQueryHandler<GetShopByIdQuery, ShopDetailDto>
{
    public async Task<Result<ShopDetailDto>> Handle(GetShopByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var shop = await shopRepo.GetByIdAsync(request.ShopId, cancellationToken);
            if (shop == null)
            {
                return Result<ShopDetailDto>.Failure("Cửa hàng không tồn tại", EErrorCode.NotFound);
            }

            if (shop.OwnerUserId != request.UserId)
            {
                return Result<ShopDetailDto>.Failure("Bạn không có quyền truy cập cửa hàng này", EErrorCode.Forbidden);
            }

            var dto = new ShopDetailDto(
                shop.Id,
                shop.OwnerUserId,
                shop.Name,
                shop.Description,
                shop.LogoUrl,
                shop.Status.ToString(),
                shop.PickUpAddress?.RecipientName,
                shop.PickUpAddress?.Phone,
                shop.PickUpAddress?.Province,
                shop.PickUpAddress?.District,
                shop.PickUpAddress?.Ward,
                shop.PickUpAddress?.AddressLine,
                shop.PickUpAddress?.ProvinceId,
                shop.PickUpAddress?.DistrictId,
                shop.PickUpAddress?.WardId
            );

            return Result<ShopDetailDto>.Success(dto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "GetShopByIdQuery: Lỗi khi lấy chi tiết Shop: {ShopId} của User: {UserId}", request.ShopId, request.UserId);
            return Result<ShopDetailDto>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
