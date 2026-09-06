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

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductVariant;

public class DeleteProductVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    IOrderService orderService,
    ICurrentUserService currentUserService,
    ILogger<DeleteProductVariantCommandHandler> logger
) : CommandHandler<DeleteProductVariantCommand, bool>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteProductVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productRepository.FirstOrDefaultAsync(
                p => p.Id == command.ProductId,
                cancellationToken: cancellationToken,
                includes: [p => p.Variants]);

            if (product == null)
            {
                return Result<bool>.Failure("Không tìm thấy thông tin sản phẩm.", EErrorCode.NotFound);
            }

            // 0. Xác thực quyền sở hữu cửa hàng của sản phẩm (trừ Admin)
            if (!currentUserService.IsAdmin)
            {
                var isOwnerResult = await sellerService.ValidateShopOwnerAsync(product.ShopId, currentUserService.UserId);
                if (!isOwnerResult.IsSuccess)
                {
                    logger.LogWarning("DeleteProductVariant: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<bool>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("DeleteProductVariant: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<bool>.Failure("Bạn không có quyền xóa biến thể sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            var variant = product.Variants.FirstOrDefault(v => v.Id == command.VariantId);
            if (variant == null || variant.IsDeleted)
            {
                return Result<bool>.Failure("Không tìm thấy biến thể hoặc biến thể đã bị xóa.", EErrorCode.NotFound);
            }

            // 1. Kiểm tra đơn hàng liên quan qua gRPC sang Orders service
            var orderCheck = await orderService.CheckVariantOrdersAsync(command.VariantId, cancellationToken);
            if (!orderCheck.IsSuccess)
            {
                logger.LogWarning("DeleteProductVariant: Lỗi khi kiểm tra đơn hàng cho Variant {VariantId}. Error: {Message}", command.VariantId, orderCheck.Message);
                return Result<bool>.Failure(orderCheck.Message ?? "Không thể kiểm tra đơn hàng của biến thể.", orderCheck.ErrorCode);
            }

            if (orderCheck.Value.HasActiveOrders)
            {
                logger.LogWarning("DeleteProductVariant: Biến thể {VariantId} có đơn hàng đang hoạt động, chặn xóa.", command.VariantId);
                return Result<bool>.Failure("Không thể xóa biến thể vì hiện đang có đơn hàng chưa hoàn tất liên quan đến biến thể này.", EErrorCode.Conflict);
            }

            // 2. Nếu chưa từng có bất kỳ đơn hàng nào -> Hard Delete
            if (!orderCheck.Value.HasAnyOrders)
            {
                logger.LogInformation("DeleteProductVariant: Biến thể {VariantId} chưa từng phát sinh đơn hàng -> Tiến hành XÓA VĨNH VIỄN (Hard Delete).", command.VariantId);
                _variantRepository.Remove(variant);
            }
            else
            {
                // 3. Nếu đã có đơn hàng lịch sử (đều đã kết thúc) -> Soft Delete
                logger.LogInformation("DeleteProductVariant: Biến thể {VariantId} có đơn hàng lịch sử -> Tiến hành XÓA MỀM (Soft Delete).", command.VariantId);
                variant.SoftDelete();
                _variantRepository.Update(variant);
            }

            product.RecalculateCachedPrices();
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting variant {VariantId}", command.VariantId);
            return Result<bool>.Failure($"Có lỗi xảy ra khi xóa biến thể: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
