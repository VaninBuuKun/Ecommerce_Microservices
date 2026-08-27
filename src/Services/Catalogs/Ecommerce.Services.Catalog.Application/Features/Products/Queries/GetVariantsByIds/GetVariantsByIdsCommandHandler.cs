using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.InMemoryBus;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries;

public class GetVariantsByIdsCommandHandler(IEfUnitOfWork unitOfWork, IMapper mapper) : IRequestHandler<GetVariantsByIdsQuery, Result<List<VariantDto>>>
{
    public async Task<Result<List<VariantDto>>> Handle(GetVariantsByIdsQuery request, CancellationToken cancellationToken)
    {
        var productVariantRepository = unitOfWork.Repository<ProductVariant, long>();
        var productRepository = unitOfWork.Repository<Product, long>();
        
        var results = new List<VariantDto>();

        if (request.VariantIds != null && request.VariantIds.Any())
        {
            var spec = new VariantsAndOptionsSpec(request.VariantIds);
            var productVariants = await productVariantRepository.GetListAsync(spec, cancellationToken: cancellationToken);
            
            results.AddRange(mapper.Map<List<VariantDto>>(productVariants));
        }

        if (request.ProductIds != null && request.ProductIds.Any())
        {
            var products = await productRepository.GetAllAsync(
                p => request.ProductIds.Contains(p.Id),
                cancellationToken: cancellationToken
            );
            results.AddRange(mapper.Map<List<VariantDto>>(products));
        }

        return Result<List<VariantDto>>.Success(results);
    }
}