using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.Commons.Models;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Commons.Dtos.Products;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Search.Dtos;
using Ecommerce.Services.Catalog.Domain;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using MapsterMapper;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.SearchProducts;

public class SearchProductsQueryHandler(
    IEfUnitOfWork unitOfWork,
    ICacheService cacheService,
    IMapper mapper,
    ILogger<SearchProductsQueryHandler> logger
) : QueryHandler<SearchProductsQuery, SearchProductsResponseDto>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<Category, long> _categoryRepository = unitOfWork.Repository<Category, long>();

    protected override async Task<Result<SearchProductsResponseDto>> HandleQueryAsync(
        SearchProductsQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            var rawQuery = query.Query?.Trim() ?? string.Empty;
            var cleanKeyword = rawQuery;
            var appliedFilters = new ParsedFiltersDto();

            decimal? effectiveMinPrice = query.MinPrice;
            decimal? effectiveMaxPrice = query.MaxPrice;
            double? effectiveMinRating = query.MinRating;
            string effectiveSortBy = query.SortBy ?? "relevance";

            // 1. Regex Bóc Tách Ý Định Tìm Kiếm nếu có từ khóa
            if (!string.IsNullOrWhiteSpace(cleanKeyword))
            {
                var (parsedCleanKw, parsedFilters) = SearchQueryParser.Parse(cleanKeyword);
                cleanKeyword = parsedCleanKw;
                appliedFilters = parsedFilters;

                effectiveMinPrice ??= appliedFilters.MinPrice;
                effectiveMaxPrice ??= appliedFilters.MaxPrice;
                effectiveMinRating ??= appliedFilters.MinRating;
                if (!string.IsNullOrEmpty(appliedFilters.SortBy) && effectiveSortBy == "relevance")
                {
                    effectiveSortBy = appliedFilters.SortBy;
                }
            }

            // 2. Nạp danh mục từ Redis Cache hoặc Database
            var categoryTree = await cacheService.GetAsync<List<CategoryDto>>(CategoryTreeCacheKey, cancellationToken);
            if (categoryTree == null || !categoryTree.Any())
            {
                var allCategories = await _categoryRepository.GetAllAsync(c => c.IsActive, cancellationToken: cancellationToken);
                var sortedCategories = allCategories.OrderBy(c => c.CreatedDate).ThenBy(c => c.Id).ToList();
                var lookup = sortedCategories.ToLookup(c => c.ParentId);

                CategoryDto MapNode(Category c) => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ParentId = c.ParentId,
                    IconUrl = c.IconUrl,
                    SubCategories = lookup[c.Id]
                        .OrderBy(sub => sub.CreatedDate)
                        .ThenBy(sub => sub.Id)
                        .Select(MapNode)
                        .ToList()
                };

                categoryTree = lookup[null]
                    .OrderBy(root => root.CreatedDate)
                    .ThenBy(root => root.Id)
                    .Select(MapNode)
                    .ToList();

                if (categoryTree.Any())
                {
                    await cacheService.SetAsync(CategoryTreeCacheKey, categoryTree, TimeSpan.FromHours(2), cancellationToken);
                }
            }

            // Trích xuất toàn bộ SubCategories (ParentId != null)
            var flatSubCategories = new List<(CategoryDto Sub, CategoryDto Parent)>();
            if (categoryTree != null)
            {
                foreach (var parent in categoryTree)
                {
                    if (parent.SubCategories != null)
                    {
                        foreach (var sub in parent.SubCategories)
                        {
                            flatSubCategories.Add((sub, parent));
                        }
                    }
                }
            }

            // 3. Xác định Category / SubCategory Filter
            List<long>? targetCategoryIds = null;
            long? targetSingleCategoryId = null;

            if (query.CategoryId.HasValue)
            {
                var isParent = categoryTree?.Any(p => p.Id == query.CategoryId.Value) ?? false;
                if (isParent)
                {
                    targetCategoryIds = new List<long> { query.CategoryId.Value };
                    var childIds = flatSubCategories
                        .Where(pair => pair.Parent.Id == query.CategoryId.Value)
                        .Select(pair => pair.Sub.Id);
                    targetCategoryIds.AddRange(childIds);
                }
                else
                {
                    targetSingleCategoryId = query.CategoryId.Value;
                }
            }
            else if (query.ParentCategoryId.HasValue)
            {
                targetCategoryIds = new List<long> { query.ParentCategoryId.Value };
                var childIds = flatSubCategories
                    .Where(pair => pair.Parent.Id == query.ParentCategoryId.Value)
                    .Select(pair => pair.Sub.Id);
                targetCategoryIds.AddRange(childIds);
            }

            // 4. Tìm kiếm sản phẩm qua PostgreSQL GIN Trigram
            var page = Math.Max(1, query.Page);
            var pageSize = query.PageSize > 0 ? query.PageSize : 36;

            var filterSpec = new ProductsFilterSpec(
                cleanKeyword,
                targetSingleCategoryId,
                effectiveMinRating,
                query.ShopId,
                query.HasDiscount,
                effectiveMinPrice,
                effectiveMaxPrice,
                targetCategoryIds
            );

            var totalCount = await _productRepository.CountAsync(filterSpec, cancellationToken);

            var pagingSpec = new ProductsPaginatedSpec(
                cleanKeyword,
                targetSingleCategoryId,
                effectiveMinRating,
                page,
                pageSize,
                effectiveSortBy,
                query.ShopId,
                query.HasDiscount,
                effectiveMinPrice,
                effectiveMaxPrice,
                targetCategoryIds
            );

            var products = await _productRepository.GetListAsync(pagingSpec, cancellationToken);
            var dtos = mapper.Map<List<ProductResponse>>(products);

            // 4. Tìm kiếm Danh Mục Con (SubCategories) gợi ý (Tối đa 5 mục)
            var candidateSubCategories = new List<CategorySuggestionDto>();

            if (!string.IsNullOrWhiteSpace(cleanKeyword))
            {
                var cleanNoDiacritics = RemoveDiacritics(cleanKeyword).ToLowerInvariant();
                var tokens = cleanKeyword.Split(new[] { ' ', ',', '-' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => RemoveDiacritics(t).ToLowerInvariant())
                    .Where(t => t.Length >= 2)
                    .ToList();

                // Ưu tiên 1: Khớp trực tiếp theo Tên SubCategory
                foreach (var (sub, parent) in flatSubCategories)
                {
                    var subNoDiacritics = RemoveDiacritics(sub.Name).ToLowerInvariant();
                    if (subNoDiacritics.Contains(cleanNoDiacritics) || tokens.Any(t => subNoDiacritics.Contains(t)))
                    {
                        candidateSubCategories.Add(new CategorySuggestionDto
                        {
                            Id = sub.Id,
                            Name = sub.Name,
                            ImageUrl = sub.IconUrl ?? parent.IconUrl,
                            ParentId = parent.Id,
                            ParentName = parent.Name
                        });
                    }
                }

                // Ưu tiên 2: Lấy SubCategory từ các sản phẩm tìm được
                foreach (var prod in products.Take(10))
                {
                    if (prod.CategoryId.HasValue)
                    {
                        var found = flatSubCategories.FirstOrDefault(pair => pair.Sub.Id == prod.CategoryId.Value);
                        if (found.Sub != null && candidateSubCategories.All(c => c.Id != found.Sub.Id))
                        {
                            candidateSubCategories.Add(new CategorySuggestionDto
                            {
                                Id = found.Sub.Id,
                                Name = found.Sub.Name,
                                ImageUrl = found.Sub.IconUrl ?? prod.ThumbnailUrl ?? found.Parent.IconUrl,
                                ParentId = found.Parent.Id,
                                ParentName = found.Parent.Name
                            });
                        }
                    }
                }
            }

            // Gán ảnh fallback thông minh cho SubCategories
            foreach (var cat in candidateSubCategories)
            {
                if (string.IsNullOrEmpty(cat.ImageUrl))
                {
                    var prodWithImg = products.FirstOrDefault(p => p.CategoryId == cat.Id && !string.IsNullOrEmpty(p.ThumbnailUrl));
                    if (prodWithImg != null)
                    {
                        cat.ImageUrl = prodWithImg.ThumbnailUrl;
                    }
                }
            }

            var suggestedCategories = candidateSubCategories
                .GroupBy(c => c.Id)
                .Select(g => g.First())
                .Take(5)
                .ToList();

            var response = new SearchProductsResponseDto
            {
                CleanKeyword = cleanKeyword,
                AppliedFilters = appliedFilters,
                SuggestedCategories = suggestedCategories,
                Products = new PagedResult<ProductResponse>(dtos, totalCount, page, pageSize)
            };

            return Result<SearchProductsResponseDto>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while processing search for query '{Query}'", query.Query);
            return Result<SearchProductsResponseDto>.Success(new SearchProductsResponseDto
            {
                CleanKeyword = query.Query ?? string.Empty,
                Products = new PagedResult<ProductResponse>(new List<ProductResponse>(), 0, query.Page, query.PageSize)
            });
        }
    }

    private static decimal? ParsePrice(string rawValue, string? unit)
    {
        if (string.IsNullOrWhiteSpace(rawValue)) return null;
        var normalized = rawValue.Replace(".", "").Replace(",", ".");
        if (!decimal.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var num))
        {
            return null;
        }

        var u = unit?.Trim().ToLowerInvariant() ?? string.Empty;
        if (u == "k") return num * 1000m;
        if (u == "tr" || u == "triệu") return num * 1000000m;
        if (num < 1000 && (string.IsNullOrEmpty(u) || u == "k")) return num * 1000m;
        return num;
    }

    private static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder(capacity: normalizedString.Length);

        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                if (c == 'đ' || c == 'Đ')
                    stringBuilder.Append('d');
                else
                    stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
