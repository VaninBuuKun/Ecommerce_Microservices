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
    IPaymentService paymentService,
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

            // RÀNG BUỘC: Kiểm tra ví đã được kích hoạt hay chưa
            var walletCheck = await paymentService.CheckShopWalletAsync(request.OwnerUserId, cancellationToken);
            if (!walletCheck.IsSuccess)
            {
                logger.LogWarning("CreateShopCommand: Thao tác bị chặn. User {OwnerUserId} chưa kích hoạt ví điện tử liên kết. Reason: {Reason}", request.OwnerUserId, walletCheck.Message);
                return Result<Shop>.Failure(walletCheck.Message ?? "Tài khoản của bạn chưa kích hoạt hoặc đăng ký ví điện tử liên kết.", walletCheck.ErrorCode);
            }
            
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
