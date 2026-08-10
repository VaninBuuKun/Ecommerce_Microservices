using BuildingBlocks.Shared.Commons;
using Ecommerce.Services.Carts.Api.Models.Dtos;
using Ecommerce.Services.Carts.Api.Models.Entities;

namespace Ecommerce.Services.Carts.Api.Models.Interfaces;

public interface IProductService
{
    Task<Result<ProductDto>> GetProductVariantAsync(Guid variantId);
    Task<Result<List<ProductDto>>> GetProductVariantListAsync(List<string> variantIds, List<string> productIds);
}