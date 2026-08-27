using System.Collections.Generic;
using System.Threading.Tasks;
using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Carts.Api.Models.Dtos;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public interface IProductService
{
    Task<Result<ProductDto>> GetProductVariantAsync(long variantId);
    Task<Result<List<ProductDto>>> GetProductVariantListAsync(List<long> variantIds, List<long> productIds);
}