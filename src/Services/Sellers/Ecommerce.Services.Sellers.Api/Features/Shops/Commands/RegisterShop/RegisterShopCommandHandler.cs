using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Sellers.Api.Models.Entities;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Sellers.Api.Features.Shops.Commands.RegisterShop;

public class RegisterShopCommandHandler(
    IEfUnitOfWork unitOfWork,
    BuildingBlocks.Grpc.Services.ShippingGrpc.ShippingGrpcClient shippingGrpcClient,
    ILogger<RegisterShopCommandHandler> logger)
    : ICommandHandler<RegisterShopCommand, Shop>
{
    public async Task<Result<Shop>> Handle(RegisterShopCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("RegisterShopCommand: Đăng ký Shop mới cho User: {OwnerUserId}, Tên: {Name}", request.OwnerUserId, request.Name);

        try
        {
            var shopRepo = unitOfWork.Repository<Shop, long>();
            var kycRepo = unitOfWork.Repository<SellerKyc, Guid>();

            // Phân giải địa giới hành chính bằng gRPC
            string provinceName = string.Empty;
            string districtName = string.Empty;
            string wardName = string.Empty;

            try
            {
                var locationResponse = await shippingGrpcClient.GetLocationNamesAsync(new BuildingBlocks.Grpc.Services.GetLocationNamesRequest
                {
                    ProvinceId = request.ProvinceId,
                    DistrictId = request.DistrictId,
                    WardCode = request.WardCode
                }, cancellationToken: cancellationToken);

                if (locationResponse != null && locationResponse.IsValid)
                {
                    provinceName = locationResponse.ProvinceName;
                    districtName = locationResponse.DistrictName;
                    wardName = locationResponse.WardName;
                }
                else
                {
                    logger.LogWarning("RegisterShopCommand: Shipping gRPC trả về Invalid cho các IDs: P:{P}, D:{D}, W:{W}", 
                        request.ProvinceId, request.DistrictId, request.WardCode);
                    return Result<Shop>.Failure("Địa chỉ (Tỉnh/Huyện/Xã) không hợp lệ trên hệ thống vận chuyển.", EErrorCode.InvalidArgument);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "RegisterShopCommand: Không thể kết nối đến Shipping Service gRPC để lấy thông tin địa chỉ.");
                return Result<Shop>.Failure("Không thể kết nối đến hệ thống xác thực địa chỉ vận chuyển.", EErrorCode.InternalServerError);
            }

            // 1. Kiểm tra trạng thái xác minh KYC của User
            var userKyc = await kycRepo.FirstOrDefaultAsync(
                predicate: k => k.UserId == request.OwnerUserId,
                cancellationToken: cancellationToken
            );

            if (userKyc == null || userKyc.Status != KycStatus.Verified)
            {
                logger.LogWarning("RegisterShopCommand: Thao tác bị chặn. User {OwnerUserId} chưa hoàn tất xác minh người bán hàng (KYC).", request.OwnerUserId);
                return Result<Shop>.Failure("Tài khoản của bạn chưa được xác minh danh tính người bán hàng (KYC). Vui lòng đăng ký KYC trước.", EErrorCode.Forbidden);
            }

            // 2. Kiểm tra số lượng Shop hiện tại của User (Giới hạn tối đa 3 Shop)
            var userShops = await shopRepo.GetAllAsync(
                predicate: s => s.OwnerUserId == request.OwnerUserId,
                cancellationToken: cancellationToken
            );

            if (userShops.Count >= 3)
            {
                logger.LogWarning("RegisterShopCommand: User {OwnerUserId} đã đạt giới hạn tối đa 3 Shop.", request.OwnerUserId);
                return Result<Shop>.Failure("Bạn chỉ được phép sở hữu tối đa 3 cửa hàng trên hệ thống.", EErrorCode.Forbidden);
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
                request.WardCode
            );

            // Khởi tạo thực thể Shop
            var shop = new Shop(
                request.OwnerUserId,
                request.Name,
                request.Description,
                pickUpAddress
            );

            shopRepo.Add(shop);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("RegisterShopCommand: Đăng ký Shop {ShopId} thành công dưới trạng thái Pending.", shop.Id);
            return Result<Shop>.Success(shop);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RegisterShopCommand: Lỗi xảy ra khi lưu Shop: {Message}", ex.Message);
            return Result<Shop>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
