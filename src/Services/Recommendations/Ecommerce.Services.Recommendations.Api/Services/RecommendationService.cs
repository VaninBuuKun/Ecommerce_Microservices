using System.Text.Json;
using BuildingBlocks.Shared.InfrastructureInterfaces.Caching;
using Ecommerce.Services.Recommendations.Api.Models.Dtos;
using Ecommerce.Services.Recommendations.Api.Models.Entities;
using Ecommerce.Services.Recommendations.Api.Models.Interfaces;
using Ecommerce.Services.Recommendations.Api.Persistances;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Services.Recommendations.Api.Services;

public class RecommendationService(
    RecommendationDbContext dbContext,
    ICacheService cacheService,
    ILogger<RecommendationService> logger)
    : IRecommendationService
{
    private const int PageSize = 18;
    private const int MaxPages = 6;
    private const int MaxPoolSize = PageSize * MaxPages; // Tối đa 108 sản phẩm (1 trang đầu + 5 lần bấm Xem thêm)

    // ==========================================
    // 1. STRATEGY 1: SIMILAR PRODUCTS
    // ==========================================
    public async Task<RecommendationResponse> GetSimilarProductsAsync(
        long productId, 
        int limit, 
        CancellationToken cancellationToken = default)
    {
        if (limit <= 0) limit = 12;
        if (limit > 50) limit = 50;

        var cacheKey = $"reco:similar:{productId}:{limit}";
        try
        {
            var cached = await cacheService.GetAsync<RecommendationResponse>(cacheKey, cancellationToken);
            if (cached != null && cached.Items.Count > 0)
            {
                return cached;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read cache for {Key}", cacheKey);
        }

        var targetProduct = await dbContext.MaterializedProducts
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == productId, cancellationToken);

        if (targetProduct == null)
        {
            var fallback = await dbContext.MaterializedProducts
                .AsNoTracking()
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.Sold)
                .Take(limit)
                .ToListAsync(cancellationToken);

            return new RecommendationResponse
            {
                Strategy = "similar",
                Items = fallback.Select(p => MapToDto(p, 1.0, "Sản phẩm bán chạy")).ToList(),
                Total = fallback.Count,
                Page = 1,
                PageSize = limit,
                HasNext = false
            };
        }

        // Candidates: active products excluding current product
        var candidateQuery = dbContext.MaterializedProducts
            .AsNoTracking()
            .Where(p => p.ProductId != productId && p.IsActive);

        // Fetch candidates: same category first (up to 100 candidates for scoring)
        List<MaterializedProduct> candidates;
        if (targetProduct.CategoryId.HasValue)
        {
            candidates = await candidateQuery
                .Where(p => p.CategoryId == targetProduct.CategoryId.Value)
                .OrderByDescending(p => p.Sold)
                .Take(100)
                .ToListAsync(cancellationToken);

            // If category has few items, broaden to other products
            if (candidates.Count < limit * 2)
            {
                var additional = await candidateQuery
                    .Where(p => p.CategoryId != targetProduct.CategoryId.Value)
                    .OrderByDescending(p => p.Sold)
                    .Take(100 - candidates.Count)
                    .ToListAsync(cancellationToken);
                candidates.AddRange(additional);
            }
        }
        else
        {
            candidates = await candidateQuery
                .OrderByDescending(p => p.Sold)
                .Take(100)
                .ToListAsync(cancellationToken);
        }

        var targetAttributes = ParseAttributes(targetProduct.AttributesJson);
        var targetPrice = targetProduct.DiscountPrice > 0 ? targetProduct.DiscountPrice : targetProduct.Price;

        var scored = candidates.Select(c =>
        {
            var candPrice = c.DiscountPrice > 0 ? c.DiscountPrice : c.Price;
            
            // w1: Same Category (0.35)
            double sameCategoryScore = (targetProduct.CategoryId.HasValue && c.CategoryId == targetProduct.CategoryId) ? 1.0 : 0.0;

            // w2: Same Shop (0.10)
            double sameShopScore = (c.ShopId == targetProduct.ShopId) ? 1.0 : 0.0;

            // w3: Price Proximity (0.20): độ gần nhau về giá
            double maxPrice = (double)Math.Max(targetPrice, candPrice);
            double priceDiff = (double)Math.Abs(targetPrice - candPrice);
            double priceProximity = maxPrice > 0 ? Math.Max(0.0, 1.0 - (priceDiff / maxPrice)) : 1.0;

            // w4: Attribute Overlap (0.20)
            var candAttributes = ParseAttributes(c.AttributesJson);
            double attributeOverlap = CalculateJaccardSimilarity(targetAttributes, candAttributes);

            // w5: Popularity Boost (0.15): dựa trên độ phổ biến khi mua, đánh giá sản phẩm.
            double soldNorm = Math.Min(c.Sold, 1000) / 1000.0;
            double ratingNorm = Math.Min(5.0, Math.Max(0.0, c.AverageRating)) / 5.0;
            double popularityBoost = (soldNorm * 0.5) + (ratingNorm * 0.5);

            double totalScore = (0.35 * sameCategoryScore)
                              + (0.10 * sameShopScore)
                              + (0.20 * priceProximity)
                              + (0.20 * attributeOverlap)
                              + (0.15 * popularityBoost);

            string reason = sameCategoryScore > 0 ? "Cùng danh mục & mức giá tương đương" : "Sản phẩm nổi bật đề xuất";

            return new RecommendedProductDto
            {
                Id = c.ProductId,
                ShopId = c.ShopId,
                Name = c.Name,
                Price = c.Price,
                DiscountPrice = c.DiscountPrice,
                ThumbnailUrl = c.ThumbnailUrl,
                Sold = c.Sold,
                AverageRating = c.AverageRating,
                ReviewCount = c.ReviewCount,
                CategoryId = c.CategoryId,
                MatchScore = Math.Round(totalScore, 3),
                RecommendationReason = reason
            };
        })
        .OrderByDescending(x => x.MatchScore)
        .Take(limit)
        .ToList();

        // If scored < 4, backfill with top active products
        if (scored.Count < 4)
        {
            var existingIds = scored.Select(s => s.Id).ToHashSet();
            existingIds.Add(productId);

            var backfill = await dbContext.MaterializedProducts
                .AsNoTracking()
                .Where(p => !existingIds.Contains(p.ProductId) && p.IsActive)
                .OrderByDescending(p => p.Sold)
                .Take(limit - scored.Count)
                .ToListAsync(cancellationToken);

            foreach (var b in backfill)
            {
                scored.Add(MapToDto(b, 0.5, "Gợi ý bổ sung"));
            }
        }

        var response = new RecommendationResponse
        {
            Strategy = "similar",
            Items = scored,
            Total = scored.Count,
            Page = 1,
            PageSize = limit,
            HasNext = false
        };

        try
        {
            await cacheService.SetAsync(cacheKey, response, TimeSpan.FromHours(6), cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to cache similar recommendations for {ProductId}", productId);
        }

        return response;
    }

    // ==========================================
    // 2. STRATEGY 2: PERSONALIZED FOR-YOU FEED
    // ==========================================
    public async Task<RecommendationResponse> GetPersonalizedRecommendationsAsync(
        long? userId, 
        string? sessionId, 
        int page = 1, 
        CancellationToken cancellationToken = default)
    {
        if (page <= 0) page = 1;
        if (page > MaxPages)
        {
            return new RecommendationResponse
            {
                Strategy = "personalized",
                Items = new List<RecommendedProductDto>(),
                Total = MaxPoolSize,
                Page = page,
                PageSize = PageSize,
                HasNext = false
            };
        }

        var identifier = userId.HasValue ? $"u:{userId.Value}" : $"s:{sessionId ?? "guest"}";
        var poolCacheKey = $"reco:pool:for-you:{identifier}";

        List<RecommendedProductDto>? candidatePool = null;

        // Quy tắc thực tế:
        // - Khi page = 1: Bỏ qua cache, luôn luôn tính toán lại pool mới nhất từ database và cập nhật lại Redis.
        // - Khi page >= 2: Đọc trực tiếp từ Redis candidate pool đã sinh ở page 1 (siêu nhanh ~1-2ms).
        if (page >= 2)
        {
            try
            {
                candidatePool = await cacheService.GetAsync<List<RecommendedProductDto>>(poolCacheKey, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read cache for {Key}", poolCacheKey);
            }
        }

        // Nếu là page 1 HOẶC (page >= 2 mà Redis chưa có pool do expire/restart), tự động tính toán tạo pool mới:
        if (candidatePool == null || candidatePool.Count == 0)
        {
            candidatePool = await GeneratePersonalizedCandidatePoolAsync(userId, sessionId, cancellationToken);

            try
            {
                await cacheService.SetAsync(poolCacheKey, candidatePool, TimeSpan.FromHours(2), cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to cache personalized recommendations pool for {Identifier}", identifier);
            }
        }

        var total = candidatePool.Count;
        var pagedItems = candidatePool.Skip((page - 1) * PageSize).Take(PageSize).ToList();
        var hasNext = (page < MaxPages) && ((page * PageSize) < total);

        return new RecommendationResponse
        {
            Strategy = "personalized",
            Items = pagedItems,
            Total = total,
            Page = page,
            PageSize = PageSize,
            HasNext = hasNext
        };
    }

    private async Task<List<RecommendedProductDto>> GeneratePersonalizedCandidatePoolAsync(
        long? userId, 
        string? sessionId, 
        CancellationToken cancellationToken)
    {
        var categoryWeights = new Dictionary<long, double>();
        var excludedProductIds = new HashSet<long>();

        if (userId.HasValue)
        {
            var uid = userId.Value;

            // Signal 1: Purchase History (weight 0.40)
            var purchases = await dbContext.UserPurchaseHistories
                .AsNoTracking()
                .Where(h => h.UserId == uid)
                .OrderByDescending(h => h.PurchasedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            foreach (var p in purchases)
            {
                excludedProductIds.Add(p.ProductId);
                if (p.CategoryId.HasValue)
                {
                    categoryWeights[p.CategoryId.Value] = categoryWeights.GetValueOrDefault(p.CategoryId.Value) + 0.40;
                }
            }

            // Signal 2: Wishlist (weight 0.20)
            var wishlists = await dbContext.UserWishlistItems
                .AsNoTracking()
                .Where(w => w.UserId == uid && w.IsActive)
                .Take(50)
                .ToListAsync(cancellationToken);

            foreach (var w in wishlists)
            {
                if (w.CategoryId.HasValue)
                {
                    categoryWeights[w.CategoryId.Value] = categoryWeights.GetValueOrDefault(w.CategoryId.Value) + 0.20;
                }
            }

            // Signal 3: Product Views in last 30 days (weight 0.25)
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var views = await dbContext.ProductViews
                .AsNoTracking()
                .Where(v => v.UserId == uid && v.ViewedAt >= thirtyDaysAgo)
                .OrderByDescending(v => v.ViewedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            foreach (var v in views)
            {
                if (v.CategoryId.HasValue)
                {
                    categoryWeights[v.CategoryId.Value] = categoryWeights.GetValueOrDefault(v.CategoryId.Value) + 0.25;
                }
            }
        }
        else if (!string.IsNullOrWhiteSpace(sessionId))
        {
            // Guest session view tracking (last 7 days)
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var views = await dbContext.ProductViews
                .AsNoTracking()
                .Where(v => v.SessionId == sessionId && v.ViewedAt >= sevenDaysAgo)
                .OrderByDescending(v => v.ViewedAt)
                .Take(30)
                .ToListAsync(cancellationToken);

            foreach (var v in views)
            {
                if (v.CategoryId.HasValue)
                {
                    categoryWeights[v.CategoryId.Value] = categoryWeights.GetValueOrDefault(v.CategoryId.Value) + 0.30;
                }
            }
        }

        var candidatePool = new List<RecommendedProductDto>();

        if (categoryWeights.Count > 0)
        {
            var topCategoryIds = categoryWeights
                .OrderByDescending(kv => kv.Value)
                .Take(5)
                .Select(kv => kv.Key)
                .ToList();

            var candidateProducts = await dbContext.MaterializedProducts
                .AsNoTracking()
                .Where(p => p.IsActive 
                         && p.CategoryId.HasValue 
                         && topCategoryIds.Contains(p.CategoryId.Value)
                         && !excludedProductIds.Contains(p.ProductId))
                .Take(MaxPoolSize)
                .ToListAsync(cancellationToken);

            double maxWeight = categoryWeights.Values.DefaultIfEmpty(1.0).Max();

            var scored = candidateProducts.Select(p =>
            {
                double catWeight = 0.0;
                if (p.CategoryId.HasValue && categoryWeights.TryGetValue(p.CategoryId.Value, out double w))
                {
                    catWeight = w / maxWeight;
                }

                double soldNorm = Math.Min(p.Sold, 1000) / 1000.0;
                double ratingNorm = p.AverageRating / 5.0;

                double score = (catWeight * 0.50) + (soldNorm * 0.30) + (ratingNorm * 0.20);

                return new RecommendedProductDto
                {
                    Id = p.ProductId,
                    ShopId = p.ShopId,
                    Name = p.Name,
                    Price = p.Price,
                    DiscountPrice = p.DiscountPrice,
                    ThumbnailUrl = p.ThumbnailUrl,
                    Sold = p.Sold,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    CategoryId = p.CategoryId,
                    MatchScore = Math.Round(score, 3),
                    RecommendationReason = "Dựa trên sở thích & lịch sử xem của bạn"
                };
            })
            .OrderByDescending(x => x.MatchScore)
            .Take(MaxPoolSize)
            .ToList();

            candidatePool.AddRange(scored);
        }

        // Bổ sung các sản phẩm xu hướng / bán chạy nếu pool chưa đủ 108 sản phẩm (để đảm bảo đủ tối đa 6 trang)
        if (candidatePool.Count < MaxPoolSize)
        {
            var existingIds = candidatePool.Select(r => r.Id).ToHashSet();
            foreach (var ex in excludedProductIds) existingIds.Add(ex);

            var filler = await dbContext.MaterializedProducts
                .AsNoTracking()
                .Where(p => p.IsActive && !existingIds.Contains(p.ProductId))
                .OrderByDescending(p => p.Sold)
                .ThenByDescending(p => p.AverageRating)
                .Take(MaxPoolSize - candidatePool.Count)
                .ToListAsync(cancellationToken);

            foreach (var f in filler)
            {
                candidatePool.Add(MapToDto(f, 0.4, "Sản phẩm xu hướng nổi bật"));
            }
        }

        return candidatePool;
    }

    // ==========================================
    // 3. STRATEGY 3: TRENDING PRODUCTS
    // ==========================================
    public async Task<RecommendationResponse> GetTrendingProductsAsync(
        int page = 1, 
        CancellationToken cancellationToken = default)
    {
        if (page <= 0) page = 1;
        if (page > MaxPages)
        {
            return new RecommendationResponse
            {
                Strategy = "trending",
                Items = new List<RecommendedProductDto>(),
                Total = MaxPoolSize,
                Page = page,
                PageSize = PageSize,
                HasNext = false
            };
        }

        var poolCacheKey = "reco:pool:trending";
        List<RecommendedProductDto>? trendingPool = null;

        // Quy tắc thực tế:
        // - Khi page = 1: Bỏ qua cache, luôn luôn tính toán lại pool trending mới nhất và cập nhật lại Redis.
        // - Khi page >= 2: Đọc trực tiếp từ Redis pool.
        if (page >= 2)
        {
            try
            {
                trendingPool = await cacheService.GetAsync<List<RecommendedProductDto>>(poolCacheKey, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read cache for {Key}", poolCacheKey);
            }
        }

        if (trendingPool == null || trendingPool.Count == 0)
        {
            trendingPool = await GenerateTrendingCandidatePoolAsync(cancellationToken);

            try
            {
                await cacheService.SetAsync(poolCacheKey, trendingPool, TimeSpan.FromHours(1), cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to cache trending pool");
            }
        }

        var total = trendingPool.Count;
        var pagedItems = trendingPool.Skip((page - 1) * PageSize).Take(PageSize).ToList();
        var hasNext = (page < MaxPages) && ((page * PageSize) < total);

        return new RecommendationResponse
        {
            Strategy = "trending",
            Items = pagedItems,
            Total = total,
            Page = page,
            PageSize = PageSize,
            HasNext = hasNext
        };
    }

    private async Task<List<RecommendedProductDto>> GenerateTrendingCandidatePoolAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var dayAgo = now.AddHours(-24);
        var weekAgo = now.AddDays(-7);

        // Aggregate 24h views
        var viewCounts = await dbContext.ProductViews
            .AsNoTracking()
            .Where(v => v.ViewedAt >= dayAgo)
            .GroupBy(v => v.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count, cancellationToken);

        // Aggregate 7d purchases
        var purchaseCounts = await dbContext.UserPurchaseHistories
            .AsNoTracking()
            .Where(h => h.PurchasedAt >= weekAgo)
            .GroupBy(h => h.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count, cancellationToken);

        // Aggregate 7d wishlist adds
        var wishlistCounts = await dbContext.UserWishlistItems
            .AsNoTracking()
            .Where(w => w.ToggledAt >= weekAgo && w.IsActive)
            .GroupBy(w => w.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProductId, x => x.Count, cancellationToken);

        // Active candidate products
        var activeProducts = await dbContext.MaterializedProducts
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.Sold)
            .Take(150)
            .ToListAsync(cancellationToken);

        var scored = activeProducts.Select(p =>
        {
            viewCounts.TryGetValue(p.ProductId, out var views);
            purchaseCounts.TryGetValue(p.ProductId, out var purchases);
            wishlistCounts.TryGetValue(p.ProductId, out var wishlists);

            double score = (views * 1.0)
                         + (purchases * 5.0)
                         + (wishlists * 2.0)
                         + (p.Sold * 0.05)
                         + (p.AverageRating * Math.Min(p.ReviewCount, 20) * 0.1);

            return new RecommendedProductDto
            {
                Id = p.ProductId,
                ShopId = p.ShopId,
                Name = p.Name,
                Price = p.Price,
                DiscountPrice = p.DiscountPrice,
                ThumbnailUrl = p.ThumbnailUrl,
                Sold = p.Sold,
                AverageRating = p.AverageRating,
                ReviewCount = p.ReviewCount,
                CategoryId = p.CategoryId,
                MatchScore = Math.Round(score, 2),
                RecommendationReason = "Được săn đón nhiều nhất hôm nay"
            };
        })
        .OrderByDescending(x => x.MatchScore)
        .Take(MaxPoolSize)
        .ToList();

        // Bổ sung nếu chưa đủ 108
        if (scored.Count < MaxPoolSize)
        {
            var existingIds = scored.Select(s => s.Id).ToHashSet();
            var filler = await dbContext.MaterializedProducts
                .AsNoTracking()
                .Where(p => p.IsActive && !existingIds.Contains(p.ProductId))
                .OrderByDescending(p => p.Sold)
                .ThenByDescending(p => p.AverageRating)
                .Take(MaxPoolSize - scored.Count)
                .ToListAsync(cancellationToken);

            foreach (var f in filler)
            {
                scored.Add(MapToDto(f, 0.4, "Sản phẩm xu hướng nổi bật"));
            }
        }

        return scored;
    }


    private static RecommendedProductDto MapToDto(MaterializedProduct p, double score, string reason)
    {
        return new RecommendedProductDto
        {
            Id = p.ProductId,
            ShopId = p.ShopId,
            Name = p.Name,
            Price = p.Price,
            DiscountPrice = p.DiscountPrice,
            ThumbnailUrl = p.ThumbnailUrl,
            Sold = p.Sold,
            AverageRating = p.AverageRating,
            ReviewCount = p.ReviewCount,
            CategoryId = p.CategoryId,
            MatchScore = score,
            RecommendationReason = reason
        };
    }

    private static HashSet<string> ParseAttributes(string? json)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(json)) return result;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    var key = (element.TryGetProperty("key", out var kp) || element.TryGetProperty("Key", out kp)) ? kp.GetString() : null;
                    var val = (element.TryGetProperty("value", out var vp) || element.TryGetProperty("Value", out vp)) ? vp.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(val))
                    {
                        result.Add($"{key.Trim()}:{val.Trim()}");
                    }
                }
            }
        }
        catch
        {
            // Invalid JSON
        }
        return result;
    }

    private static double CalculateJaccardSimilarity(HashSet<string> setA, HashSet<string> setB)
    {
        if (setA.Count == 0 && setB.Count == 0) return 0.5; // neutral when both lack attributes
        if (setA.Count == 0 || setB.Count == 0) return 0.1;

        int intersection = 0;
        foreach (var item in setA)
        {
            if (setB.Contains(item)) intersection++;
        }

        int union = setA.Count + setB.Count - intersection;
        return union > 0 ? (double)intersection / union : 0.0;
    }
}
