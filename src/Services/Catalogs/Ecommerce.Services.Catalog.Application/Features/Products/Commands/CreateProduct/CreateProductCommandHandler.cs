using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Auth;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Commons.Interfaces;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.CreateProduct;

public class CreateProductCommandHandler(
    IEfUnitOfWork unitOfWork,
    ICurrentUserService currentUserService,
    ISellerService sellerService,
    ILogger<CreateProductCommandHandler> logger, IMapper mapper)
    : CommandHandler<CreateProductCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _productVariantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(CreateProductCommand command, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Xác thực xem User hiện tại có thực sự sở hữu ShopId này hay không qua Interface trừu tượng
            var isOwnerResult = await sellerService.ValidateShopOwnerAsync(command.ShopId, currentUserService.UserId);
            if (!isOwnerResult.IsSuccess)
            {
                logger.LogWarning("CreateProduct: Lỗi hoặc không hợp lệ khi kiểm tra Shop {ShopId}. Error: {Message}", command.ShopId, isOwnerResult.Message);
                return Result<ProductResponse>.Failure(isOwnerResult.Message ?? "Bạn không có quyền quản lý cửa hàng này.", isOwnerResult.ErrorCode);
            }

            if (!isOwnerResult.Value)
            {
                logger.LogWarning("CreateProduct: User {UserId} không có quyền sở hữu Shop {ShopId}.", currentUserService.UserId, command.ShopId);
                return Result<ProductResponse>.Failure("Bạn không có quyền quản lý hoặc thêm sản phẩm cho cửa hàng này.", EErrorCode.Forbidden);
            }

            var product = Product.CreateNewProduct(
                command.ShopId,
                command.Name,
                command.Description,
                command.thumbnailUrl,
                0,
                0,
                0,
                0
            );

            _productRepository.Add(product);
            
            
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            var response = mapper.Map<ProductResponse>(product);
            
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi thêm sản phẩm: {Name}", command.Name);
            return Result<ProductResponse>.Failure("Có lỗi xảy ra khi thêm sản phẩm", EErrorCode.InternalServerError);
        }
    }
}
