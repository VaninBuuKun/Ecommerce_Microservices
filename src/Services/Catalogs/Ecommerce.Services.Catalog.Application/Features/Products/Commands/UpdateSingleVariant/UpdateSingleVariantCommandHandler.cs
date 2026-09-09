using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.IdGenerator;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateSingleVariant;

public class UpdateSingleVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ISellerService sellerService,
    ICurrentUserService currentUserService,
    ILogger<UpdateSingleVariantCommandHandler> logger, 
    IMapper mapper,
    ISnowflakeIdGenerator snowflakeIdGenerator
) : CommandHandler<UpdateSingleVariantCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<ProductVariant, long> _variantRepository = unitOfWork.Repository<ProductVariant, long>();
    private readonly IGenericEfRepository<ProductOption, long> _optionRepository = unitOfWork.Repository<ProductOption, long>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(UpdateSingleVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productRepository.FirstOrDefaultAsync(
                p => p.Id == command.ProductId, 
                cancellationToken: cancellationToken, 
                includes: [p => p.Options, p => p.Variants]);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Không tìm thấy sản phẩm trong hệ thống.", EErrorCode.NotFound);
            }

            // 0. Xác thực quyền sở hữu cửa hàng của sản phẩm (trừ Admin)
            if (!currentUserService.IsAdmin)
            {
                var isOwnerResult = await sellerService.ValidateShopOwnerAsync(product.ShopId, currentUserService.UserId);
                if (!isOwnerResult.IsSuccess)
                {
                    logger.LogWarning("UpdateSingleVariant: Lỗi khi kiểm tra Shop {ShopId}. Error: {Message}", product.ShopId, isOwnerResult.Message);
                    return Result<ProductResponse>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
                }

                if (!isOwnerResult.Value)
                {
                    logger.LogWarning("UpdateSingleVariant: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, product.ShopId);
                    return Result<ProductResponse>.Failure("Bạn không có quyền chỉnh sửa sản phẩm của cửa hàng này.", EErrorCode.Forbidden);
                }
            }
            
            // 1. Nếu trước đó là Multi-variants -> Soft delete toàn bộ Options cũ
            var activeOptions = product.Options.Where(o => !o.IsDeleted).ToList();
            foreach (var opt in activeOptions)
            {
                opt.SoftDelete();
                _optionRepository.Update(opt);
            }

            // 2. Soft delete các biến thể đa thuộc tính cũ (Multi-variants)
            var multiVariants = product.Variants.Where(v => !v.IsDeleted && v.VariantOptions.Any()).ToList();
            foreach (var mv in multiVariants)
            {
                mv.SoftDelete();
                _variantRepository.Update(mv);
            }

            // 3. Đảm bảo và cập nhật Default Variant đại diện duy nhất
            var defaultVariant = product.Variants.FirstOrDefault(v => !v.IsDeleted);
            if (defaultVariant != null)
            {
                defaultVariant.UpdateDetails(
                    command.Price, 
                    command.AvailableStock, 
                    command.DiscountPrice
                );
                _variantRepository.Update(defaultVariant);
            }
            else
            {
                defaultVariant = product.AddVariant(
                    command.Price, 
                    command.AvailableStock, 
                    command.DiscountPrice
                );
                defaultVariant.Id = snowflakeIdGenerator.NewId();
                _variantRepository.Add(defaultVariant);
            }

            // 4. Cập nhật thông số kích thước & giá cấp Product
            product.UpdatePricingAndShipping(
                command.Weight, 
                command.Length, 
                command.Width, 
                command.Height, 
                command.Price, 
                command.DiscountPrice ?? command.Price
            );

            product.RecalculateCachedPrices();
            product.RebuildSearchDocument(product.Category?.Name);
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi cập nhật sản phẩm đơn {ProductId}", command.ProductId);
            return Result<ProductResponse>.Failure($"Có lỗi xảy ra khi cập nhật sản phẩm đơn: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
