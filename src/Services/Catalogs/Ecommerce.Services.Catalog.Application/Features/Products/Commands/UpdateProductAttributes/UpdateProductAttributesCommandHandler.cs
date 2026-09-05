using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProductAttributes;

public class UpdateProductAttributesCommandHandler(
    IEfUnitOfWork unitOfWork,
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
                return Result<bool>.Failure("Không tìm thấy sản phẩm", EErrorCode.NotFound);
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
