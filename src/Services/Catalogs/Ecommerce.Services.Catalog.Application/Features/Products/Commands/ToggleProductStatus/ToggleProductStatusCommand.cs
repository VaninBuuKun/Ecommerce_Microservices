using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.ToggleProductStatus;

public record ToggleProductStatusCommand(Guid ProductId) : ICommand<ProductResponse>;

public class ToggleProductStatusCommandHandler(
    IEfUnitOfWork unitOfWork,
    Ecommerce.Services.Catalog.Application.Commons.Interfaces.ISellerService sellerService,
    Ecommerce.Services.Catalog.Application.Commons.Interfaces.IPaymentService paymentService,
    ILogger<ToggleProductStatusCommandHandler> logger,
    IMapper mapper
) : CommandHandler<ToggleProductStatusCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(ToggleProductStatusCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            if (product.Status == ProductStatus.Active)
            {
                product.Deactivate();
            }
            else
            {
                // Lấy thông tin Shop để tìm OwnerUserId
                var shopInfoResult = await sellerService.GetShopShippingInfoAsync(product.ShopId);

                if (!shopInfoResult.IsSuccess || shopInfoResult.Value == null)
                {
                    return Result<ProductResponse>.Failure(shopInfoResult.Message ?? "Không tìm thấy thông tin cửa hàng.", EErrorCode.NotFound);
                }

                var shopInfo = shopInfoResult.Value;

                // Gọi sang Payments Service kiểm tra ví qua Interface
                var walletCheckResult = await paymentService.CheckShopWalletAsync(shopInfo.OwnerUserId);

                if (!walletCheckResult.IsSuccess || !walletCheckResult.Value)
                {
                    return Result<ProductResponse>.Failure("Cửa hàng chưa kích hoạt ví điện tử liên kết. Vui lòng kích hoạt ví trước khi kích hoạt sản phẩm lên hoạt động.", EErrorCode.ValidationErrors);
                }

                product.Activate();
            }

            _productRepository.Update(product);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error toggling product status for {ProductId}", command.ProductId);
            return Result<ProductResponse>.ValidationFailure(ex.Message);
        }
    }
}
