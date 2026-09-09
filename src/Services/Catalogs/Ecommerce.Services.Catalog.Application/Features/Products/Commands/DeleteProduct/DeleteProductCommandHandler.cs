using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;

public class DeleteProductCommandHandler(
    IEfUnitOfWork unitOfWork,
    IOrderService orderService,
    ISellerService sellerService,
    ICurrentUserService currentUserService,
    ILogger<DeleteProductCommandHandler> logger)
    : CommandHandler<DeleteProductCommand, Product>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<Product>> HandleCommandAsync(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var existsProduct = await _productRepository.GetByIdAsync(command.Id, cancellationToken);

            if (existsProduct == null)
            {
                return Result<Product>.Failure("Không tìm thấy sản phẩm cần xóa.", EErrorCode.NotFound);
            }

            // 0. Xác thực quyền sở hữu cửa hàng của sản phẩm (trừ Admin)
            if (!currentUserService.IsAdmin)
            {
                var isOwnerResult = await sellerService.ValidateShopOwnerAsync(existsProduct.ShopId, currentUserService.UserId);
                if (!isOwnerResult.IsSuccess)
                {
                    logger.LogWarning("DeleteProduct: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", existsProduct.ShopId, isOwnerResult.Message);
                    return Result<Product>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("DeleteProduct: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, existsProduct.ShopId);
                    return Result<Product>.Failure("Bạn không có quyền xóa sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            // 1. Kiểm tra qua gRPC xem sản phẩm có SubOrder nào đang hoạt động hay không
            var checkActiveResult = await orderService.CheckProductHasActiveSubOrdersAsync(command.Id, cancellationToken);
            if (!checkActiveResult.IsSuccess)
            {
                logger.LogWarning("Failed to verify active suborders for product {ProductId}: {Message}", 
                    command.Id, checkActiveResult.Message);
                return Result<Product>.Failure(checkActiveResult.Message ?? "Không thể xác minh trạng thái đơn hàng của sản phẩm.", EErrorCode.InternalServerError);
            }

            if (checkActiveResult.Value)
            {
                logger.LogWarning("Cannot delete product {ProductId} because it has active suborders", command.Id);
                return Result<Product>.Failure("Không thể xóa sản phẩm vì hiện đang có đơn hàng chưa hoàn tất liên quan đến sản phẩm này.", EErrorCode.Conflict);
            }

            // 2. Nếu tất cả đơn hàng đều đã hoàn tất/hủy (hoặc chưa từng có đơn hàng), tiến hành xóa vĩnh viễn
            _productRepository.Delete(existsProduct);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Product {ProductId} deleted permanently", command.Id);
            return Result<Product>.Success(existsProduct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi xóa sản phẩm {Id}", command.Id);
            return Result<Product>.ValidationFailure($"Có lỗi xảy ra khi xóa sản phẩm {command.Id}");
        }
    }
}
