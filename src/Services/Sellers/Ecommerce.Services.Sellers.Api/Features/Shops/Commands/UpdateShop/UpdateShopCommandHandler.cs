using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Services;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.UpdateShop;

public class UpdateShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    IShippingService shippingService,
    ILogger<UpdateShopCommandHandler> logger)
    : ICommandHandler<UpdateShopCommand, Shop>
{
    public async Task<Result<Shop>> Handle(UpdateShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("UpdateShopCommand: Cập nhật Shop: {ShopId} cho User: {OwnerUserId}", request.ShopId, request.OwnerUserId);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();

            var shop = await shopRepo.FirstOrDefaultAsync(
                predicate: s => s.Id == request.ShopId,
                cancellationToken: cancellationToken
            );

            if (shop == null)
            {
                logger.LogWarning("UpdateShopCommand: Không tìm thấy Shop {ShopId}", request.ShopId);
                return Result<Shop>.Failure("Không tìm thấy thông tin cửa hàng.", EErrorCode.NotFound);
            }

            if (shop.OwnerUserId != request.OwnerUserId)
            {
                logger.LogWarning("UpdateShopCommand: Thao tác bị từ chối. User {UserId} không sở hữu Shop {ShopId}", request.OwnerUserId, request.ShopId);
                return Result<Shop>.Failure("Bạn không có quyền chỉnh sửa cửa hàng này.", EErrorCode.Forbidden);
            }

            string provinceName = string.Empty;
            string districtName = string.Empty;
            string wardName = string.Empty;

            var locationResult = await shippingService.GetLocationNamesAsync(
                request.ProvinceId, request.DistrictId, request.WardId, cancellationToken);

            if (locationResult.IsSuccess)
            {
                provinceName = locationResult.Value.ProvinceName;
                districtName = locationResult.Value.DistrictName;
                wardName = locationResult.Value.WardName;
            }
            else
            {
                logger.LogWarning("UpdateShopCommand: Lấy địa chỉ thất bại cho P:{P}, D:{D}, W:{W}. Reason: {Msg}",
                    request.ProvinceId, request.DistrictId, request.WardId, locationResult.Message);
                return Result<Shop>.Failure(locationResult.Message, locationResult.ErrorCode);
            }

            var pickUpAddress = new PickUpAddress(
                request.RecipientName,
                request.Phone,
                provinceName,
                districtName,
                wardName,
                request.AddressLine,
                request.ProvinceId,
                request.DistrictId,
                request.WardId
            );

            shop.Name = request.Name;
            shop.Description = request.Description;
            shop.LogoUrl = request.LogoUrl;
            shop.PickUpAddress = pickUpAddress;

            shopRepo.Update(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("UpdateShopCommand: Cập nhật Shop {ShopId} thành công.", shop.Id);
            return Result<Shop>.Success(shop);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "UpdateShopCommand: Lỗi khi lưu Shop: {Message}", ex.Message);
            return Result<Shop>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
