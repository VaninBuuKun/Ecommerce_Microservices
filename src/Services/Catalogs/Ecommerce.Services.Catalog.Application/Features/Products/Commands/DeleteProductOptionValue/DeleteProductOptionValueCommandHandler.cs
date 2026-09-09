using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductOptionValue;

public class DeleteProductOptionValueCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ICurrentUserService currentUserService,
    ILogger<DeleteProductOptionValueCommandHandler> logger
) : CommandHandler<DeleteProductOptionValueCommand, bool>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductOptionValue, long> _optionValueRepository = unitOfWork.Repository<ProductOptionValue, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteProductOptionValueCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

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
                    logger.LogWarning("DeleteProductOptionValue: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<bool>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("DeleteProductOptionValue: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<bool>.Failure("Bạn không có quyền chỉnh sửa sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            var option = product.Options.FirstOrDefault(o => o.Id == command.OptionId && !o.IsDeleted);
            if (option == null)
            {
                return Result<bool>.Failure("Không tìm thấy nhóm phân loại.", EErrorCode.NotFound);
            }

            var optionValue = option.Values.FirstOrDefault(v => v.Id == command.ValueId && !v.IsDeleted);
            if (optionValue == null)
            {
                return Result<bool>.Failure("Không tìm thấy giá trị phân loại hoặc đã bị xóa trước đó.", EErrorCode.NotFound);
            }

            // 1. Kiểm tra xem có biến thể nào còn đang hoạt động sử dụng giá trị phân loại này hay không
            var isUsedByActiveVariant = product.Variants.Any(v =>
                !v.IsDeleted &&
                v.VariantOptions.Any(vo => vo.OptionValueId == command.ValueId));

            if (isUsedByActiveVariant)
            {
                logger.LogWarning("DeleteProductOptionValue: OptionValue {ValueId} is currently used by active variants of product {ProductId}", command.ValueId, command.ProductId);
                return Result<bool>.Failure("Không thể xóa giá trị phân loại này vì đang có biến thể sử dụng. Vui lòng xóa hoặc đổi giá trị của biến thể trước.", EErrorCode.Conflict);
            }

            // 2. Soft delete OptionValue
            optionValue.SoftDelete();
            _optionValueRepository.Update(optionValue);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Deleted OptionValue {ValueId} of Option {OptionId}, Product {ProductId}", command.ValueId, command.OptionId, command.ProductId);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting OptionValue {ValueId} of Product {ProductId}", command.ValueId, command.ProductId);
            return Result<bool>.Failure($"Có lỗi xảy ra khi xóa giá trị phân loại: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
