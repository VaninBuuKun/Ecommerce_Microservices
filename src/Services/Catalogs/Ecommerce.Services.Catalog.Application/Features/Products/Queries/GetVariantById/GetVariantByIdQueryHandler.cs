using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetVariantById;

public class GetVariantByIdQueryHandler(IEfUnitOfWork unitOfWork, IMapper mapper) : QueryHandler<GetVariantByIdQuery, VariantDto>
{
    protected override async Task<Result<VariantDto>> HandleQueryAsync(GetVariantByIdQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var variant = await unitOfWork.Repository<ProductVariant, Guid>()
                .GetByIdAsync(query.VariantId, cancellationToken, v => v.Product);

            if (variant == null)
            {
                return  Result<VariantDto>.Failure("Variant not found", EErrorCode.NotFound);
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