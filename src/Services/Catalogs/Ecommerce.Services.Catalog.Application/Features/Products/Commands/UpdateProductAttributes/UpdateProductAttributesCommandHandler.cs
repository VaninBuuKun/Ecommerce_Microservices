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
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductAttributes;

public class UpdateProductAttributesCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ICurrentUserService currentUserService,
    ILogger<UpdateProductAttributesCommandHandler> logger)
    : CommandHandler<UpdateProductAttributesCommand, bool>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<bool>> HandleCommandAsync(UpdateProductAttributesCommand command, CancellationToken cancellationToken)
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
                    logger.LogWarning("UpdateProductAttributes: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<bool>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("UpdateProductAttributes: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<bool>.Failure("Bạn không có quyền chỉnh sửa sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }

            // Validate AttributesJson nếu có
            if (!string.IsNullOrWhiteSpace(command.AttributesJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(command.AttributesJson);
                    if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var item in doc.RootElement.EnumerateArray())
                        {
                            var hasKey = (item.TryGetProperty("key", out var kProp) || item.TryGetProperty("Key", out kProp)) && !string.IsNullOrWhiteSpace(kProp.GetString());
                            var hasValue = (item.TryGetProperty("value", out var vProp) || item.TryGetProperty("Value", out vProp)) && !string.IsNullOrWhiteSpace(vProp.GetString());

                            if (!hasKey || !hasValue)
                            {
                                return Result<bool>.ValidationFailure("Thuộc tính sản phẩm không hợp lệ. Mỗi thuộc tính phải có đầy đủ tên (key) và giá trị (value).");
                            }
                        }
                    }
                }
                catch (System.Text.Json.JsonException)
                {
                    return Result<bool>.ValidationFailure("Định dạng dữ liệu thuộc tính sản phẩm không hợp lệ.");
                }
            }

            product.SetAttributes(command.AttributesJson);
            product.RebuildSearchDocument(product.Category?.Name);
            _productRepository.Update(product);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi cập nhật thuộc tính sản phẩm {ProductId}", command.ProductId);
            return Result<bool>.Failure("Có lỗi xảy ra khi cập nhật thuộc tính sản phẩm", EErrorCode.InternalServerError);
        }
    }
}
