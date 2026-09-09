using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ToggleProductStatus;

public class ToggleProductStatusCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    IPaymentService paymentService,
    IOrderService orderService,
    ICurrentUserService currentUserService,
    ILogger<ToggleProductStatusCommandHandler> logger,
    IMapper mapper
) : CommandHandler<ToggleProductStatusCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(ToggleProductStatusCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Không tìm thấy thông tin sản phẩm.", EErrorCode.NotFound);
            }

            // 0. Xác thực xem User hiện tại có thực sự sở hữu Shop của sản phẩm hay không (trừ Admin)
            if (!currentUserService.IsAdmin)
            {
                var isOwnerResult = await sellerService.ValidateShopOwnerAsync(product.ShopId, currentUserService.UserId);
                if (!isOwnerResult.IsSuccess)
                {
                    logger.LogWarning("ToggleProductStatus: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<ProductResponse>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("ToggleProductStatus: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<ProductResponse>.Failure("Bạn không có quyền thao tác trên sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            if (product.Status == ProductStatus.Active)
            {
                // 1. Seller muốn gỡ / ẩn sản phẩm (chuyển sang Inactive):
                // Kiểm tra xem sản phẩm có SubOrder nào đang hoạt động hay không
                var checkActiveResult = await orderService.CheckProductHasActiveSubOrdersAsync(command.ProductId, cancellationToken);
                if (!checkActiveResult.IsSuccess)
                {
                    logger.LogWarning("Failed to verify active suborders when deactivating product {ProductId}: {Message}", 
                        command.ProductId, checkActiveResult.Message);
                    return Result<ProductResponse>.Failure(checkActiveResult.Message ?? "Không thể xác minh trạng thái đơn hàng của sản phẩm.", EErrorCode.InternalServerError);
                }

                if (checkActiveResult.Value)
                {
                    logger.LogWarning("Cannot deactivate product {ProductId} because it has active suborders", command.ProductId);
                    return Result<ProductResponse>.Failure("Không thể ẩn sản phẩm vì hiện đang có đơn hàng chưa hoàn tất liên quan đến sản phẩm này.", EErrorCode.Conflict);
                }

                product.Deactivate();
                logger.LogInformation("Product {ProductId} deactivated successfully", command.ProductId);
            }
            else
            {
                // 2. Seller muốn kích hoạt lại sản phẩm (chuyển sang Active):
                // Lấy thông tin Shop để tìm OwnerUserId
                var shopInfoResult = await sellerService.GetShopShippingInfoAsync(product.ShopId);

                if (!shopInfoResult.IsSuccess || shopInfoResult.Value == null)
                {
                    return Result<ProductResponse>.Failure(shopInfoResult.Message ?? "Không tìm thấy thông tin cửa hàng.", EErrorCode.NotFound);
                }

                var shopInfo = shopInfoResult.Value;

                // Gọi sang Payments Service kiểm tra ví qua gRPC/Interface
                var walletCheckResult = await paymentService.CheckShopWalletAsync(shopInfo.OwnerUserId);

                if (!walletCheckResult.IsSuccess || !walletCheckResult.Value)
                {
                    return Result<ProductResponse>.Failure("Cửa hàng chưa kích hoạt ví điện tử liên kết. Vui lòng kích hoạt ví trước khi kích hoạt sản phẩm lên hoạt động.", EErrorCode.ValidationErrors);
                }

                product.Activate();
                logger.LogInformation("Product {ProductId} activated successfully", command.ProductId);
            }

            _productRepository.Update(product);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error toggling product status for {ProductId}", command.ProductId);
            return Result<ProductResponse>.Failure(ex.Message, EErrorCode.InternalServerError);
        }
    }
}
