using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.Enums;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetAdminProducts;

public class GetAdminProductsQueryHandler(
    IEfUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<GetAdminProductsQueryHandler> logger
) : QueryHandler<GetAdminProductsQuery, PagedResult<ProductResponse>>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<PagedResult<ProductResponse>>> HandleQueryAsync(
        GetAdminProductsQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            var pageNumber = query.Page;
            var pageSize = query.PageSize;

            ProductStatus? statusEnum = null;
            if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<ProductStatus>(query.Status, true, out var parsedStatus))
            {
                statusEnum = parsedStatus;
            }

            var searchTerm = query.SearchTerm?.Trim().ToLower();

            Expression<Func<Product, bool>> predicate = p =>
                (string.IsNullOrEmpty(searchTerm) || p.Name.ToLower().Contains(searchTerm) || p.Description.ToLower().Contains(searchTerm)) &&
                (!query.CategoryId.HasValue || p.CategoryId == query.CategoryId.Value) &&
                (!query.ShopId.HasValue || p.ShopId == query.ShopId.Value) &&
                (!statusEnum.HasValue || p.Status == statusEnum.Value);

            var totalCount = await _productRepository.CountAsync(predicate, cancellationToken);

            var products = await _productRepository.GetPageAsync(
                pageNumber: pageNumber,
                pageSize: pageSize,
                predicate: predicate,
                orderBy: q => q.OrderByDescending(p => p.CreatedAt),
                cancellationToken: cancellationToken,
                includes: new Expression<Func<Product, object>>[] { p => p.Category! }
            );

            var dtos = mapper.Map<List<ProductResponse>>(products);

            var response = new PagedResult<ProductResponse>(dtos, totalCount, pageNumber, pageSize);
            return Result<PagedResult<ProductResponse>>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi lấy danh sách sản phẩm phân trang cho Admin");
            return Result<PagedResult<ProductResponse>>.Failure($"Lỗi khi truy vấn sản phẩm: {ex.Message}", EErrorCode.InternalServerError);
        }
    }
}
