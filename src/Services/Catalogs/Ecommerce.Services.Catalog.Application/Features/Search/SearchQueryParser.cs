using System;
using System.Globalization;
using System.Text.RegularExpressions;
using Ecommerce.Services.Catalog.Application.Features.Search.Dtos;

namespace Ecommerce.Services.Catalog.Application.Features.Search;

public static class SearchQueryParser
{
    public static (string CleanKeyword, ParsedFiltersDto Filters) Parse(string? rawQuery)
    {
        var raw = rawQuery?.Trim() ?? string.Empty;
        var cleanKeyword = raw;
        var appliedFilters = new ParsedFiltersDto();

        if (string.IsNullOrWhiteSpace(cleanKeyword))
        {
            return (string.Empty, appliedFilters);
        }

        // 1. Khoảng giá: từ X đến Y
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

        // 2. Đánh giá: 5 sao, 4 sao, đánh giá cao
        var ratingMatch = Regex.Match(cleanKeyword, @"(đánh giá cao|review tốt|5 sao|4 sao)", RegexOptions.IgnoreCase);
        if (ratingMatch.Success)
        {
            var text = ratingMatch.Value.ToLowerInvariant();
            appliedFilters.MinRating = text.Contains("5") ? 4.8 : 4.0;
            cleanKeyword = cleanKeyword.Remove(ratingMatch.Index, ratingMatch.Length);
        }

        // 3. Sắp xếp: bán chạy, hot nhất, mua nhiều
        var sortMatch = Regex.Match(cleanKeyword, @"(bán chạy|hot nhất|mua nhiều|top bán chạy)", RegexOptions.IgnoreCase);
        if (sortMatch.Success)
        {
            appliedFilters.SortBy = "sold";
            cleanKeyword = cleanKeyword.Remove(sortMatch.Index, sortMatch.Length);
        }

        cleanKeyword = Regex.Replace(cleanKeyword, @"\s+", " ").Trim();
        if (string.IsNullOrWhiteSpace(cleanKeyword))
        {
            cleanKeyword = raw;
        }

        return (cleanKeyword, appliedFilters);
    }

    public static decimal? ParsePrice(string rawValue, string? unit)
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
}
