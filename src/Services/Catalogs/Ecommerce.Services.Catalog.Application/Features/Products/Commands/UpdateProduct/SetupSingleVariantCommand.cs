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
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Commands.UpdateProduct;

public record SetupSingleVariantCommand(
    Guid ProductId,
    decimal Price,
    int AvailableStocks,
    string? Sku = null,
    double? Weight = null,
    double? Length = null,
    double? Width = null,
    double? Height = null
) : ICommand<ProductResponse>;

public class SetupSingleVariantCommandHandler(
    IEfUnitOfWork unitOfWork,
    ILogger<SetupSingleVariantCommandHandler> logger,
    IMapper mapper
) : CommandHandler<SetupSingleVariantCommand, ProductResponse>
{
    private readonly IGenericEfRepository<Product, Guid> _productRepository = unitOfWork.Repository<Product, Guid>();
    private readonly IGenericEfRepository<ProductVariant, Guid> _variantRepository = unitOfWork.Repository<ProductVariant, Guid>();

    protected override async Task<Result<ProductResponse>> HandleCommandAsync(SetupSingleVariantCommand command, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new ProductWithVariantsAndOptionsSpec(command.ProductId);
            var product = await _productRepository.FirstOrDefaultAsync(spec, cancellationToken);

            if (product == null)
            {
                return Result<ProductResponse>.Failure("Product Not Found", EErrorCode.NotFound);
            }

            // 1. Soft delete all existing variants and options
            product.ClearVariantsAndOptions();

            // 2. Add single default variant
            var defaultVariant = product.AddVariant(
                command.Sku,
                command.Price,
                command.AvailableStocks,
                new List<Guid>(), // No options
                command.Weight ?? 0,
                command.Length ?? 0,
                command.Width ?? 0,
                command.Height ?? 0
            );

            _variantRepository.Add(defaultVariant);
            _productRepository.Update(product);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            var response = mapper.Map<ProductResponse>(product);
            return Result<ProductResponse>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error configuring single variant product {ProductId}", command.ProductId);
            return Result<ProductResponse>.ValidationFailure(ex.Message);
        }
    }
}
