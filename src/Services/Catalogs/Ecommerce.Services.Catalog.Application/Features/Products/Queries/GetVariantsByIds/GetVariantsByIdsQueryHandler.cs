using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Products.Dtos;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using MediatR;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries;

public class GetVariantsByIdsQueryHandler(IEfUnitOfWork unitOfWork, IMapper mapper) : IRequestHandler<GetVariantsByIdsQuery, Result<List<VariantDto>>>
{
    public async Task<Result<List<VariantDto>>> Handle(GetVariantsByIdsQuery request, CancellationToken cancellationToken)
    {
        var productVariantRepository = unitOfWork.Repository<ProductVariant, long>();
        var results = new List<VariantDto>();

        var variantIds = (request.VariantIds ?? new List<long>()).Where(id => id > 0).Distinct().ToList();

        if (variantIds.Any())
        {
            var spec = new VariantsAndOptionsSpec(variantIds);
            var productVariants = await productVariantRepository.GetListAsync(spec, cancellationToken: cancellationToken);
            
            var mappedVariants = mapper.Map<List<VariantDto>>(productVariants);
            results.AddRange(mappedVariants);
        }

        // Xử lý fallback cho ProductIds nếu có
        var productIds = (request.ProductIds ?? new List<long>()).Where(id => id > 0).Distinct().ToList();
        if (productIds.Any())
        {
            var productRepo = unitOfWork.Repository<Product, long>();
            var products = await productRepo.GetAllAsync(
                p => productIds.Contains(p.Id),
                cancellationToken: cancellationToken,
                includes: [p => p.Variants]
            );

            foreach (var product in products)
            {
                var defaultVariant = product.Variants.FirstOrDefault(v => !v.IsDeleted);
                if (defaultVariant != null && !results.Any(r => r.Id == defaultVariant.Id))
                {
                    results.Add(mapper.Map<VariantDto>(defaultVariant));
                }
            }
        }

        return Result<List<VariantDto>>.Success(results);
    }
}
