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

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProductOption;

public class DeleteProductOptionCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ICurrentUserService currentUserService,
    ILogger<DeleteProductOptionCommandHandler> logger
) : CommandHandler<DeleteProductOptionCommand, bool>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductOption, long> _optionRepository = unitOfWork.Repository<ProductOption, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(DeleteProductOptionCommand command, CancellationToken cancellationToken)
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
                    logger.LogWarning("DeleteProductOption: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<bool>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("DeleteProductOption: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<bool>.Failure("Bạn không có quyền chỉnh sửa sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            var option = product.Options.FirstOrDefault(o => o.Id == command.OptionId && !o.IsDeleted);
            if (option == null)
            {
                return Result<bool>.Failure("Không tìm thấy nhóm phân loại hoặc đã bị xóa trước đó.", EErrorCode.NotFound);
            }

            var optionValueIds = option.Values.Where(v => !v.IsDeleted).Select(v => v.Id).ToHashSet();

            // 1. Kiểm tra xem có biến thể nào còn đang hoạt động sử dụng các giá trị của nhóm phân loại này hay không
            var isUsedByActiveVariant = product.Variants.Any(v =>
                !v.IsDeleted &&
                v.VariantOptions.Any(vo => optionValueIds.Contains(vo.OptionValueId)));

            if (isUsedByActiveVariant)
            {
                logger.LogWarning("DeleteProductOption: Option {OptionId} is currently used by active variants of product {ProductId}", command.OptionId, command.ProductId);
                return Result<bool>.Failure("Không thể xóa nhóm phân loại này vì đang có biến thể sử dụng. Vui lòng xóa các biến thể liên quan trước.", EErrorCode.Conflict);
            }

            // 2. Soft delete hoặc hard delete Option & Values
            option.SoftDelete();
            foreach (var val in option.Values.Where(v => !v.IsDeleted))
            {
                val.SoftDelete();
            }

            _optionRepository.Update(option);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Deleted Option {OptionId} of Product {ProductId}", command.OptionId, command.ProductId);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting Option {OptionId} of Product {ProductId}", command.OptionId, command.ProductId);
            return Result<bool>.Failure($"Có lỗi xảy ra khi xóa nhóm phân loại: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
