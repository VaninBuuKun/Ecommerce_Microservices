using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using BuildingBlocks.Application.InMemoryBus;
using BuildingBlocks.Shared.Commons;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using BuildingBlocks.Shared.InfrastructureInterfaces.Persistence.EFCore;
using Ecommerce.Services.Catalog.Application.Features.Categories.Dtos;
using Ecommerce.Services.Catalog.Application.Features.Search.Dtos;
using Ecommerce.Services.Catalog.Domain;
using Ecommerce.Services.Catalog.Domain.Products;
using Ecommerce.Services.Catalog.Domain.Products.Specifications;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Services.Catalog.Application.Features.Search.Queries.GetSearchSuggestions;

public class GetSearchSuggestionsQueryHandler(
    IEfUnitOfWork unitOfWork,
    ICacheService cacheService,
    ILogger<GetSearchSuggestionsQueryHandler> logger
) : QueryHandler<GetSearchSuggestionsQuery, SearchSuggestionsResponseDto>
{
    private const string CategoryTreeCacheKey = "catalog:categories:tree";
    private readonly IGenericEfRepository<Product, long> _productRepository = unitOfWork.Repository<Product, long>();
    private readonly IGenericEfRepository<Category, long> _categoryRepository = unitOfWork.Repository<Category, long>();

    protected override async Task<Result<SearchSuggestionsResponseDto>> HandleQueryAsync(GetSearchSuggestionsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var rawQuery = query.Query?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(rawQuery))
            {
                return Result<SearchSuggestionsResponseDto>.Success(new SearchSuggestionsResponseDto());
            }

            var cleanKeyword = rawQuery;
            var appliedFilters = new ParsedFiltersDto();

            // 1. Regex Bóc Tách Ý Định Khoảng Giá (Price Intent)
            var rangeMatch = Regex.Match(cleanKeyword, @"từ\s+(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|đ|vnd)?\s+đến\s+(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|đ|vnd)?", RegexOptions.IgnoreCase);
            if (rangeMatch.Success)
            {
                appliedFilters.MinPrice = ParsePrice(rangeMatch.Groups[1].Value, rangeMatch.Groups[2].Value);
                appliedFilters.MaxPrice = ParsePrice(rangeMatch.Groups[3].Value, rangeMatch.Groups[4].Value);
                cleanKeyword = cleanKeyword.Remove(rangeMatch.Index, rangeMatch.Length);
            }
            else
            {
                var maxPriceMatch = Regex.Match(cleanKeyword, @"dưới\s+(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|đ|vnd)?", RegexOptions.IgnoreCase);
                if (maxPriceMatch.Success)
                {
                    appliedFilters.MaxPrice = ParsePrice(maxPriceMatch.Groups[1].Value, maxPriceMatch.Groups[2].Value);
                    cleanKeyword = cleanKeyword.Remove(maxPriceMatch.Index, maxPriceMatch.Length);
                }

                var minPriceMatch = Regex.Match(cleanKeyword, @"trên\s+(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|đ|vnd)?", RegexOptions.IgnoreCase);
                if (minPriceMatch.Success)
                {
                    appliedFilters.MinPrice = ParsePrice(minPriceMatch.Groups[1].Value, minPriceMatch.Groups[2].Value);
                    cleanKeyword = cleanKeyword.Remove(minPriceMatch.Index, minPriceMatch.Length);
                }
            }

            // 2. Regex Bóc Tách Đánh Giá (Rating Intent)
            var ratingMatch = Regex.Match(cleanKeyword, @"(đánh giá cao|review tốt|5 sao|4 sao)", RegexOptions.IgnoreCase);
            if (ratingMatch.Success)
            {
                var text = ratingMatch.Value.ToLowerInvariant();
                appliedFilters.MinRating = text.Contains("5") ? 4.8 : 4.0;
                cleanKeyword = cleanKeyword.Remove(ratingMatch.Index, ratingMatch.Length);
            }

            // 3. Regex Bóc Tách Sắp Xếp Bán Chạy (Best Selling Intent)
            var sortMatch = Regex.Match(cleanKeyword, @"(bán chạy|hot nhất|mua nhiều|top bán chạy)", RegexOptions.IgnoreCase);
            if (sortMatch.Success)
            {
                appliedFilters.SortBy = "sold";
                cleanKeyword = cleanKeyword.Remove(sortMatch.Index, sortMatch.Length);
            }

            // Làm sạch khoảng trắng thừa của từ khóa gốc
            cleanKeyword = Regex.Replace(cleanKeyword, @"\s+", " ").Trim();
            if (string.IsNullOrWhiteSpace(cleanKeyword))
            {
                cleanKeyword = rawQuery;
            }

            // 5. Nạp danh mục (từ Cache hoặc Database)
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

            // Trích xuất toàn bộ SubCategories (ParentId != null) kèm thông tin Parent
            var flatSubCategories = new List<(CategoryDto SubCategory, CategoryDto Parent)>();
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

            // 6. Truy vấn Top 5 Sản phẩm phù hợp nhất qua PostgreSQL
            var spec = new SearchSuggestionsSpec(
                cleanKeyword, 
                null, 
                appliedFilters.MinPrice, 
                appliedFilters.MaxPrice, 
                query.Limit > 0 ? query.Limit : 5
            );

            var products = await _productRepository.GetListAsync(spec, cancellationToken);
            var topProducts = products.Select(p => new ProductSearchPreviewDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                MaxPrice = p.MaxPrice > 0 ? p.MaxPrice : p.Price,
                DiscountPrice = p.DiscountPrice,
                ThumbnailUrl = p.ThumbnailUrl,
                AverageRating = p.AverageRating,
                ReviewCount = p.ReviewCount,
                Sold = p.Sold,
                CategoryId = p.CategoryId
            }).ToList();

            // 7. Tìm kiếm Danh Mục Con (SubCategories) gợi ý (Tối đa 5 mục)
            var cleanNoDiacritics = RemoveDiacritics(cleanKeyword).ToLowerInvariant();
            var rawNoDiacritics = RemoveDiacritics(rawQuery).ToLowerInvariant();
            var tokens = cleanKeyword.Split(new[] { ' ', ',', '-' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => RemoveDiacritics(t).ToLowerInvariant())
                .Where(t => t.Length >= 2)
                .ToList();

            var candidateSubCategories = new List<CategorySuggestionDto>();

            // Ưu tiên 1: Khớp trực tiếp theo Tên SubCategory
            foreach (var (sub, parent) in flatSubCategories)
            {
                var subNoDiacritics = RemoveDiacritics(sub.Name).ToLowerInvariant();
                bool isMatch = subNoDiacritics.Contains(cleanNoDiacritics) ||
                               cleanNoDiacritics.Contains(subNoDiacritics) ||
                               subNoDiacritics.Contains(rawNoDiacritics) ||
                               tokens.Any(token => subNoDiacritics.Contains(token));

                if (isMatch)
                {
                    // Thumbnail: ưu tiên IconUrl của SubCat, nếu không có lấy IconUrl của Parent
                    var img = !string.IsNullOrWhiteSpace(sub.IconUrl) ? sub.IconUrl : parent.IconUrl;
                    candidateSubCategories.Add(new CategorySuggestionDto
                    {
                        Id = sub.Id,
                        Name = sub.Name,
                        ImageUrl = img,
                        ParentId = parent.Id,
                        ParentName = parent.Name
                    });
                }
            }

            // Ưu tiên 2: Nếu chưa đủ 5 danh mục, lấy thêm SubCategory từ top sản phẩm tìm được
            if (candidateSubCategories.Count < 5)
            {
                var productCategoryIds = products
                    .Where(p => p.CategoryId.HasValue)
                    .Select(p => p.CategoryId!.Value)
                    .Distinct()
                    .ToList();

                foreach (var catId in productCategoryIds)
                {
                    if (candidateSubCategories.Any(m => m.Id == catId)) continue;

                    var found = flatSubCategories.FirstOrDefault(pair => pair.SubCategory.Id == catId);
                    if (found.SubCategory != null)
                    {
                        var prodWithImg = products.FirstOrDefault(p => p.CategoryId == catId && !string.IsNullOrEmpty(p.ThumbnailUrl));
                        var img = !string.IsNullOrWhiteSpace(found.SubCategory.IconUrl) 
                            ? found.SubCategory.IconUrl 
                            : prodWithImg?.ThumbnailUrl ?? found.Parent.IconUrl;

                        candidateSubCategories.Add(new CategorySuggestionDto
                        {
                            Id = found.SubCategory.Id,
                            Name = found.SubCategory.Name,
                            ImageUrl = img,
                            ParentId = found.Parent.Id,
                            ParentName = found.Parent.Name
                        });

                        if (candidateSubCategories.Count >= 5) break;
                    }
                }
            }

            // Gán ảnh fallback từ sản phẩm cho danh mục nào chưa có ảnh
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

            // 8. Tạo Suggestions link phụ
            var suggestions = new List<SuggestionItemDto>
            {
                new()
                {
                    Text = cleanKeyword,
                    TargetUrl = BuildTargetUrl(cleanKeyword, appliedFilters, null)
                }
            };

            var response = new SearchSuggestionsResponseDto
            {
                CleanKeyword = cleanKeyword,
                AppliedFilters = appliedFilters,
                SuggestedCategories = suggestedCategories,
                Suggestions = suggestions,
                TopProducts = topProducts
            };

            return Result<SearchSuggestionsResponseDto>.Success(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while processing search suggestions for query '{Query}'", query.Query);
            return Result<SearchSuggestionsResponseDto>.Success(new SearchSuggestionsResponseDto
            {
                CleanKeyword = query.Query,
                Suggestions = new List<SuggestionItemDto>
                {
                    new() { Text = query.Query, TargetUrl = $"/explore?search={Uri.EscapeDataString(query.Query)}" }
                }
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

    private static List<CategoryDto> FlattenCategories(List<CategoryDto> categories)
    {
        var result = new List<CategoryDto>();
        foreach (var cat in categories)
        {
            result.Add(cat);
            if (cat.SubCategories != null && cat.SubCategories.Any())
            {
                result.AddRange(FlattenCategories(cat.SubCategories));
            }
        }
        return result;
    }

    private static string BuildTargetUrl(string keyword, ParsedFiltersDto filters, long? categoryId)
    {
        var queryParams = new List<string> { $"search={Uri.EscapeDataString(keyword)}" };

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            queryParams.Add($"categoryId={categoryId.Value}");
        }
        if (filters.MinPrice.HasValue && filters.MinPrice.Value > 0)
        {
            queryParams.Add($"minPrice={filters.MinPrice.Value}");
        }
        if (filters.MaxPrice.HasValue && filters.MaxPrice.Value > 0)
        {
            queryParams.Add($"maxPrice={filters.MaxPrice.Value}");
        }
        if (filters.MinRating.HasValue)
        {
            queryParams.Add($"minRating={filters.MinRating.Value}");
        }
        if (!string.IsNullOrEmpty(filters.SortBy))
        {
            queryParams.Add($"sort={filters.SortBy}");
        }

        return $"/explore?{string.Join("&", queryParams)}";
    }

    private static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder(capacity: normalizedString.Length);
        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                if (c == 'đ' || c == 'Đ') stringBuilder.Append('d');
                else stringBuilder.Append(c);
            }
        }
        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }
}
