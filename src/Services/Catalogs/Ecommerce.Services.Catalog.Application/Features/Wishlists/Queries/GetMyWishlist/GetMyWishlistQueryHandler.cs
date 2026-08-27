using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Wishlists.Queries.GetMyWishlist;

public class GetMyWishlistQueryHandler(
    IEfUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<GetMyWishlistQueryHandler> logger)
    : QueryHandler<GetMyWishlistQuery, List<ProductResponse>>
{
    private readonly IGenericEfRepository<Wishlist, long> _wishlistRepository = unitOfWork.Repository<Wishlist, long>();

    protected override async Task<Result<List<ProductResponse>>> HandleQueryAsync(GetMyWishlistQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var spec = new WishlistByCustomerIdSpec(query.CustomerId);
            var wishlists = await _wishlistRepository.GetListAsync(spec, cancellationToken);

            var products = wishlists
                .Where(w => w.Product != null && w.Product.Status == ProductStatus.Active)
                .Select(w => w.Product)
                .ToList();

            var dtos = mapper.Map<List<ProductResponse>>(products);
            return Result<List<ProductResponse>>.Success(dtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra khi lấy danh sách Wishlist của Customer {CustomerId}", query.CustomerId);
            return Result<List<ProductResponse>>.Failure("Có lỗi xảy ra khi lấy danh sách yêu thích.", EErrorCode.InternalServerError);
        }
    }
}
