using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(Guid Id, string Name, string Description) : ICommand<ProductResponse>;

public class UpdateProductCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<UpdateProductCommandHandler> logger, IMapper mapper)
    : CommandHandler<UpdateProductCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var existsProduct = await _productRepository.GetByIdAsync(command.Id, cancellationToken);

            if (existsProduct == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            existsProduct.UpdateDetails(command.Name, command.Description);

            _productRepository.Update(existsProduct);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            
            var response = mapper.Map<ProductResponse>(existsProduct);

            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi cập nhật sản phẩm {Id}", command.Id);
            return Result<ProductResponse>.ValidationFailure($"Có lỗi xảy ra khi cập nhật sản phẩm {command.Id}");
        }
    }
}
