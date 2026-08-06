using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Domain.Products;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.DeleteProduct;

public class DeleteProductCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<DeleteProductCommandHandler> logger)
    : CommandHandler<DeleteProductCommand, Product>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private CommandHandler<DeleteProductCommand, Product> _commandHandlerImplementation;
    protected override async Task<Result<Product>> HandleCommandAsync(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var existsProduct = await _productRepository.GetByIdAsync(command.Id, cancellationToken);

            if (existsProduct == null)
            {
                return Result<Product>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            _productRepository.Delete(existsProduct);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            return Result<Product>.Success(existsProduct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi xóa sản phẩm {Id}", command.Id);
            return Result<Product>.ValidationFailure($"Có lỗi xảy ra khi xóa sản phẩm {command.Id}");
        }
    }
}
