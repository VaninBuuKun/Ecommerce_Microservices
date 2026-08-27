using System;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;

public class GetVariantByIdQueryHandler(IEfUnitOfWork unitOfWork, IMapper mapper) : QueryHandler<GetVariantByIdQuery, VariantDto>
{
    protected override async Task<Result<VariantDto>> HandleQueryAsync(GetVariantByIdQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new VariantByIdWithProductAndOptionsSpec(query.VariantId);
            var variant = await unitOfWork.Repository<ProductVariant, long>()
                .FirstOrDefaultAsync(spec, cancellationToken);

            if (variant == null)
            {
                var product = await unitOfWork.Repository<Product, long>().GetByIdAsync(query.VariantId, cancellationToken);
                if (product != null)
                {
                    var productDto = mapper.Map<VariantDto>(product);
                    return Result<VariantDto>.Success(productDto);
                }
                return Result<VariantDto>.Failure("Variant not found", EErrorCode.NotFound);
            }
            var response = mapper.Map<VariantDto>(variant);
        
            return Result<VariantDto>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<VariantDto>.ValidationFailure(ex.Message);
        }
    }
}