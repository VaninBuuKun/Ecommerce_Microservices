using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Products.Queries.GetProducts;

public class GetProductsQueryHandler(
    IEfUnitOfWork unitOfWork, 
    IMapper mapper,
    ILogger<GetProductsQueryHandler> logger)
    : QueryHandler<GetProductsQuery, PagedCursorResponse<ProductResponse>>
{
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();

    protected override async Task<Result<PagedCursorResponse<ProductResponse>>> HandleQueryAsync(GetProductsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Giải mã Cursor
            string? lastValue = null;
            long? lastId = null;

            if (!string.IsNullOrEmpty(query.Cursor))
            {
                try
                {
                    var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(query.Cursor));
                    var parts = decoded.Split('|');
                    if (parts.Length == 2)
                    {
                        lastValue = parts[0];
                        lastId = long.Parse(parts[1]);
                    }
                }
                catch
                {
                    return Result<PagedCursorResponse<ProductResponse>>.ValidationFailure("Mã Cursor không hợp lệ.");
                }
            }

            // 2. Phân tích ý định tìm kiếm nếu có SearchTerm (đồng nhất với Search endpoint)
            var searchTerm = query.SearchTerm;
            var minPrice = query.MinPrice;
            var maxPrice = query.MaxPrice;
            var minRating = query.MinRating;
            var sortBy = query.SortBy;

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var (cleanKw, parsedFilters) = Ecommerce.Services.Catalog.Application.Features.Search.SearchQueryParser.Parse(searchTerm);
                searchTerm = cleanKw;
                minPrice ??= parsedFilters.MinPrice;
                maxPrice ??= parsedFilters.MaxPrice;
                minRating ??= parsedFilters.MinRating;
                if ((string.IsNullOrWhiteSpace(sortBy) || sortBy == "newest") && !string.IsNullOrEmpty(parsedFilters.SortBy))
                {
                    sortBy = parsedFilters.SortBy;
                }
            }

            // 3. Dùng Specification của Repo (Không dùng GetQueryable hay AsQueryable trực tiếp)
            var spec = new ProductsWithCursorPaginationSpec(
                searchTerm,
                query.CategoryId,
                minRating,
                sortBy,
                lastValue,
                lastId,
                query.Limit + 1,
                query.ShopId,
                query.HasDiscount,
                minPrice,
                maxPrice
            );

            var products = await _productRepository.GetListAsync(spec, cancellationToken);

            // 3. Kiểm tra trang kế tiếp
            var hasNext = products.Count > query.Limit;
            var itemsToReturn = products.Take(query.Limit).ToList();

            // 4. Tạo NextCursor
            string? nextCursor = null;
            if (hasNext && itemsToReturn.Any())
            {
                var lastItem = itemsToReturn.Last();
                string cursorValue = (query.SortBy ?? "name").ToLower() switch
                {
                    "rating" => lastItem.AverageRating.ToString("F1"),
                    "reviews" => lastItem.ReviewCount.ToString(),
                    "price_asc" or "price_desc" => lastItem.Price.ToString("F2"),
                    "newest" or "oldest" => lastItem.CreatedAt.Ticks.ToString(),
                    "sold" or "best_selling" => lastItem.Sold.ToString(),
                    "discount" => (lastItem.Price - lastItem.DiscountPrice).ToString("F2"),
                    _ => lastItem.Name
                };
                var rawCursor = $"{cursorValue}|{lastItem.Id}";
                nextCursor = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawCursor));
            }

            var dtos = mapper.Map<List<ProductResponse>>(itemsToReturn);
            
            
            return Result<PagedCursorResponse<ProductResponse>>.Success(new PagedCursorResponse<ProductResponse>(dtos, nextCursor, hasNext));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Có lỗi xảy ra khi lấy danh sách sản phẩm phân trang Keyset");
            return Result<PagedCursorResponse<ProductResponse>>.ValidationFailure("Có lỗi xảy ra trong quá trình truy vấn.");
        }
    }
}
