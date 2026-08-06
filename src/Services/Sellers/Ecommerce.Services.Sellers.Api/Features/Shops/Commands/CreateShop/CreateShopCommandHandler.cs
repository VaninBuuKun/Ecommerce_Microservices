using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Ecommerce.Services.Sellers.Api.Services;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.CreateShop;

public class CreateShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    IShippingService shippingService,
    ILogger<CreateShopCommandHandler> logger)
    : ICommandHandler<CreateShopCommand, Shop>
{
    public async Task<Result<Shop>> Handle(CreateShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("CreateShopCommand: Tạo Shop mới cho User: {OwnerUserId}, Tên: {Name}", request.OwnerUserId, request.Name);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var kycRepo = unitOfWork.Repository<SellerKyc, Guid>();

            string provinceName = string.Empty;
            string districtName = string.Empty;
            string wardName = string.Empty;

            // var locationResult = await shippingService.GetLocationNamesAsync(
            //     request.ProvinceId, request.DistrictId, request.WardId, cancellationToken);
            //
            // if (locationResult.IsSuccess)
            // {
            //     provinceName = locationResult.Value.ProvinceName;
            //     districtName = locationResult.Value.DistrictName;
            //     wardName = locationResult.Value.WardName;
            // }
            // else
            // {
            //     logger.LogWarning("CreateShopCommand: Giải mã địa chỉ thất bại cho P:{P}, D:{D}, W:{W}. Reason: {Msg}",
            //         request.ProvinceId, request.DistrictId, request.WardId, locationResult.Message);
            //     return Result<Shop>.Failure(locationResult.Message, locationResult.ErrorCode);
            // }

            var userKyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.OwnerUserId,
                cancellationToken: cancellationToken
            );

            if (userKyc == null || userKyc.Status != KycStatus.Verified)
            {
                logger.LogWarning("CreateShopCommand: Thao tác bị chặn. User {OwnerUserId} chưa hoàn tất xác minh người bán hàng (KYC).", request.OwnerUserId);
                return Result<Shop>.Failure("Tài khoản của bạn chưa được xác minh danh tính người bán hàng (KYC). Vui lòng đăng ký KYC trước.", EErrorCode.Forbidden);
            }

            var userShops = await shopRepo.GetAllAsync(
                predicate: s => s.OwnerUserId == request.OwnerUserId,
                cancellationToken: cancellationToken
            );

            if (userShops.Count >= 3)
            {
                logger.LogWarning("CreateShopCommand: User {OwnerUserId} đã đạt giới hạn tối đa 3 Shop.", request.OwnerUserId);
                return Result<Shop>.Failure("Bạn chỉ được phép sở hữu tối đa 3 cửa hàng trên hệ thống.", EErrorCode.Forbidden);
            }

            // var pickUpAddress = new PickUpAddress(
            //     request.RecipientName,
            //     request.Phone,
            //     provinceName,
            //     districtName,
            //     wardName,
            //     request.AddressLine,
            //     request.ProvinceId,
            //     request.DistrictId,
            //     request.WardId
            // );

            var shop = new Shop(
                request.OwnerUserId,
                request.Name,
                request.Description,
                request.LogoUrl
            );

            shopRepo.Add(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("CreateShopCommand: Tạo Shop {ShopId} thành công dưới trạng thái Active.", shop.Id);
            return Result<Shop>.Success(shop);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CreateShopCommand: Lỗi xảy ra khi lưu Shop: {Message}", ex.Message);
            return Result<Shop>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
